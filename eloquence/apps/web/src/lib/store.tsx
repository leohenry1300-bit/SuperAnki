import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  createDemoAccount, DEFAULT_SETTINGS, summarize, uid,
  type AccountState, type DiagnosticStepResult, type Frequency, type Goal, type Level, type ProgressSummary,
  type SessionResult, type WeeklyGoals,
} from "@eloquence/core";
import { ApiError, fetchServerConfig, getToken, http, setToken, type ServerConfig } from "./http";
import { LocalBackend, RemoteBackend, type Backend, type RewriteResult, type SubmitInput, type UserPatch } from "./backend";
import { clearClips } from "./audioStore";

export type Mode = "none" | "guest" | "demo" | "account";

export interface OnboardingProfile {
  firstName: string;
  goals: Goal[];
  level: Level;
  frequency: Frequency;
}

interface Toast { id: string; text: string; tone: "info" | "success" | "error" }

interface Ctx {
  status: "booting" | "ready" | "error";
  bootError: string | null;
  mode: Mode;
  account: AccountState | null;
  summary: ProgressSummary | null;
  server: ServerConfig | null;
  toasts: Toast[];
  retryBoot(): void;
  startGuest(profile: OnboardingProfile): void;
  provisionAccount(profile: OnboardingProfile): Promise<void>;
  login(email: string, password: string): Promise<void>;
  startDemo(): void;
  logout(): Promise<void>;
  deleteAccount(): Promise<void>;
  submitSession(input: SubmitInput): Promise<SessionResult>;
  deleteSession(id: string): Promise<void>;
  sendCoach(text: string): Promise<void>;
  clearCoach(): Promise<void>;
  updateMe(patch: UserPatch): Promise<void>;
  createProgramFromGoal(goalText: string): Promise<void>;
  createProgramFromTemplate(templateId: string): Promise<void>;
  deleteProgram(): Promise<void>;
  finalizeDiagnostic(steps: DiagnosticStepResult[]): Promise<void>;
  markLibraryRead(lessonId: string): Promise<void>;
  completeChallenge(challengeId: string, date: string): Promise<void>;
  uncompleteChallenge(challengeId: string, date: string): Promise<void>;
  importBackup(raw: unknown): Promise<void>;
  rewrite(sessionId: string, transcript: string): Promise<RewriteResult>;
  modelAnswer(session: AccountState["sessions"][number]): Promise<string | null>;
  weeklyGoals(): Promise<WeeklyGoals>;
  toast(text: string, tone?: Toast["tone"]): void;
  setGuestTheme(theme: "system" | "light" | "dark"): void;
}

const StoreContext = createContext<Ctx | null>(null);

const LOCAL_KEY = "eloquence:local";
const THEME_KEY = "eloquence:theme";

