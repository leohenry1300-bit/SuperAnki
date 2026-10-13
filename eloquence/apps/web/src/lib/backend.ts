import {
  analyzeSpeech, buildDiagnosticReport, buildSessionResult, dayKey, generateProgram, buildTemplateProgram,
  markProgramProgress, ruleBasedCoachReply, summarize, uid, weakestDimension, heuristicRewrite,
  computeWeeklyGoals, categoryProfile,
  type AccountState, type CoachMessage, type DiagnosticStepResult, type Exercise, type GameConstraint,
  type Program, type SessionResult, type SpeechCapture, type User, type WeeklyGoals,
} from "@eloquence/core";
import { ApiError, http } from "./http";
import { deleteClip, saveClip } from "./audioStore";

export interface SubmitInput {
  exercise: Exercise;
  source: "catalogue" | "jeu" | "sujet" | "simulation" | "diagnostic" | "libre" | "programme";
  capture: SpeechCapture;
  audio: Blob | null;
  constraint?: GameConstraint;
  onboarding?: boolean;
}

export interface RewriteResult { clair: string; concis: string; pro: string; persuasif: string | null }

export type UserPatch = Partial<Pick<User, "firstName" | "avatar" | "goals" | "goalText" | "level" | "frequency">> & {
  settings?: Partial<User["settings"]>;
};

/**
 * Everything the UI can do to an account. Two implementations: the API
 * (signed-in users) and the device (guest & demo), which runs the exact same
 * analysis engine locally. Nothing here is gated: this is a personal app.
 */
export interface Backend {
  readonly kind: "local" | "remote";
  submitSession(state: AccountState, input: SubmitInput): Promise<{ state: AccountState; result: SessionResult }>;
  deleteSession(state: AccountState, id: string): Promise<AccountState>;
  sendCoach(state: AccountState, text: string): Promise<AccountState>;
  clearCoach(state: AccountState): Promise<AccountState>;
  updateMe(state: AccountState, patch: UserPatch): Promise<AccountState>;
  createProgramFromGoal(state: AccountState, goalText: string): Promise<AccountState>;
  createProgramFromTemplate(state: AccountState, templateId: string): Promise<AccountState>;
  deleteProgram(state: AccountState): Promise<AccountState>;
  finalizeDiagnostic(state: AccountState, steps: DiagnosticStepResult[]): Promise<AccountState>;
  markLibraryRead(state: AccountState, lessonId: string): Promise<AccountState>;
  completeChallenge(state: AccountState, challengeId: string, date: string): Promise<AccountState>;
  uncompleteChallenge(state: AccountState, challengeId: string, date: string): Promise<AccountState>;
  /** Merges a previously exported backup file into this account. */
  importBackup(state: AccountState, raw: unknown): Promise<AccountState>;
  rewrite(sessionId: string, transcript: string): Promise<RewriteResult>;
  modelAnswer(session: AccountState["sessions"][number]): Promise<string | null>;
  weeklyGoals(state: AccountState): Promise<WeeklyGoals>;
  refresh(state: AccountState): Promise<AccountState>;
}

const merge = (state: AccountState, user: User): AccountState => ({ ...state, user });

// ---------------------------------------------------------------------------

export class RemoteBackend implements Backend {
  readonly kind = "remote";

  async submitSession(state: AccountState, input: SubmitInput) {
    const form = new FormData();
    form.append("meta", JSON.stringify({ exercise: input.exercise, source: input.source, constraint: input.constraint, capture: input.capture, onboarding: input.onboarding }));
    if (input.audio) form.append("audio", input.audio, `speech.${input.audio.type.includes("mp4") ? "m4a" : "webm"}`);
    const result = await http<SessionResult>("POST", "/api/sessions", form, 120_000);
    const fresh = await http<AccountState>("GET", "/api/state").catch(() => null);
    return { state: fresh ?? { ...state, sessions: [result.session, ...state.sessions] }, result };
  }

  async deleteSession(state: AccountState, id: string) {
    await http("DELETE", `/api/sessions/${id}`);
    return { ...state, sessions: state.sessions.filter((s) => s.id !== id) };
  }

  async sendCoach(state: AccountState, text: string) {
    const r = await http<{ userMessage: CoachMessage; reply: CoachMessage }>("POST", "/api/coach", { text });
    return { ...state, coach: [...state.coach, r.userMessage, r.reply] };
  }

