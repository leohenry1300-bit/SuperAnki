import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { getExercise, getGame, buildGameActivity, CHALLENGES } from "@eloquence/core";
import { createApp } from "./app";
import { loadConfig } from "./config";
import { SqliteStore } from "./store/sqlite";
import { ClientTranscriptStt } from "./providers/stt";
import { HeuristicLlm } from "./providers/llm";
import { ConsoleMailer, LocalDiskStorage } from "./providers/services";

let server: Server;
let base: string;
let dir: string;
let token = "";

const MESSY = "Bonjour, euh, je suis étudiant et, du coup, je cherche un stage. Du coup, euh, j'aime le marketing et en fait je suis motivé. Du coup voilà.";
const CLEAN = "Bonjour, je m'appelle Alex. D'abord, j'étudie le marketing à Nantes. Ensuite, j'ai mené une campagne qui a doublé les inscriptions d'une association. Par exemple, nous avons touché dix mille personnes en un mois. Pour conclure, je cherche un stage où apprendre vite.";

async function api(method: string, url: string, body?: unknown, auth = true) {
  const headers: Record<string, string> = {};
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  let payload: FormData | string | undefined;
  if (body instanceof FormData) payload = body;
  else if (body !== undefined) { headers["Content-Type"] = "application/json"; payload = JSON.stringify(body); }
  const res = await fetch(base + url, { method, headers, body: payload });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { status: res.status, body: (await res.json()) as any };
}

function sessionForm(exerciseId: string, transcript: string, opts: { withAudio?: boolean; source?: string } = {}) {
  const exercise = getExercise(exerciseId)!;
  const f = new FormData();
  f.append("meta", JSON.stringify({ exercise, source: opts.source ?? "catalogue", capture: { transcript, durationSec: 20, source: "speech" } }));
  if (opts.withAudio) f.append("audio", new Blob([new Uint8Array([26, 69, 223, 163, 1, 2, 3])], { type: "audio/webm" }), "a.webm");
  return f;
}

function gameForm(gameId: string, transcript: string) {
  const { exercise, constraint } = buildGameActivity(getGame(gameId)!);
  const f = new FormData();
  f.append("meta", JSON.stringify({ exercise, constraint, source: "jeu", capture: { transcript, durationSec: 20, source: "speech" } }));
  return f;
}

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), "eloq-"));
  const config = loadConfig({ DATA_DIR: dir, JWT_SECRET: "test-secret", WEB_DIST: path.join(dir, "none"), GOOGLE_CLIENT_ID: "cid" });
  const app = createApp({
    config,
    store: new SqliteStore(path.join(dir, "db.sqlite")),
    stt: new ClientTranscriptStt(),
    llm: new HeuristicLlm(),
    storage: new LocalDiskStorage(path.join(dir, "audio")),
    mailer: { name: "console", send: async () => {} } as ConsoleMailer,
    verifyGoogle: async (cred) => (cred === "good" ? { sub: "g1", email: "g@ex.com", firstName: "Gaby", picture: null } : null),
  });
  server = app.listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server.close();
  rmSync(dir, { recursive: true, force: true });
});

