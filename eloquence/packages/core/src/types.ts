// Shared domain model for Éloquence. Used by the web app, the API and the
// analysis engine so that both sides always speak the same language.
//
// This is a personal, single-user coaching app: there is no plan, no
// premium tier, no paywall anywhere in this model on purpose.

export type Goal =
  | "aisance"
  | "entretiens"
  | "presentations"
  | "convaincre"
  | "improviser"
  | "concours"
  | "parasites"
  | "vocabulaire"
  | "grammaire"
  | "structure"
  | "debat"
  | "storytelling"
  | "culture"
  | "diction"
  | "commercial"
  | "confiance";

export type Level = "debutant" | "intermediaire" | "a_l_aise" | "tres_a_l_aise";

export type Frequency = "5" | "10" | "15" | "semaine";

export type CategoryId =
  | "improvisation"
  | "entretien"
  | "pitch"
  | "presentation"
  | "debat"
  | "pro"
  | "prononciation"
  | "culture"
  | "storytelling"
  | "libre";

/** Measurable, honestly-scored dimensions. Kept deliberately limited to what
 * the engine can actually observe in text/audio signals. */
export type Dimension =
  | "clarte"
  | "fluidite"
  | "confiance"
  | "structure"
  | "vocabulaire"
  | "debit"
  | "parasites"
  | "argumentation"
  | "grammaire"
  | "persuasion"
  | "concision";

export type Scores = Record<Dimension, number> & { global: number };

export interface UserSettings {
  notifications: boolean;
  reminderHour: number;
  sessionSeconds: number;
  language: "fr-FR" | "fr-CA" | "fr-BE" | "fr-CH";
  theme: "system" | "light" | "dark";
  saveAudio: boolean;
  shareAnonymousStats: boolean;
  /**
   * Re-transcribes the recording with a small Whisper model running
   * entirely in the browser (free, no server, no API key) instead of the
   * browser's built-in speech recognition, which tends to erase
   * hesitations. Off by default: it downloads a ~40 MB model on first use.
   */
  localTranscription: boolean;
}

export interface User {
  id: string;
  firstName: string;
  email: string | null;
  avatar: string | null; // data URL or emoji seed
  goals: Goal[];
  goalText: string | null;
  level: Level;
  frequency: Frequency;
  createdAt: string;
  settings: UserSettings;
  isDemo?: boolean;
  diagnosticDone?: boolean;
}

/** A chunk of recognised speech with its timing, in seconds from start. */
export interface SpeechSegment {
  text: string;
  start: number;
  end: number;
}

/** A silence detected from the audio signal, in seconds from start. */
export interface Silence {
  start: number;
  end: number;
}

/** Raw signals captured while the user speaks. */
export interface SpeechCapture {
  transcript: string;
  durationSec: number;
  segments?: SpeechSegment[];
  silences?: Silence[];
  /** 0..1 loudness samples, roughly every 100 ms. */
  volume?: number[];
  /** "speech" when captured with a real mic, "text" for typed fallback,
   * "local-whisper" when the free in-browser model re-transcribed it. */
  source: "speech" | "text" | "server-stt" | "local-whisper";
}

export type IssueKind =
  | "filler"
  | "repetition"
  | "long_sentence"
  | "pause"
  | "hedge"
  | "vague"
  | "grammar"
  | "forbidden";

export interface TranscriptToken {
  text: string;
  kind?: IssueKind;
  /** index into the analysis issues list */
  issue?: number;
}

export interface TranscriptSentence {
  tokens: TranscriptToken[];
  tooLong: boolean;
  wordCount: number;
  /** Pause (seconds) that follows this sentence, if notable. */
  pauseAfter?: number;
}

export interface Issue {
  kind: IssueKind;
  label: string;
  count: number;
  detail: string;
  suggestion: string;
}

export interface PaceSample {
  t: number;
  wpm: number;
}

export interface GrammarFlag {
  match: string;
  label: string;
  fix: string;
}

export interface Metrics {
  wordCount: number;
  uniqueWords: number;
  durationSec: number;
  speakingSec: number;
  wpm: number;
  fillerCount: number;
  fillerPer100: number;
  fillers: Record<string, number>;
  repetitions: Record<string, number>;
  sentenceCount: number;
  avgSentenceWords: number;
  longSentences: number;
  pauseCount: number;
  longestPause: number;
  /** Share of the recording spent in silence (0-1): how much "dead air". */
  silenceRatio: number;
  lexicalDiversity: number;
  connectors: string[];
  counterArgumentMarkers: number;
  exampleMarkers: number;
  ctaMarkers: number;
  hedges: number;
  grammarFlags: GrammarFlag[];
  pace: PaceSample[];
  accelerations: number;
  slowdowns: number;
  volumeStability: number | null;
  /** True when the answer was typed: pace and pauses aren't measured. */
  typed?: boolean;
  /** Which engine produced the transcript being analysed — shown in the UI
   * so "did local transcription actually run?" is never a guessing game. */
  transcriptionSource: SpeechCapture["source"];
}

/** A short excerpt from the actual transcript, used to ground feedback. */
export interface QuotedExample {
  text: string;
  issue: IssueKind;
}

export interface Feedback {
  headline: string;
  /** What went well — at most 3 concrete points. */
  strengths: string[];
  /** What holds the answer back — at most 3 concrete points. */
  weaknesses: string[];
  /** A real excerpt from the transcript illustrating the top issue. */
  example: QuotedExample | null;
  /** Why that excerpt is a problem. */
  why: string;
  /** A concrete technique to fix it (may name PREP, STAR, Toulmin…). */
  howToFix: string;
  /** A quantified target for the next attempt. */
  goal: string;
}