  async clearCoach(state: AccountState) {
    await http("DELETE", "/api/coach");
    return { ...state, coach: [] };
  }

  async updateMe(state: AccountState, patch: UserPatch) {
    const r = await http<{ user: User }>("PATCH", "/api/me", patch);
    return merge(state, r.user);
  }

  async createProgramFromGoal(state: AccountState, goalText: string) {
    const r = await http<{ program: Program }>("POST", "/api/program", { goalText });
    return { ...state, program: r.program, user: { ...state.user, goalText } };
  }

  async createProgramFromTemplate(state: AccountState, templateId: string) {
    const r = await http<{ program: Program }>("POST", "/api/program", { templateId });
    return { ...state, program: r.program };
  }

  async deleteProgram(state: AccountState) {
    await http("DELETE", "/api/program");
    return { ...state, program: null };
  }

  async finalizeDiagnostic(state: AccountState, steps: DiagnosticStepResult[]) {
    const r = await http<{ diagnostic: AccountState["diagnostic"] }>("POST", "/api/diagnostic", { steps });
    return { ...state, diagnostic: r.diagnostic, user: { ...state.user, diagnosticDone: true } };
  }

  async markLibraryRead(state: AccountState, lessonId: string) {
    await http("POST", `/api/library/${lessonId}/read`);
    return state;
  }

  async completeChallenge(state: AccountState, challengeId: string, date: string) {
    await http("POST", `/api/challenges/${challengeId}/done`, { date });
    const completedAt = new Date().toISOString();
    return { ...state, completedChallenges: [...state.completedChallenges, { challengeId, date, completedAt }] };
  }

  async uncompleteChallenge(state: AccountState, challengeId: string, date: string) {
    await http("DELETE", `/api/challenges/${challengeId}/done?date=${encodeURIComponent(date)}`);
    return { ...state, completedChallenges: state.completedChallenges.filter((c) => !(c.challengeId === challengeId && c.date === date)) };
  }

  async importBackup(_state: AccountState, raw: unknown) {
    return http<AccountState>("POST", "/api/me/import", raw);
  }

  async rewrite(sessionId: string) {
    return http<RewriteResult>("POST", `/api/sessions/${sessionId}/rewrite`);
  }

  async modelAnswer(session: AccountState["sessions"][number]) {
    const r = await http<{ answer: string | null }>("POST", `/api/sessions/${session.id}/model-answer`);
    return r.answer;
  }

  async weeklyGoals() {
    return http<WeeklyGoals>("GET", "/api/weekly");
  }

  async refresh() {
    return http<AccountState>("GET", "/api/state");
  }
}

// ---------------------------------------------------------------------------

export class LocalBackend implements Backend {
  readonly kind = "local";
  constructor(private persist: (s: AccountState) => void) {}

  private save(s: AccountState): AccountState {
    this.persist(s);
    return s;
  }

  async submitSession(state: AccountState, input: SubmitInput) {
    const capture = { ...input.capture };
    if (!capture.transcript.trim()) capture.transcript = (capture.segments ?? []).map((s) => s.text).join(" ");
    if (!capture.transcript.trim()) {
      throw new ApiError(422, "empty_transcript", "Nous n'avons rien entendu. Vérifie ton micro et parle un peu plus fort.");
    }
    const analysis = analyzeSpeech(capture, { exercise: input.exercise, constraint: input.constraint });
    const id = uid("s_");
    let audioUrl: string | null = null;
    if (input.audio && state.user.settings.saveAudio && (await saveClip(id, input.audio))) audioUrl = `idb:${id}`;

    const result = buildSessionResult({
      userId: state.user.id, exercise: input.exercise, source: input.source, analysis, transcript: capture.transcript,
      durationSec: analysis.metrics.durationSec, audioUrl, previous: state.sessions, badges: state.badges, id,
      badgeContext: { diagnosticDone: !!state.user.diagnosticDone, distinctGames: distinctGameTitles(state), distinctSimulations: distinctCompletedSimulations(state), libraryRead: 0 },
    });
    const next: AccountState = {
      ...state,
      sessions: [result.session, ...state.sessions],
      badges: [...state.badges, ...result.newBadges.map((b) => ({ id: b.id, earnedAt: result.session.createdAt }))],
      program: state.program ? markProgramProgress(state.program, input.exercise.id) : null,
    };
    return { state: this.save(next), result };
  }

  async deleteSession(state: AccountState, id: string) {
    await deleteClip(id);
    return this.save({ ...state, sessions: state.sessions.filter((s) => s.id !== id) });
  }

