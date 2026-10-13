import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import multer from "multer";
import { existsSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  CATEGORIES, DEFAULT_SETTINGS, DIMENSIONS, analyzeSpeech, buildDiagnosticReport, buildSessionResult,
  buildTemplateProgram, computeWeeklyGoals, generateProgram, getChallenge, historyContextText,
  markProgramProgress, programCompleted, ruleBasedCoachReply, summarize, uid, weakestDimension,
  type AccountState, type DiagnosticStepResult, type Session, type User,
} from "@eloquence/core";
import type { Exercise } from "@eloquence/core";
import type { Config } from "./config";
import { type Store, type UserRecord } from "./db";
import {
  hashPassword, newResetToken, rateLimit, requireAuth, sha256, signAudio, signToken,
  verifyAudio, verifyPassword,
} from "./auth";
import type { SttProvider } from "./providers/stt";
import type { LlmProvider } from "./providers/llm";
import { verifyGoogleCredential, type AudioStorage, type Mailer } from "./providers/services";

export interface Deps {
  config: Config;
  store: Store;
  stt: SttProvider;
  llm: LlmProvider;
  storage: AudioStorage;
  mailer: Mailer;
  /** Injected in tests to avoid network calls. */
  verifyGoogle?: typeof verifyGoogleCredential;
}

class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