describe("API", () => {
  it("signs up with multiple goals, rejects duplicates and bad logins", async () => {
    const r = await api("POST", "/api/auth/signup", { firstName: "Alex", email: "Alex@Ex.com", password: "motdepasse", profile: { goals: ["entretiens", "confiance"], level: "debutant" } });
    expect(r.status).toBe(201);
    token = r.body.token;
    expect(r.body.state.user.email).toBe("alex@ex.com");
    expect(r.body.state.user.goals).toEqual(["entretiens", "confiance"]);
    expect(r.body.state.user.passwordHash).toBeUndefined();
    expect((await api("POST", "/api/auth/signup", { firstName: "A", email: "alex@ex.com", password: "motdepasse" })).status).toBe(409);
    expect((await api("POST", "/api/auth/login", { email: "alex@ex.com", password: "wrong-pass" }, false)).status).toBe(401);
    expect((await api("POST", "/api/auth/signup", { firstName: "B", email: "b@ex.com", password: "court" })).body.message).toBe("8 caractères minimum");
  });

  it("requires auth", async () => {
    expect((await api("GET", "/api/state", undefined, false)).status).toBe(401);
  });

  it("provisions an anonymous account with no email or password", async () => {
    const r = await api("POST", "/api/auth/anonymous", { firstName: "Sam", profile: { goals: ["aisance"] } }, false);
    expect(r.status).toBe(201);
    expect(r.body.state.user.email).toBeNull();
    expect(r.body.state.user.firstName).toBe("Sam");
    expect(r.body.token).toBeTruthy();
  });

  it("analyses a session, stores audio, then compares a retry — no daily or history limits anywhere", async () => {
    const first = await api("POST", "/api/sessions", sessionForm("entretien-presentation", MESSY, { withAudio: true }));
    expect(first.status).toBe(201);
    expect(first.body.session.analysis.metrics.fillers["du coup"]).toBe(3);
    expect(first.body.comparison).toBeNull();
    expect(first.body.newBadges.map((b: { id: string }) => b.id)).toContain("first");
    expect(first.body.session.audioUrl).toMatch(/^\/api\/audio\//);
    const audio = await fetch(base + first.body.session.audioUrl);
    expect(audio.status).toBe(200);
    expect(audio.headers.get("accept-ranges")).toBe("bytes");
    expect((await fetch(base + first.body.session.audioUrl.replace(/sig=[^&]+/, "sig=bad"))).status).toBe(403);

    // Safari requires a working Range response to play <audio> at all.
    const ranged = await fetch(base + first.body.session.audioUrl, { headers: { Range: "bytes=1-3" } });
    expect(ranged.status).toBe(206);
    expect(ranged.headers.get("content-range")).toMatch(/^bytes 1-3\/\d+$/);
    expect((await ranged.arrayBuffer()).byteLength).toBe(3);

    const retry = await api("POST", "/api/sessions", sessionForm("entretien-presentation", CLEAN));
    expect(retry.status).toBe(201);
    expect(retry.body.comparison.delta).toBeGreaterThan(0);
    expect(retry.body.session.attempt).toBe(2);

    // Run many sessions in a row: nothing gates this in a personal app.
    for (let i = 0; i < 6; i++) {
      const r = await api("POST", "/api/sessions", sessionForm("impro-passion", CLEAN));
      expect(r.status).toBe(201);
    }

    const state = await api("GET", "/api/state");
    expect(state.body.sessions.length).toBeGreaterThanOrEqual(8);
  });

  it("tracks real-life challenge completions, self-reported only, per day", async () => {
    const id = CHALLENGES[0].id;
    const today = new Date().toISOString().slice(0, 10);
    const done = await api("POST", `/api/challenges/${id}/done`, { date: today });
    expect(done.status).toBe(201);
    let state = await api("GET", "/api/state");
    expect(state.body.completedChallenges).toContainEqual(expect.objectContaining({ challengeId: id, date: today }));

    const removed = await api("DELETE", `/api/challenges/${id}/done?date=${today}`);
    expect(removed.status).toBe(200);
    state = await api("GET", "/api/state");
    expect(state.body.completedChallenges.some((c: { challengeId: string }) => c.challengeId === id)).toBe(false);

    expect((await api("POST", "/api/challenges/not-a-real-id/done", { date: today })).status).toBe(404);
  });

  it("exports then re-imports a backup into another account", async () => {
    const exported = await api("GET", "/api/me/export");
    expect(exported.status).toBe(200);
    expect(exported.body.sessions.length).toBeGreaterThan(0);

    const other = await api("POST", "/api/auth/anonymous", { firstName: "Robin" }, false);
    const savedToken = token;
    token = other.body.token;
    try {
      const before = await api("GET", "/api/state");
      expect(before.body.sessions).toHaveLength(0);

      const imported = await api("POST", "/api/me/import", exported.body);
      expect(imported.status).toBe(201);
      expect(imported.body.sessions.length).toBe(exported.body.sessions.length);
      expect(imported.body.completedChallenges.length).toBe(exported.body.completedChallenges.length);

      // Importing into the same account a second time collides on session ids.
      expect((await api("POST", "/api/me/import", exported.body)).status).toBe(500);
    } finally {
      token = savedToken;
    }
  });

  it("rejects empty transcripts but never blocks on volume or a locked exercise", async () => {
    expect((await api("POST", "/api/sessions", sessionForm("impro-passion", "  "))).status).toBe(422);
    expect((await api("POST", "/api/sessions", sessionForm("entretien-difficulte", CLEAN))).status).toBe(201);
  });

  it("plays a game with a real, server-verified constraint", async () => {
    // The game forbids 2 random words from a fixed pool; include them all so the test is deterministic.
    const lose = await api("POST", "/api/sessions", gameForm("g-mot-interdit", "C'est un vrai truc, une vraie chose, un vrai genre de quoi, très bien."));
    expect(lose.status).toBe(201);
    expect(lose.body.session.analysis.constraintResult?.passed).toBe(false);
    expect(lose.body.session.source).toBe("jeu");
  });

  it("builds a named template program and a personalised one", async () => {
    const tpl = await api("POST", "/api/program", { templateId: "tpl-entretien" });
    expect(tpl.body.program.days).toHaveLength(14);
    const perso = await api("POST", "/api/program", { goalText: "Je veux réussir mon prochain entretien." });
    expect(perso.body.program.days.length).toBeGreaterThan(0);
    const state = await api("GET", "/api/state");
    expect(state.body.program.title.length).toBeGreaterThan(0);
  });

  it("runs the diagnostic and stores the report", async () => {
    const scores = (g: number) => ({ global: g, clarte: g, fluidite: g, confiance: g, structure: g, vocabulaire: g, debit: g, parasites: g, argumentation: g, grammaire: g, persuasion: g, concision: g });
    const r = await api("POST", "/api/diagnostic", { steps: [
      { stepId: "presentation", title: "Présentation", sessionId: "s1", scores: scores(72) },
      { stepId: "culture", title: "Culture", sessionId: "s2", scores: scores(60) },
    ] });
    expect(r.status).toBe(201);
    expect(r.body.diagnostic.averageScores.global).toBe(66);
    const state = await api("GET", "/api/state");
    expect(state.body.user.diagnosticDone).toBe(true);
    expect(state.body.diagnostic.level).toBeDefined();
  });

  it("chats with the coach, runs a generalised simulation, never limits messages", async () => {
    for (let i = 0; i < 6; i++) {
      const r = await api("POST", "/api/coach", { text: `Message ${i}` });
      expect(r.status).toBe(200);
    }
    const r = await api("POST", "/api/coach", { text: "Fais-moi une négociation salariale." });
    expect(r.body.reply.interview.simulationId).toBe("sim-negociation-salaire");
  });

  it("gets a weekly plan and marks a library lesson as read", async () => {
    const w = await api("GET", "/api/weekly");
    expect(w.body.principal.dimension).toBeDefined();
    expect((await api("POST", "/api/library/elo-captiver/read")).status).toBe(200);
  });

  it("offers a heuristic rewrite and a null model answer offline (never fabricated)", async () => {
    const sessions = await api("GET", "/api/state");
    const id = sessions.body.sessions[0].id;
    const rw = await api("POST", `/api/sessions/${id}/rewrite`);
    expect(rw.body.clair.length).toBeGreaterThan(0);
    expect(rw.body.persuasif).toBeNull();
    const ma = await api("POST", `/api/sessions/${id}/model-answer`);
    expect(ma.body.answer).toBeNull();
  });

  it("resets a forgotten password", async () => {
    const f = await api("POST", "/api/auth/forgot", { email: "alex@ex.com" }, false);
    const resetToken = new URL(f.body.devResetUrl).searchParams.get("token");
    expect((await api("POST", "/api/auth/forgot", { email: "nobody@ex.com" }, false)).body).toEqual({ ok: true });
    const r = await api("POST", "/api/auth/reset", { token: resetToken, password: "nouveau-mdp" }, false);
    expect(r.status).toBe(200);
    expect((await api("POST", "/api/auth/reset", { token: resetToken, password: "nouveau-mdp" }, false)).status).toBe(400);
    expect((await api("POST", "/api/auth/login", { email: "alex@ex.com", password: "nouveau-mdp" }, false)).status).toBe(200);
  });

  it("signs in with Google and imports guest data", async () => {
    token = "";
    const guest = await api("POST", "/api/auth/google", {
      credential: "good",
      importState: { sessions: [], coach: [{ id: "x", role: "user", text: "Salut", createdAt: new Date().toISOString() }], badges: [{ id: "first", earnedAt: new Date().toISOString() }] },
    });
    expect(guest.status).toBe(201);
    token = guest.body.token;
    expect(guest.body.state.user.firstName).toBe("Gaby");
    expect(guest.body.state.coach).toHaveLength(1);
    expect((await api("POST", "/api/auth/google", { credential: "bad" })).status).toBe(401);
  });

  it("updates the profile and deletes the account", async () => {
    const me = await api("PATCH", "/api/me", { firstName: "Gab", settings: { theme: "dark" } });
    expect(me.body.user.firstName).toBe("Gab");
    expect(me.body.user.settings.theme).toBe("dark");
    expect(me.body.user.settings.saveAudio).toBe(true);
    expect((await api("DELETE", "/api/me")).status).toBe(200);
    expect((await api("GET", "/api/state")).status).toBe(401);
  });
});

describe("content coherence (AI-only, pulls the score down but never up)", () => {
  class LowCoherenceLlm extends HeuristicLlm {
    override async coherence() {
      return { score: 10, reason: "Ne répond pas du tout à la consigne." };
    }
  }

  it("drags a clean-sounding but incoherent answer's global score down", async () => {
    const dir2 = mkdtempSync(path.join(tmpdir(), "eloq-coh-"));
    const config = loadConfig({ DATA_DIR: dir2, JWT_SECRET: "test-secret", WEB_DIST: path.join(dir2, "none") });
    const app = createApp({
      config,
      store: new SqliteStore(path.join(dir2, "db.sqlite")),
      stt: new ClientTranscriptStt(),
      llm: new LowCoherenceLlm(),
      storage: new LocalDiskStorage(path.join(dir2, "audio")),
      mailer: { name: "console", send: async () => {} } as ConsoleMailer,
    });
    const srv = app.listen(0);
    const b = `http://127.0.0.1:${(srv.address() as AddressInfo).port}`;
    try {
      const signup = await fetch(`${b}/api/auth/signup`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: "Coh", email: "coh@ex.com", password: "motdepasse" }),
      });
      const { token: tok } = (await signup.json()) as { token: string };
      const f = sessionForm("entretien-presentation", CLEAN);
      const res = await fetch(`${b}/api/sessions`, { method: "POST", headers: { Authorization: `Bearer ${tok}` }, body: f });
      const body = (await res.json()) as { session: { analysis: { scores: { global: number }; contentCoherence: { score: number } } } };
      expect(res.status).toBe(201);
      expect(body.session.analysis.contentCoherence.score).toBe(10);
      // The clean transcript alone would score well above 10: the blend must have pulled it down, not left it untouched.
      expect(body.session.analysis.scores.global).toBeLessThan(70);
      expect(body.session.analysis.scores.global).toBeGreaterThan(10);
    } finally {
      srv.close();
      rmSync(dir2, { recursive: true, force: true });
    }
  });
});