  async sendCoach(state: AccountState, text: string) {
    const userMessage: CoachMessage = { id: uid("m_"), role: "user", text, createdAt: new Date().toISOString() };
    const reply = ruleBasedCoachReply(text, {
      user: state.user,
      summary: summarize(state.sessions, state.badges),
      lastSession: state.sessions[0] ?? null,
      history: state.coach.slice(-30),
    });
    await new Promise((r) => setTimeout(r, 450 + Math.min(1100, reply.text.length * 3)));
    return this.save({ ...state, coach: [...state.coach, userMessage, reply] });
  }

  async clearCoach(state: AccountState) {
    return this.save({ ...state, coach: [] });
  }

  async updateMe(state: AccountState, patch: UserPatch) {
    const user = { ...state.user, ...patch, settings: { ...state.user.settings, ...(patch.settings ?? {}) } };
    return this.save({ ...state, user });
  }

  async createProgramFromGoal(state: AccountState, goalText: string) {
    const summary = summarize(state.sessions, []);
    const weakest = weakestDimension(summary.current);
    const program = generateProgram(goalText, state.user.goals, weakest, summary.recurringIssue, 21);
    return this.save({ ...state, program, user: { ...state.user, goalText } });
  }

  async createProgramFromTemplate(state: AccountState, templateId: string) {
    const program = buildTemplateProgram(templateId);
    if (!program) throw new ApiError(404, "template_not_found", "Programme introuvable.");
    return this.save({ ...state, program });
  }

  async deleteProgram(state: AccountState) {
    return this.save({ ...state, program: null });
  }

  async finalizeDiagnostic(state: AccountState, steps: DiagnosticStepResult[]) {
    const report = buildDiagnosticReport(steps);
    return this.save({ ...state, diagnostic: report, user: { ...state.user, diagnosticDone: true, level: report.level } });
  }

  async markLibraryRead(state: AccountState) {
    return state;
  }

  async completeChallenge(state: AccountState, challengeId: string, date: string) {
    const completedAt = new Date().toISOString();
    return this.save({ ...state, completedChallenges: [...state.completedChallenges, { challengeId, date, completedAt }] });
  }

  async uncompleteChallenge(state: AccountState, challengeId: string, date: string) {
    return this.save({ ...state, completedChallenges: state.completedChallenges.filter((c) => !(c.challengeId === challengeId && c.date === date)) });
  }

  async importBackup(state: AccountState, raw: unknown) {
    const data = raw as Partial<AccountState>;
    const suffix = `_${state.user.id.slice(-6)}`;
    const sessions = (data.sessions ?? []).map((s) => ({ ...s, id: `${s.id}${suffix}`, userId: state.user.id, audioUrl: null }));
    const coach = (data.coach ?? []).map((m) => ({ ...m, id: `${m.id}${suffix}` }));
    const existingBadges = new Set(state.badges.map((b) => b.id));
    const badges = (data.badges ?? []).filter((b) => !existingBadges.has(b.id));
    return this.save({
      ...state,
      sessions: [...sessions, ...state.sessions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      coach: [...state.coach, ...coach],
      badges: [...state.badges, ...badges],
      completedChallenges: [...state.completedChallenges, ...(data.completedChallenges ?? [])],
      program: state.program ?? data.program ?? null,
      diagnostic: state.diagnostic ?? data.diagnostic ?? null,
    });
  }

  async rewrite(_sessionId: string, transcript: string) {
    return { clair: heuristicRewrite(transcript, "clair"), concis: heuristicRewrite(transcript, "concis"), pro: heuristicRewrite(transcript, "pro"), persuasif: null };
  }

  async modelAnswer() {
    return null;
  }

  async weeklyGoals(state: AccountState) {
    const summary = summarize(state.sessions, state.badges);
    return computeWeeklyGoals(state.sessions, summary);
  }

  async refresh(state: AccountState) {
    return state;
  }
}

function distinctGameTitles(state: AccountState): number {
  return new Set(state.sessions.filter((s) => s.source === "jeu").map((s) => s.exerciseTitle)).size;
}
function distinctCompletedSimulations(state: AccountState): number {
  const done = new Set<string>();
  for (const m of state.coach) if (m.interview?.simulationId && m.interview.step >= m.interview.total) done.add(m.interview.simulationId);
  return done.size;
}

export { categoryProfile, dayKey };