const wrap = (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

// ---- Validation schemas ----------------------------------------------------

const GoalEnum = z.enum([
  "aisance", "entretiens", "presentations", "convaincre", "improviser", "concours", "parasites",
  "vocabulaire", "grammaire", "structure", "debat", "storytelling", "culture", "diction", "commercial", "confiance",
]);
const CategoryEnum = z.enum(CATEGORIES.map((c) => c.id) as [string, ...string[]]);
const DimensionEnum = z.enum(DIMENSIONS as unknown as [string, ...string[]]);

const Profile = z.object({
  goals: z.array(GoalEnum).min(1).max(16).optional(),
  goalText: z.string().max(300).nullable().optional(),
  level: z.enum(["debutant", "intermediaire", "a_l_aise", "tres_a_l_aise"]).optional(),
  frequency: z.enum(["5", "10", "15", "semaine"]).optional(),
});

const ImportState = z.object({
  sessions: z.array(z.any()).max(500).optional(),
  coach: z.array(z.any()).max(1000).optional(),
  program: z.any().nullable().optional(),
  badges: z.array(z.object({ id: z.string(), earnedAt: z.string() })).max(100).optional(),
  diagnostic: z.any().nullable().optional(),
  completedChallenges: z.array(z.object({ challengeId: z.string(), date: z.string(), completedAt: z.string() })).max(1000).optional(),
}).optional();

const Signup = z.object({
  firstName: z.string().trim().min(1).max(40),
  email: z.email().max(200),
  password: z.string().min(8, "8 caractères minimum").max(200),
  profile: Profile.optional(),
  importState: ImportState,
});

const Capture = z.object({
  transcript: z.string().max(30_000),
  durationSec: z.number().min(0).max(900),
  segments: z.array(z.object({ text: z.string().max(5000), start: z.number(), end: z.number() })).max(2000).optional(),
  silences: z.array(z.object({ start: z.number(), end: z.number() })).max(2000).optional(),
  volume: z.array(z.number()).max(12_000).optional(),
  source: z.enum(["speech", "text", "server-stt", "local-whisper"]),
});

// The full exercise object travels with the submission: games, generated
// topics, diagnostic steps and library-linked drills are never in the static
// catalogue, so the server trusts the client's description of the prompt
// (it only ever affects feedback wording, never scoring — scoring runs on
// the transcript/audio signals alone).
const ExerciseIn = z.object({
  id: z.string().min(1).max(120),
  category: CategoryEnum,
  title: z.string().min(1).max(200),
  prompt: z.string().max(2000),
  instruction: z.string().max(1000),
  durationSec: z.number().min(1).max(1800),
  focus: DimensionEnum,
  scaffold: z.array(z.string().max(200)).max(10).optional(),
  readText: z.string().max(4000).optional(),
  stance: z.string().max(400).optional(),
});

const ConstraintIn = z.union([
  z.object({ type: z.literal("forbidden_words"), words: z.array(z.string().max(60)).max(10) }),
  z.object({ type: z.literal("no_fillers") }),
  z.object({ type: z.literal("pace_target"), min: z.number(), max: z.number() }),
  z.object({ type: z.literal("must_include"), words: z.array(z.string().max(60)).max(10) }),
  z.object({ type: z.literal("no_repeat_word") }),
]);

const SessionMeta = z.object({
  exercise: ExerciseIn,
  source: z.enum(["catalogue", "jeu", "sujet", "simulation", "diagnostic", "libre", "programme"]),
  constraint: ConstraintIn.optional(),
  onboarding: z.boolean().optional(),
  capture: Capture,
});

const MePatch = Profile.extend({
  firstName: z.string().trim().min(1).max(40).optional(),
  avatar: z.string().max(400_000).nullable().optional(),
  settings: z.object({
    notifications: z.boolean(),
    reminderHour: z.number().int().min(0).max(23),
    sessionSeconds: z.number().int().min(30).max(300),
    language: z.enum(["fr-FR", "fr-CA", "fr-BE", "fr-CH"]),
    theme: z.enum(["system", "light", "dark"]),
    saveAudio: z.boolean(),
    shareAnonymousStats: z.boolean(),
    localTranscription: z.boolean(),
  }).partial().optional(),
});

// ---- Helpers -------------------------------------------------------------

function publicUser(u: UserRecord): User {
  const { passwordHash: _p, googleSub: _g, ...rest } = u;
  return rest;
}

async function badgeContext(store: Store, userId: string) {
  const [user, program, distinctGames, distinctSimulations, libraryRead, modelAnswerSeen] = await Promise.all([
    store.userById(userId), store.program(userId), store.distinctGameTitles(userId),
    store.distinctCompletedSimulations(userId), store.libraryReadCount(userId), store.modelAnswerSeen(userId),
  ]);
  return {
    diagnosticDone: !!user?.diagnosticDone,
    programCompleted: programCompleted(program),
    distinctGames,
    distinctSimulations,
    libraryRead,
    modelAnswerSeen,
  };
}

export function createApp(deps: Deps) {
  const { config, store, stt, llm, storage, mailer } = deps;
  const app = express();
  const auth = requireAuth(config.jwtSecret);
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
  const authLimiter = rateLimit(20, 60_000);

  app.set("trust proxy", 1);
  app.use(cors());
  app.use(express.json({ limit: "5mb" }));

  const withAudio = (s: Session & { audioKey?: string | null }): Session => {
    const { audioKey, ...rest } = s;
    return { ...rest, audioUrl: audioKey ? signAudio(config.jwtSecret, audioKey) : null };
  };

  const stateFor = async (userId: string): Promise<AccountState> => {
    const user = await store.userById(userId);
    if (!user) throw new HttpError(401, "unauthorized", "Compte introuvable.");
    const [sessions, program, coach, badges, diagnostic, completedChallenges] = await Promise.all([
      store.sessions(userId), store.program(userId), store.coach(userId), store.badges(userId), store.diagnostic(userId),
      store.completedChallenges(userId),
    ]);
    return {
      user: publicUser(user),
      sessions: sessions.map(withAudio),
      program,
      coach,
      badges,
      diagnostic,
      completedChallenges,
    };
  };

  const createAccount = (base: Partial<UserRecord> & { firstName: string }, profile?: z.infer<typeof Profile>): Promise<UserRecord> =>
    store.createUser({
      id: uid("u_"),
      email: null,
      avatar: null,
      passwordHash: null,
      googleSub: null,
      goals: profile?.goals ?? ["aisance"],
      goalText: profile?.goalText ?? null,
      level: profile?.level ?? "intermediaire",
      frequency: profile?.frequency ?? "10",
      createdAt: new Date().toISOString(),
      settings: { ...DEFAULT_SETTINGS },
      ...base,
    });

  // ---- Public ------------------------------------------------------------

  app.get("/api/health", (_req, res) => { res.json({ ok: true }); });

  app.get("/api/config", (_req, res) => {
    res.json({ googleClientId: config.googleClientId, stt: stt.name, llm: llm.name, mail: mailer.name });
  });

  // ---- Auth -------------------------------------------------------------

  app.post("/api/auth/signup", authLimiter, wrap(async (req, res) => {
    const body = Signup.parse(req.body);
    const email = body.email.toLowerCase();
    if (await store.userByEmail(email)) throw new HttpError(409, "email_taken", "Un compte existe déjà avec cet e-mail. Connecte-toi.");
    const user = await createAccount({ firstName: body.firstName, email, passwordHash: await hashPassword(body.password) }, body.profile);
    if (body.importState) await store.importState(user.id, body.importState as Partial<AccountState>);
    res.status(201).json({ token: signToken(config.jwtSecret, user.id), state: await stateFor(user.id) });
  }));

  // Silent account provisioning: this is a personal, single-user app, so
  // there's no reason to make signup a form — the client calls this once,
  // automatically, the first time it boots without a saved token, and keeps
  // the returned token in localStorage from then on. No email, no password.
  app.post("/api/auth/anonymous", authLimiter, wrap(async (req, res) => {
    const body = z.object({ firstName: z.string().trim().min(1).max(40), profile: Profile.optional(), importState: ImportState }).parse(req.body);
    const user = await createAccount({ firstName: body.firstName, email: null, passwordHash: null, googleSub: null }, body.profile);
    if (body.importState) await store.importState(user.id, body.importState as Partial<AccountState>);
    res.status(201).json({ token: signToken(config.jwtSecret, user.id), state: await stateFor(user.id) });
  }));

  app.post("/api/auth/login", authLimiter, wrap(async (req, res) => {
    const body = z.object({ email: z.string(), password: z.string() }).parse(req.body);
    const user = await store.userByEmail(body.email.trim());
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      throw new HttpError(401, "bad_credentials", "E-mail ou mot de passe incorrect.");
    }
    res.json({ token: signToken(config.jwtSecret, user.id), state: await stateFor(user.id) });
  }));

  app.post("/api/auth/google", authLimiter, wrap(async (req, res) => {
    if (!config.googleClientId) throw new HttpError(501, "google_disabled", "La connexion Google n'est pas configurée sur ce serveur.");
    const body = z.object({ credential: z.string(), profile: Profile.optional(), importState: ImportState }).parse(req.body);
    const identity = await (deps.verifyGoogle ?? verifyGoogleCredential)(body.credential, config.googleClientId);
    if (!identity) throw new HttpError(401, "google_invalid", "La connexion Google a échoué. Réessaie.");
    let user = (await store.userByGoogle(identity.sub)) ?? (await store.userByEmail(identity.email));
    let created = false;
    if (!user) {
      user = await createAccount({ firstName: identity.firstName, email: identity.email, googleSub: identity.sub, avatar: identity.picture }, body.profile);
      created = true;
    } else if (!user.googleSub) {
      user = await store.updateUser(user.id, { googleSub: identity.sub });
    }
    if (created && body.importState) await store.importState(user.id, body.importState as Partial<AccountState>);
    res.status(created ? 201 : 200).json({ token: signToken(config.jwtSecret, user.id), state: await stateFor(user.id) });
  }));

  app.post("/api/auth/forgot", authLimiter, wrap(async (req, res) => {
    const { email } = z.object({ email: z.string() }).parse(req.body);
    const user = await store.userByEmail(email.trim());
    let devResetUrl: string | undefined;
    if (user) {
      const { token, hash } = newResetToken();
      await store.saveReset(hash, user.id, new Date(Date.now() + 60 * 60 * 1000).toISOString());
      const url = `${config.publicUrl}/reinitialiser?token=${token}`;
      await mailer.send(user.email!, "Réinitialise ton mot de passe Éloquence",
        `Bonjour ${user.firstName},\n\nPour choisir un nouveau mot de passe, ouvre ce lien (valable 1 heure) :\n${url}\n\nSi tu n'es pas à l'origine de cette demande, ignore simplement cet e-mail.`);
      if (mailer.name === "console") devResetUrl = url;
    }
    res.json({ ok: true, devResetUrl });
  }));

  app.post("/api/auth/reset", authLimiter, wrap(async (req, res) => {
    const body = z.object({ token: z.string(), password: z.string().min(8, "8 caractères minimum").max(200) }).parse(req.body);
    const userId = await store.consumeReset(sha256(body.token));
    if (!userId) throw new HttpError(400, "reset_invalid", "Ce lien a expiré ou a déjà été utilisé. Refais une demande.");
    await store.updateUser(userId, { passwordHash: await hashPassword(body.password) });
    res.json({ token: signToken(config.jwtSecret, userId), state: await stateFor(userId) });
  }));

  // ---- Account ---------------------------------------------------------

  app.get("/api/state", auth, wrap(async (req, res) => { res.json(await stateFor(req.userId!)); }));

  app.get("/api/weekly", auth, wrap(async (req, res) => {
    const sessions = await store.sessions(req.userId!);
    const summary = summarize(sessions, await store.badges(req.userId!));
    res.json(computeWeeklyGoals(sessions, summary));
  }));

  app.patch("/api/me", auth, wrap(async (req, res) => {
    const body = MePatch.parse(req.body);
    const cur = (await store.userById(req.userId!))!;
    const user = await store.updateUser(req.userId!, { ...body, settings: { ...cur.settings, ...(body.settings ?? {}) } } as Partial<UserRecord>);
    res.json({ user: publicUser(user) });
  }));

  app.get("/api/me/export", auth, wrap(async (req, res) => {
    res.setHeader("Content-Disposition", "attachment; filename=eloquence-export.json");
    res.json(await stateFor(req.userId!));
  }));

  // Re-imports a previously exported file into the CURRENT account — the
  // way back for anyone who lost their device/local token before the
  // email+password login existed, and a generally useful safety net.
  // Importing the same file twice into the same account will fail on the
  // second attempt (session ids collide) rather than duplicate anything.
  app.post("/api/me/import", auth, wrap(async (req, res) => {
    const body = ImportState.parse(req.body);
    if (body) await store.importState(req.userId!, body as Partial<AccountState>);
    res.status(201).json(await stateFor(req.userId!));
  }));

  app.delete("/api/me", auth, wrap(async (req, res) => {
    for (const s of await store.sessions(req.userId!)) if (s.audioKey) await storage.delete(s.audioKey);
    await store.deleteUser(req.userId!);
    res.json({ ok: true });
  }));

  // ---- Sessions ------------------------------------------------------------

  app.post("/api/sessions", auth, upload.single("audio"), wrap(async (req, res) => {
    const meta = SessionMeta.parse(JSON.parse(String(req.body.meta ?? "{}")));
    const user = (await store.userById(req.userId!))!;
    const exercise = meta.exercise as unknown as Exercise;

    const capture = { ...meta.capture };
    const audio = req.file;
    if (audio && audio.size > 0) {
      try {
        const out = await stt.transcribe(audio.buffer, audio.mimetype || "audio/webm", user.settings.language);
        if (out && out.transcript) Object.assign(capture, { transcript: out.transcript, segments: out.segments, source: "server-stt" });
      } catch (e) {
        console.error("[stt]", (e as Error).message);
        if (!capture.transcript.trim()) throw new HttpError(502, "stt_failed", "La transcription a échoué. Réessaie dans un instant.");
      }
    }
    if (!capture.transcript.trim() && !(capture.segments ?? []).some((s) => s.text.trim())) {
      throw new HttpError(422, "empty_transcript", "Nous n'avons rien entendu. Vérifie ton micro et parle un peu plus fort.");
    }
    if (!capture.transcript.trim()) capture.transcript = (capture.segments ?? []).map((s) => s.text).join(" ");

    const analysis = analyzeSpeech(capture, { exercise, constraint: meta.constraint });
    const previous = await store.sessions(user.id);
    if (analysis.metrics.wordCount >= 8) {
      const feedbackInput = {
        analysis, transcript: capture.transcript, exercise, firstName: user.firstName,
        historyNote: historyContextText(previous),
      };
      try {
        const fb = await llm.feedback(feedbackInput);
        if (fb) { analysis.feedback = fb; analysis.engine = "llm"; }
      } catch (e) {
        console.error("[llm feedback]", (e as Error).message);
      }
      try {
        const coherence = await llm.coherence(feedbackInput);
        if (coherence) {
          analysis.contentCoherence = coherence;
          // Only ever pulls the score down: a heuristic global that's
          // already low for other reasons never gets inflated back up just
          // because the content happened to make sense.
          if (coherence.score < analysis.scores.global) {
            analysis.scores.global = Math.round(analysis.scores.global * 0.55 + coherence.score * 0.45);
          }
        }
      } catch (e) {
        console.error("[llm coherence]", (e as Error).message);
      }
    }

    let audioKey: string | null = null;
    if (audio && audio.size > 0 && user.settings.saveAudio) {
      const ext = audio.mimetype.includes("mp4") ? "m4a" : audio.mimetype.includes("ogg") ? "ogg" : "webm";
      audioKey = `${uid()}.${ext}`;
      await storage.put(audioKey, audio.buffer, audio.mimetype);
    }

    const [badges, ctx] = await Promise.all([store.badges(user.id), badgeContext(store, user.id)]);
    const result = buildSessionResult({
      userId: user.id, exercise, source: meta.source, analysis, transcript: capture.transcript,
      durationSec: analysis.metrics.durationSec, audioUrl: null, previous, badges,
      badgeContext: ctx,
    });
    await store.insertSession(result.session, audioKey);
    await store.addBadges(user.id, result.newBadges.map((b) => ({ id: b.id, earnedAt: result.session.createdAt })));
    const program = await store.program(user.id);
    if (program) await store.saveProgram(user.id, markProgramProgress(program, exercise.id));
    await store.refreshProgress(user.id);

    res.status(201).json({ ...result, session: withAudio({ ...result.session, audioKey }) });
  }));

  app.delete("/api/sessions/:id", auth, wrap(async (req, res) => {
    const owner = await store.sessionOwner(String(req.params.id));
    if (!owner || owner.userId !== req.userId) throw new HttpError(404, "not_found", "Session introuvable.");
    if (owner.audioKey) await storage.delete(owner.audioKey);
    await store.deleteSession(String(req.params.id));
    await store.refreshProgress(req.userId!);
    res.json({ ok: true });
  }));

  app.get("/api/audio/:key", wrap(async (req, res) => {
    const key = String(req.params.key);
    if (!verifyAudio(config.jwtSecret, key, String(req.query.exp ?? ""), String(req.query.sig ?? ""))) {
      throw new HttpError(403, "forbidden", "Lien audio expiré.");
    }
    const file = await storage.get(key);
    if (!file) throw new HttpError(404, "not_found", "Enregistrement introuvable.");
    res.setHeader("Content-Type", file.mime);
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.setHeader("Accept-Ranges", "bytes");
    // Safari (and most mobile browsers) issue a Range request before playing
    // <audio>, especially for MP4 — without a 206 response here, playback
    // fails outright even though the file itself is intact and downloads fine.
    const range = req.headers.range;
    const total = file.data.length;
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      const start = match?.[1] ? Number(match[1]) : 0;
      const end = match?.[2] ? Number(match[2]) : total - 1;
      if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= total) {
        res.status(416).setHeader("Content-Range", `bytes */${total}`).end();
        return;
      }
      res.status(206);
      res.setHeader("Content-Range", `bytes ${start}-${end}/${total}`);
      res.setHeader("Content-Length", end - start + 1);
      res.send(file.data.subarray(start, end + 1));
      return;
    }
    res.setHeader("Content-Length", total);
    res.send(file.data);
  }));

  // ---- Réponse modèle / améliorer ma réponse -----------------------------

  app.post("/api/sessions/:id/model-answer", auth, wrap(async (req, res) => {
    const s = await store.session(String(req.params.id));
    if (!s || s.userId !== req.userId) throw new HttpError(404, "not_found", "Session introuvable.");
    const user = (await store.userById(req.userId!))!;
    const exercise: Exercise = { id: s.exerciseId, category: s.category, title: s.exerciseTitle, prompt: "", instruction: "", durationSec: s.durationSec, focus: "clarte" };
    const answer = await llm.modelAnswer({ analysis: s.analysis, transcript: s.transcript, exercise, firstName: user.firstName });
    await store.markModelAnswerSeen(req.userId!);
    res.json({ answer });
  }));

  app.post("/api/sessions/:id/rewrite", auth, wrap(async (req, res) => {
    const s = await store.session(String(req.params.id));
    if (!s || s.userId !== req.userId) throw new HttpError(404, "not_found", "Session introuvable.");
    const result = await llm.rewrite(s.transcript);
    res.json(result);
  }));

  // ---- Diagnostic ----------------------------------------------------------

  app.post("/api/diagnostic", auth, wrap(async (req, res) => {
    const body = z.object({
      steps: z.array(z.object({
        stepId: z.string(), title: z.string(), sessionId: z.string(),
        scores: z.record(z.string(), z.number()),
      })).min(1).max(12),
    }).parse(req.body);
    const report = buildDiagnosticReport(body.steps as unknown as DiagnosticStepResult[]);
    await store.saveDiagnostic(req.userId!, report);
    await store.updateUser(req.userId!, { diagnosticDone: true, level: report.level });
    res.status(201).json({ diagnostic: report });
  }));

  // ---- Program -----------------------------------------------------------

  app.post("/api/program", auth, wrap(async (req, res) => {
    const body = z.object({ goalText: z.string().trim().min(3).max(300).optional(), templateId: z.string().optional() }).parse(req.body);
    const user = (await store.userById(req.userId!))!;
    if (body.templateId) {
      const program = buildTemplateProgram(body.templateId);
      if (!program) throw new HttpError(404, "template_not_found", "Programme introuvable.");
      await store.saveProgram(user.id, program);
      res.status(201).json({ program });
      return;
    }
    if (!body.goalText) throw new HttpError(400, "invalid_request", "Indique ton objectif.");
    const sessions = await store.sessions(user.id);
    const summary = summarize(sessions, []);
    const weakest = weakestDimension(summary.current);
    const program = generateProgram(body.goalText, user.goals, weakest, summary.recurringIssue, 21);
    await store.saveProgram(user.id, program);
    await store.updateUser(user.id, { goalText: body.goalText });
    res.status(201).json({ program });
  }));

  app.delete("/api/program", auth, wrap(async (req, res) => {
    await store.saveProgram(req.userId!, null);
    res.json({ ok: true });
  }));

  // ---- Library --------------------------------------------------------------

  app.post("/api/library/:id/read", auth, wrap(async (req, res) => {
    await store.markLibraryRead(req.userId!, String(req.params.id));
    res.json({ ok: true });
  }));

  // ---- Défis vie réelle ------------------------------------------------------
  // dailyChallenges() is a pure, deterministic function of the date, so the
  // client computes today's picks itself (like dailyExercise already does)
  // — the server only needs to persist which ones were marked done.

  app.post("/api/challenges/:id/done", auth, wrap(async (req, res) => {
    const { date } = z.object({ date: z.string().min(1).max(20) }).parse(req.body);
    if (!getChallenge(String(req.params.id))) throw new HttpError(404, "not_found", "Défi introuvable.");
    await store.completeChallenge(req.userId!, String(req.params.id), date);
    res.status(201).json({ ok: true });
  }));

  app.delete("/api/challenges/:id/done", auth, wrap(async (req, res) => {
    const date = String(req.query.date ?? "");
    if (!date) throw new HttpError(400, "invalid_request", "Date manquante.");
    await store.uncompleteChallenge(req.userId!, String(req.params.id), date);
    res.json({ ok: true });
  }));

  // ---- Coach ---------------------------------------------------------------

  app.post("/api/coach", auth, wrap(async (req, res) => {
    const { text } = z.object({ text: z.string().trim().min(1).max(2000) }).parse(req.body);
    const user = (await store.userById(req.userId!))!;
    const [history, sessions, badges] = await Promise.all([
      store.coach(user.id, 30), store.sessions(user.id), store.badges(user.id),
    ]);
    const ctx = { user, summary: summarize(sessions, badges), lastSession: sessions[0] ?? null, history };
    const userMessage = { id: uid("m_"), role: "user" as const, text, createdAt: new Date().toISOString() };
    let reply;
    try {
      reply = await llm.coach(text, ctx);
    } catch (e) {
      console.error("[llm coach]", (e as Error).message);
      reply = ruleBasedCoachReply(text, ctx);
    }
    reply.createdAt = new Date(Math.max(Date.now(), new Date(userMessage.createdAt).getTime() + 1)).toISOString();
    await store.addCoach(user.id, userMessage);
    await store.addCoach(user.id, reply);
    res.json({ userMessage, reply });
  }));

  app.delete("/api/coach", auth, wrap(async (req, res) => {
    await store.clearCoach(req.userId!);
    res.json({ ok: true });
  }));

  // ---- Static web app ----------------------------------------------------

  if (existsSync(config.webDist)) {
    // Vite's /assets/* files are content-hashed (a new build never reuses a
    // filename), so they can be cached hard and forever. Everything else —
    // index.html, manifest, icons — is NOT hashed, so a long cache there
    // means a phone can keep serving a stale app indefinitely even after
    // force-quitting it: no-cache forces a revalidation on every load, which
    // is nearly free (a 304) when nothing actually changed.
    app.use("/assets", express.static(path.join(config.webDist, "assets"), { maxAge: "1y", immutable: true }));
    app.use(express.static(config.webDist, { index: false, setHeaders: (res) => res.setHeader("Cache-Control", "no-cache") }));
    app.get(/^\/(?!api\/).*/, (_req, res) => {
      res.setHeader("Cache-Control", "no-cache");
      res.sendFile(path.join(config.webDist, "index.html"));
    });
  }

  app.use("/api", (_req, res) => { res.status(404).json({ error: "not_found", message: "Route inconnue." }); });

  // ---- Errors --------------------------------------------------------------

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.code, message: err.message });
    } else if (err instanceof z.ZodError) {
      const first = err.issues[0];
      res.status(400).json({ error: "invalid_request", message: first?.message && !first.message.startsWith("Invalid") ? first.message : "Certaines informations sont invalides.", issues: err.issues });
    } else if (err instanceof SyntaxError) {
      res.status(400).json({ error: "invalid_json", message: "Requête illisible." });
    } else if ((err as { code?: string }).code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ error: "too_large", message: "Enregistrement trop volumineux." });
    } else {
      console.error(err);
      res.status(500).json({ error: "server_error", message: "Une erreur inattendue est survenue. Réessaie." });
    }
  });

  return app;
}