function readLocal(): { mode: "guest" | "demo"; account: AccountState } | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocal(mode: "guest" | "demo" | null, account: AccountState | null) {
  try {
    if (!mode || !account) localStorage.removeItem(LOCAL_KEY);
    else localStorage.setItem(LOCAL_KEY, JSON.stringify({ mode, account }));
  } catch { /* quota or private mode: keeps working in memory */ }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Ctx["status"]>("booting");
  const [bootError, setBootError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("none");
  const [account, setAccount] = useState<AccountState | null>(null);
  const [server, setServer] = useState<ServerConfig | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [guestTheme, setGuestThemeState] = useState<"system" | "light" | "dark">(() => {
    try { return (localStorage.getItem(THEME_KEY) as "light" | "dark" | null) ?? "system"; } catch { return "system"; }
  });
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const accountRef = useRef(account);
  accountRef.current = account;

  const local = useMemo(() => new LocalBackend((s) => writeLocal(modeRef.current === "demo" ? "demo" : "guest", s)), []);
  const remote = useMemo(() => new RemoteBackend(), []);
  const backend: Backend = mode === "account" ? remote : local;

  const toast = useCallback((text: string, tone: Toast["tone"] = "info") => {
    const id = uid("t");
    setToasts((t) => [...t.slice(-2), { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  // ---- Boot --------------------------------------------------------------

  const boot = useCallback(async () => {
    setStatus("booting");
    setBootError(null);
    const cfg = await fetchServerConfig();
    setServer(cfg);
    const token = getToken();
    if (token && cfg) {
      try {
        const state = await http<AccountState>("GET", "/api/state");
        setAccount(state);
        setMode("account");
        setStatus("ready");
        return;
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) setToken(null);
        else {
          setBootError((e as Error).message);
          setStatus("error");
          return;
        }
      }
    }
    const saved = readLocal();
    // A guest profile was created earlier as a fallback (server unreachable
    // at the time). Now that the server answers, migrate it silently into a
    // real, persistent account instead of leaving it stuck on this device.
    if (saved?.mode === "guest" && cfg) {
      try {
        const a = saved.account;
        const r = await http<{ token: string; state: AccountState }>("POST", "/api/auth/anonymous", {
          firstName: a.user.firstName,
          profile: { goals: a.user.goals, goalText: a.user.goalText, level: a.user.level, frequency: a.user.frequency },
          importState: { sessions: a.sessions, coach: a.coach, program: a.program, badges: a.badges, diagnostic: a.diagnostic, completedChallenges: a.completedChallenges },
        });
        setToken(r.token);
        writeLocal(null, null);
        setAccount(r.state);
        setMode("account");
        setStatus("ready");
        return;
      } catch {
        // Fall through and keep using the local guest profile for now.
      }
    }
    if (saved) {
      if (saved.mode === "demo") {
        const fresh = createDemoAccount();
        const lastDemo = saved.account.sessions.find((s) => s.id.startsWith("demo_"));
        const isStale = !lastDemo || new Date(lastDemo.createdAt).toDateString() !== new Date(fresh.sessions[0].createdAt).toDateString();
        const own = saved.account.sessions.filter((s) => !s.id.startsWith("demo_"));
        const account = isStale
          ? { ...fresh, user: { ...fresh.user, ...saved.account.user, isDemo: true }, sessions: [...own, ...fresh.sessions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), coach: saved.account.coach }
          : saved.account;
        setAccount(account);
        writeLocal("demo", account);
      } else {
        setAccount(saved.account);
      }
      setMode(saved.mode);
    }
    setStatus("ready");
  }, []);

  useEffect(() => { void boot(); }, [boot]);

  // ---- Theme -------------------------------------------------------------

  const theme = account?.user.settings.theme ?? guestTheme;
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      root.dataset.theme = dark ? "dark" : "light";
      document.querySelector('meta[name="theme-color"]:not([media])')?.remove();
      const meta = document.createElement("meta");
      meta.name = "theme-color";
      meta.content = dark ? "#0C0E16" : "#F6F5F1";
      document.head.appendChild(meta);
    };
    apply();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);

  const setGuestTheme = useCallback((t: "system" | "light" | "dark") => {
    setGuestThemeState(t);
    try { localStorage.setItem(THEME_KEY, t); } catch { /* ignore */ }
  }, []);

  // ---- Auth & modes ------------------------------------------------------

  const enterAccount = (token: string, state: AccountState) => {
    setToken(token);
    writeLocal(null, null);
    void clearClips();
    setAccount(state);
    setMode("account");
  };

  const startGuest = useCallback((p: OnboardingProfile) => {
    const account: AccountState = {
      user: {
        id: uid("guest_"),
        firstName: p.firstName,
        email: null,
        avatar: null,
        goals: p.goals.length ? p.goals : ["aisance"],
        goalText: null,
        level: p.level,
        frequency: p.frequency,
        createdAt: new Date().toISOString(),
        settings: { ...DEFAULT_SETTINGS, theme: guestTheme, sessionSeconds: p.frequency === "5" ? 45 : 60 },
        diagnosticDone: false,
      },
      sessions: [],
      program: null,
      coach: [],
      badges: [],
      diagnostic: null,
      completedChallenges: [],
    };
    modeRef.current = "guest";
    writeLocal("guest", account);
    setAccount(account);
    setMode("guest");
  }, [guestTheme]);

  const startDemo = useCallback(() => {
    const account = createDemoAccount();
    modeRef.current = "demo";
    writeLocal("demo", account);
    setAccount(account);
    setMode("demo");
  }, []);

  /**
   * Silently creates the (single, personal) account on the server — no
   * email, no password, no form: just the onboarding answers. Falls back to
   * the fully local "guest" mode when no server is reachable (e.g. a static
   * deployment), so the app still works either way.
   */
  const provisionAccount = useCallback(async (p: OnboardingProfile) => {
    if (!server) { startGuest(p); return; }
    try {
      const r = await http<{ token: string; state: AccountState }>("POST", "/api/auth/anonymous", {
        firstName: p.firstName,
        profile: { goals: p.goals, level: p.level, frequency: p.frequency },
      });
      enterAccount(r.token, r.state);
    } catch {
      startGuest(p);
    }
  }, [server, startGuest]);

  const login = useCallback(async (email: string, password: string) => {
    const r = await http<{ token: string; state: AccountState }>("POST", "/api/auth/login", { email, password });
    enterAccount(r.token, r.state);
  }, []);

  const logout = useCallback(async () => {
    setToken(null);
    writeLocal(null, null);
    await clearClips();
    setAccount(null);
    setMode("none");
  }, []);

  const deleteAccount = useCallback(async () => {
    if (modeRef.current === "account") await http("DELETE", "/api/me");
    await logout();
  }, [logout]);

  // ---- Account operations -------------------------------------------------

  const withAccount = useCallback(async <T,>(fn: (b: Backend, s: AccountState) => Promise<T>): Promise<T> => {
    const s = accountRef.current;
    if (!s) throw new ApiError(0, "no_account", "Aucun profil actif.");
    try {
      return await fn(backend, s);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401 && modeRef.current === "account") {
        toast("Ta session a expiré. Reconnecte-toi.", "error");
        await logout();
      }
      throw e;
    }
  }, [backend, logout, toast]);

  const apply = (s: AccountState) => { accountRef.current = s; setAccount(s); };

  const ctx: Ctx = {
    status, bootError, mode, account, server, toasts,
    summary: account ? summarize(account.sessions, account.badges) : null,
    retryBoot: () => void boot(),
    startGuest, provisionAccount, login, startDemo, logout, deleteAccount,
    submitSession: (input) => withAccount(async (b, s) => {
      const r = await b.submitSession(s, input);
      apply(r.state);
      return r.result;
    }),
    deleteSession: (id) => withAccount(async (b, s) => apply(await b.deleteSession(s, id))),
    sendCoach: (text) => withAccount(async (b, s) => {
      const pending = { id: uid("pending_"), role: "user" as const, text, createdAt: new Date().toISOString() };
      setAccount({ ...s, coach: [...s.coach, pending] });
      try {
        apply(await b.sendCoach(s, text));
      } catch (e) {
        setAccount(s);
        throw e;
      }
    }),
    clearCoach: () => withAccount(async (b, s) => apply(await b.clearCoach(s))),
    updateMe: (patch) => withAccount(async (b, s) => apply(await b.updateMe(s, patch))),
    createProgramFromGoal: (goalText) => withAccount(async (b, s) => apply(await b.createProgramFromGoal(s, goalText))),
    createProgramFromTemplate: (templateId) => withAccount(async (b, s) => apply(await b.createProgramFromTemplate(s, templateId))),
    deleteProgram: () => withAccount(async (b, s) => apply(await b.deleteProgram(s))),
    finalizeDiagnostic: (steps) => withAccount(async (b, s) => apply(await b.finalizeDiagnostic(s, steps))),
    markLibraryRead: (lessonId) => withAccount(async (b, s) => apply(await b.markLibraryRead(s, lessonId))),
    completeChallenge: (challengeId, date) => withAccount(async (b, s) => apply(await b.completeChallenge(s, challengeId, date))),
    uncompleteChallenge: (challengeId, date) => withAccount(async (b, s) => apply(await b.uncompleteChallenge(s, challengeId, date))),
    importBackup: (raw) => withAccount(async (b, s) => apply(await b.importBackup(s, raw))),
    rewrite: (sessionId, transcript) => withAccount((b) => b.rewrite(sessionId, transcript)),
    modelAnswer: (session) => withAccount((b) => b.modelAnswer(session)),
    weeklyGoals: () => withAccount((b, s) => b.weeklyGoals(s)),
    toast,
    setGuestTheme,
  };

  return <StoreContext.Provider value={ctx}>{children}</StoreContext.Provider>;
}

export function useStore(): Ctx {
  const c = useContext(StoreContext);
  if (!c) throw new Error("useStore outside provider");
  return c;
}

/** Account is guaranteed on routes behind the app shell. */
export function useAccount() {
  const s = useStore();
  return { ...s, account: s.account!, summary: s.summary! };
}