export type GameConstraint =
  | { type: "forbidden_words"; words: string[] }
  | { type: "no_fillers" }
  | { type: "pace_target"; min: number; max: number }
  | { type: "must_include"; words: string[] }
  | { type: "no_repeat_word" };

export interface ConstraintResult {
  constraint: GameConstraint;
  passed: boolean;
  detail: string;
}

export interface Analysis {
  scores: Scores;
  metrics: Metrics;
  issues: Issue[];
  sentences: TranscriptSentence[];
  feedback: Feedback;
  constraintResult?: ConstraintResult;
  engine: "heuristic" | "llm";
  /**
   * Judges whether what was actually said makes sense and answers the
   * prompt — separate from every other (purely delivery-based) dimension.
   * Only set when an AI key is configured: the heuristic engine has no way
   * to judge meaning, so this is never guessed at offline. When present, it
   * also pulls `scores.global` down (never up) to reflect content that's
   * cleanly delivered but doesn't actually say anything coherent.
   */
  contentCoherence?: { score: number; reason: string } | null;
}

/** Where an activity came from, so history/search can show it meaningfully. */
export type ActivitySource = "catalogue" | "jeu" | "sujet" | "simulation" | "diagnostic" | "libre" | "programme";

export interface Session {
  id: string;
  userId: string;
  exerciseId: string;
  exerciseTitle: string;
  category: CategoryId;
  source: ActivitySource;
  createdAt: string;
  durationSec: number;
  audioUrl: string | null;
  transcript: string;
  score: number;
  analysis: Analysis;
  xpEarned: number;
  attempt: number;
}

export interface Comparison {
  previousScore: number;
  newScore: number;
  delta: number;
  dimensions: Partial<Record<Dimension, number>>;
  fillerChangePct: number | null;
  message: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface EarnedBadge {
  id: string;
  earnedAt: string;
}

export interface XpLine {
  label: string;
  xp: number;
}

export interface SessionResult {
  session: Session;
  comparison: Comparison | null;
  xp: XpLine[];
  newBadges: Badge[];
  levelUp: LevelInfo | null;
  recurringChallenge: RecurringChallenge | null;
}

export interface LevelInfo {
  level: number;
  name: string;
  minXp: number;
  nextXp: number | null;
}

export interface ProgramDay {
  day: number;
  title: string;
  focus: string;
  activityId: string;
  kind: "exercise" | "game" | "topic" | "simulation" | "lesson";
  done: boolean;
}

export interface Program {
  id: string;
  templateId: string | null;
  title: string;
  goalText: string;
  createdAt: string;
  days: ProgramDay[];
}

export interface ProgramTemplate {
  id: string;
  title: string;
  tagline: string;
  days: number;
  icon: string;
}

export interface CoachMessage {
  id: string;
  role: "user" | "coach";
  text: string;
  createdAt: string;
  /** Optional suggested exercise the UI can launch. */
  action?: { label: string; exerciseId: string };
  /** Set while the coach runs a mock interview/simulation. */
  interview?: { step: number; total: number; simulationId?: string };
}

export interface ProgressSummary {
  xp: number;
  level: LevelInfo;
  levelProgress: number;
  streak: number;
  bestStreak: number;
  sessionCount: number;
  totalSec: number;
  totalWords: number;
  averageScore: number;
  bestScore: number;
  weekSec: number;
  weekSessions: number;
  current: Scores | null;
  /** score change over the last 30 days, in points */
  trend30: number | null;
  fillersRemoved: number;
  todayCount: number;
  badges: EarnedBadge[];
  /** average score & count per exercise category — the "competency profile". */
  byCategory: Partial<Record<CategoryId, { average: number; count: number }>>;
  distinctTopics: number;
  recurringIssue: RecurringChallenge | null;
  /** Per-dimension score change over the last 30 days, in points — null for
   * a dimension without enough recent data to compare. */
  dimensionTrend30: Partial<Record<Dimension, number>>;
}

export interface RecurringChallenge {
  key: string;
  label: string;
  kind: IssueKind;
  occurrences: number;
  sessionsAffected: number;
  suggestedGameId: string;
}

export type ChallengeCategory = "contact" | "audace" | "expression" | "ecoute" | "quotidien";

/** A real-life social challenge, done away from the app — self-reported
 * only, never scored. Separate from the spoken exercises: the point is
 * building the habit of actually speaking up with real people. */
export interface RealLifeChallenge {
  id: string;
  title: string;
  description: string;
  category: ChallengeCategory;
}

export interface CompletedChallenge {
  challengeId: string;
  /** Day key (local calendar day) the challenge was shown/done for. */
  date: string;
  completedAt: string;
}

export interface WeeklyGoals {
  weekStart: string;
  principal: { dimension: Dimension; label: string };
  secondary: { dimension: Dimension; label: string } | null;
  culturel: { label: string; target: number; done: number };
  challenge: { label: string; activityId: string };
  recapAvailable: boolean;
  recap?: { scoreDelta: number; message: string };
}

/** Everything a client needs to render the app for one user. */
export interface AccountState {
  user: User;
  sessions: Session[];
  program: Program | null;
  coach: CoachMessage[];
  badges: EarnedBadge[];
  diagnostic: DiagnosticReport | null;
  completedChallenges: CompletedChallenge[];
}

export interface DiagnosticStepResult {
  stepId: string;
  title: string;
  sessionId: string;
  scores: Scores;
}

export interface DiagnosticReport {
  completedAt: string;
  steps: DiagnosticStepResult[];
  averageScores: Scores;
  level: Level;
  strongest: Dimension;
  weakest: Dimension;
  summary: string;
}
