import type {
  Analysis, ConstraintResult, Dimension, GameConstraint, GrammarFlag, Issue, IssueKind, Metrics,
  PaceSample, QuotedExample, Scores, Silence, SpeechCapture, SpeechSegment, TranscriptSentence, TranscriptToken,
} from "./types";
import type { Exercise } from "./exercises";
import {
  CONCLUSION_MARKERS, CONNECTORS, COUNTER_ARGUMENT_MARKERS, CTA_MARKERS, EXAMPLE_MARKERS, FILLERS_ALWAYS,
  FILLERS_CONTEXTUAL, GRAMMAR_PATTERNS, HEDGES, HESITATION_SOUNDS, STOPWORDS, VAGUE,
} from "./lexicon";
import { buildFeedback } from "./feedback";

export const DIMENSIONS: Dimension[] = [
  "clarte", "fluidite", "confiance", "structure", "vocabulaire", "debit", "parasites",
  "argumentation", "grammaire", "persuasion", "concision",
];

export const DIMENSION_LABELS: Record<Dimension, string> = {
  clarte: "Clarté",
  fluidite: "Fluidité",
  confiance: "Confiance",
  structure: "Structure",
  vocabulaire: "Vocabulaire",
  debit: "Débit",
  parasites: "Mots parasites",
  argumentation: "Argumentation",
  grammaire: "Grammaire",
  persuasion: "Persuasion",
  concision: "Concision",
};

export const DIMENSION_HINTS: Record<Dimension, string> = {
  clarte: "Phrases courtes, idées précises, mots concrets.",
  fluidite: "Peu d'hésitations, de bégaiements et de blancs subis.",
  confiance: "Affirmations nettes, voix posée, peu de formules d'excuse.",
  structure: "Une intro, des étapes reliées, une conclusion.",
  vocabulaire: "Des mots variés et justes, peu de répétitions.",
  debit: "Un rythme régulier autour de 130–160 mots par minute.",
  parasites: "Moins de « euh », « du coup », « en fait »…",
  argumentation: "Une thèse, des preuves, une nuance, une conclusion (modèle de Toulmin).",
  grammaire: "Constructions correctes à l'oral, peu de tournures fautives.",
  persuasion: "Un message qui donne envie d'agir, appuyé par des preuves.",
  concision: "Aller à l'essentiel sans délayer.",
};

/** "ta clarté", "ton débit"… for sentences addressed to the user. */
export const DIMENSION_POSSESSIVE: Record<Dimension, string> = {
  clarte: "ta clarté",
  fluidite: "ta fluidité",
  confiance: "ta confiance",
  structure: "ta structure",
  vocabulaire: "ton vocabulaire",
  debit: "ton débit",
  parasites: "ta maîtrise des mots parasites",
  argumentation: "ton argumentation",
  grammaire: "ta grammaire à l'oral",
  persuasion: "ta force de persuasion",
  concision: "ta concision",
};

const WEIGHTS: Record<Dimension, number> = {
  clarte: 0.13, fluidite: 0.12, confiance: 0.1, structure: 0.12,
  vocabulaire: 0.09, debit: 0.09, parasites: 0.1,
  argumentation: 0.09, grammaire: 0.06, persuasion: 0.05, concision: 0.05,
};

export const LONG_SENTENCE_WORDS = 28;
const NOTABLE_PAUSE = 1.2;
const LONG_PAUSE = 2.5;
const IDEAL_WPM: [number, number] = [130, 160];

// ---------------------------------------------------------------------------
// Tokenisation

interface Word {
  raw: string; // as displayed, with punctuation
  norm: string; // lower-case, no surrounding punctuation
  sentence: number;
}

export function normalize(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[’`´]/g, "'")
    .replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}'-]+$/gu, "")
    .replace(/-+$/, "");
}

/** Split a chunk of text into sentences on terminal punctuation. */
function splitSentences(text: string): string[] {
  const parts = text
    .replace(/\s+/g, " ")
    .trim()
    .match(/[^.!?…]+(?:[.!?…]+|$)/g);
  return (parts ?? []).map((s) => s.trim()).filter(Boolean);
}

interface SentenceUnit {
  text: string;
  start?: number;
  end?: number;
}

function sentenceUnits(capture: SpeechCapture): SentenceUnit[] {
  const segs = (capture.segments ?? []).filter((s) => s.text.trim());
  if (segs.length > 0) {
    const units: SentenceUnit[] = [];
    for (const seg of segs) {
      const parts = splitSentences(seg.text);
      const total = parts.reduce((n, p) => n + p.split(" ").length, 0) || 1;
      let cursor = seg.start;
      for (const p of parts) {
        const share = ((seg.end - seg.start) * p.split(" ").length) / total;
        units.push({ text: p, start: cursor, end: cursor + share });
        cursor += share;
      }
    }
    return units;
  }
  return splitSentences(capture.transcript).map((text) => ({ text }));
}

// ---------------------------------------------------------------------------
// Phrase matching helpers

function phraseTokens(list: string[]): string[][] {
  return list.map((p) => p.split(" ").map(normalize)).sort((a, b) => b.length - a.length);
}

const P_FILLERS = phraseTokens(FILLERS_ALWAYS);
const P_CONTEXTUAL = new Set(FILLERS_CONTEXTUAL);
const P_HEDGES = phraseTokens(HEDGES);
const P_VAGUE = phraseTokens(VAGUE);
const P_CONNECTORS = phraseTokens(CONNECTORS);
const P_COUNTER = phraseTokens(COUNTER_ARGUMENT_MARKERS);
const P_EXAMPLE = phraseTokens(EXAMPLE_MARKERS);
const P_CTA = phraseTokens(CTA_MARKERS);

function matchAt(words: Word[], i: number, phrases: string[][]): number {
  for (const p of phrases) {
    if (i + p.length > words.length) continue;
    let ok = true;
    for (let k = 0; k < p.length; k++) {
      if (words[i + k].norm !== p[k]) { ok = false; break; }
    }
    if (ok) return p.length;
  }
  return 0;
}

function countPhrase(text: string, phrases: string[][]): number {
  const words = text.split(/\s+/).map((w) => ({ raw: w, norm: normalize(w), sentence: 0 }));
  let n = 0;
  for (let i = 0; i < words.length; i++) {
    const len = matchAt(words, i, phrases);
    if (len) { n++; i += len - 1; }
  }
  return n;
}

// ---------------------------------------------------------------------------
// Grammar

function detectGrammar(text: string): GrammarFlag[] {
  const flags: GrammarFlag[] = [];
  for (const p of GRAMMAR_PATTERNS) {
    const m = text.match(p.regex);
    if (m) flags.push({ match: m[0], label: p.label, fix: p.fix });
  }
  return flags;
}

// ---------------------------------------------------------------------------
// Pauses and pace

function detectPauses(capture: SpeechCapture, units: SentenceUnit[]): Silence[] {
  const dur = capture.durationSec;
  if (capture.silences && capture.silences.length) {
    const first = units.find((u) => u.start !== undefined)?.start ?? 0.5;
    const lastUnit = [...units].reverse().find((u) => u.end !== undefined);
    const last = lastUnit?.end ?? dur - 0.5;
    return capture.silences.filter(
      (s) => s.end - s.start >= NOTABLE_PAUSE && s.start > Math.max(0.3, first - 0.3) && s.end < Math.max(last + 0.3, dur - 0.8),
    );
  }
  const segs = capture.segments ?? [];
  const pauses: Silence[] = [];
  for (let i = 1; i < segs.length; i++) {
    const gap = segs[i].start - segs[i - 1].end;
    if (gap >= NOTABLE_PAUSE) pauses.push({ start: segs[i - 1].end, end: segs[i].start });
  }
  return pauses;
}

function paceSamples(segments: SpeechSegment[] | undefined): PaceSample[] {
  if (!segments || segments.length === 0) return [];
  const samples: PaceSample[] = [];
  for (const s of segments) {
    const words = s.text.trim().split(/\s+/).filter(Boolean).length;
    const d = s.end - s.start;
    if (words >= 4 && d >= 1.5) samples.push({ t: Math.round(s.start), wpm: Math.round((words / d) * 60) });
  }
  return samples;
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Moving-average type-token ratio: stable across answer lengths. */
function mattr(words: string[], window = 40): number {
  if (words.length === 0) return 0;
  if (words.length <= window) return new Set(words).size / words.length;
  let total = 0;
  let n = 0;
  for (let i = 0; i + window <= words.length; i += 5) {
    total += new Set(words.slice(i, i + window)).size / window;
    n++;
  }
  return total / n;
}

function volumeStability(volume: number[] | undefined): number | null {
  if (!volume || volume.length < 20) return null;
  const voiced = volume.filter((v) => v > 0.04);
  if (voiced.length < 10) return null;
  const mean = voiced.reduce((a, b) => a + b, 0) / voiced.length;
  const sd = Math.sqrt(voiced.reduce((a, b) => a + (b - mean) ** 2, 0) / voiced.length);
  const cv = sd / (mean || 1);
  const steadiness = Math.max(0, Math.min(1, 1 - (cv - 0.35) / 0.8));
  const loudness = Math.max(0, Math.min(1, (mean - 0.04) / 0.16));
  return Math.round((0.7 * steadiness + 0.3 * loudness) * 100) / 100;
}

// ---------------------------------------------------------------------------
// Scoring helpers

function interp(x: number, pts: [number, number][]): number {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (x <= pts[i][0]) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return pts[pts.length - 1][1];
}

const clamp = (v: number, lo = 20, hi = 98) => Math.round(Math.max(lo, Math.min(hi, v)));

export function globalScore(s: Record<Dimension, number>): number {
  let total = 0;
  for (const d of DIMENSIONS) total += s[d] * WEIGHTS[d];
  return Math.round(total);
}

// ---------------------------------------------------------------------------
// Constraint checking (games)

function checkConstraint(constraint: GameConstraint | undefined, words: Word[], metrics: Pick<Metrics, "wpm" | "fillerCount" | "repetitions">): ConstraintResult | undefined {
  if (!constraint) return undefined;
  switch (constraint.type) {
    case "forbidden_words": {
      const norm = constraint.words.map(normalize);
      const found: Record<string, number> = {};
      for (const w of words) {
        const idx = norm.indexOf(w.norm);
        if (idx >= 0) found[constraint.words[idx]] = (found[constraint.words[idx]] ?? 0) + 1;
      }
      const total = Object.values(found).reduce((a, b) => a + b, 0);
      return {
        constraint, passed: total === 0,
        detail: total === 0 ? "Défi réussi : aucun mot interdit prononcé." : `Mot(s) interdit(s) prononcé(s) : ${Object.entries(found).map(([w, n]) => `« ${w} » ×${n}`).join(", ")}.`,
      };
    }
    case "no_fillers":
      return { constraint, passed: metrics.fillerCount === 0, detail: metrics.fillerCount === 0 ? "Zéro mot parasite. Défi réussi." : `${metrics.fillerCount} mot(s) parasite(s) détecté(s).` };
    case "pace_target":
      return { constraint, passed: metrics.wpm >= constraint.min && metrics.wpm <= constraint.max, detail: `Débit mesuré : ${metrics.wpm} mots/min (cible ${constraint.min}-${constraint.max}).` };
    case "must_include": {
      const norm = constraint.words.map(normalize);
      const present = norm.map((w) => words.some((x) => x.norm === w));
      const missing = constraint.words.filter((_, i) => !present[i]);
      return { constraint, passed: missing.length === 0, detail: missing.length === 0 ? "Tous les mots imposés ont été utilisés." : `Mot(s) manquant(s) : ${missing.join(", ")}.` };
    }
    case "no_repeat_word": {
      const n = Object.keys(metrics.repetitions).length;
      return { constraint, passed: n === 0, detail: n === 0 ? "Aucune répétition notable. Défi réussi." : `${n} mot(s) répété(s) plusieurs fois.` };
    }
  }
}

// ---------------------------------------------------------------------------
// Main entry point

export interface AnalyzeOptions {
  exercise?: Pick<Exercise, "durationSec" | "category" | "readText">;
  constraint?: GameConstraint;
}

export function analyzeSpeech(capture: SpeechCapture, opts: AnalyzeOptions = {}): Analysis {
  const units = sentenceUnits(capture);
  const words: Word[] = [];
  units.forEach((u, si) => {
    for (const raw of u.text.split(/\s+/).filter(Boolean)) {
      const norm = normalize(raw);
      if (norm) words.push({ raw, norm, sentence: si });
    }
  });

  const kinds: (IssueKind | undefined)[] = new Array(words.length);
  const issueKeys: (string | undefined)[] = new Array(words.length);
  const fillers: Record<string, number> = {};
  const connectors = new Set<string>();
  let hedges = 0;
  let vague = 0;
  let hesitationSounds = 0;
  let stutters = 0;

  const mark = (from: number, len: number, kind: IssueKind, key: string) => {
    for (let k = from; k < from + len; k++) {
      if (!kinds[k]) { kinds[k] = kind; issueKeys[k] = key; }
    }
  };

  // Pass 1: fixed expressions.
  for (let i = 0; i < words.length; i++) {
    const f = matchAt(words, i, P_FILLERS);
    if (f) {
      const key = words.slice(i, i + f).map((w) => w.norm).join(" ");
      fillers[key] = (fillers[key] ?? 0) + 1;
      if (HESITATION_SOUNDS.has(key)) hesitationSounds++;
      mark(i, f, "filler", `filler:${key}`);
      i += f - 1;
      continue;
    }
    const h = matchAt(words, i, P_HEDGES);
    if (h) { hedges++; mark(i, h, "hedge", "hedge"); i += h - 1; continue; }
    const v = matchAt(words, i, P_VAGUE);
    if (v) { vague++; mark(i, v, "vague", "vague"); i += v - 1; continue; }
    const c = matchAt(words, i, P_CONNECTORS);
    if (c) connectors.add(words.slice(i, i + c).map((w) => w.norm).join(" "));
  }

  // Pass 2: contextual tics ("donc", "voilà", "quoi"...).
  const ctxCounts: Record<string, number> = {};
  for (const w of words) if (P_CONTEXTUAL.has(w.norm)) ctxCounts[w.norm] = (ctxCounts[w.norm] ?? 0) + 1;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (!P_CONTEXTUAL.has(w.norm) || kinds[i]) continue;
    const nextToFiller = kinds[i - 1] === "filler" || kinds[i + 1] === "filler";
    const endOfSentence = (i === words.length - 1 || words[i + 1].sentence !== w.sentence) && (w.norm === "quoi" || w.norm === "voilà");
    const overused = ctxCounts[w.norm] >= 3 && (ctxCounts[w.norm] / Math.max(words.length, 1)) * 100 >= 2;
    if (nextToFiller || endOfSentence || overused) {
      fillers[w.norm] = (fillers[w.norm] ?? 0) + 1;
      mark(i, 1, "filler", `filler:${w.norm}`);
    }
  }

  // Pass 3: stutters ("je je") and over-used content words.
  for (let i = 1; i < words.length; i++) {
    if (words[i].norm === words[i - 1].norm && !kinds[i] && words[i].norm.length > 0) {
      stutters++;
      mark(i, 1, "repetition", `stutter`);
    }
  }
  const contentCounts: Record<string, number> = {};
  for (const [i, w] of words.entries()) {
    if (kinds[i]) continue; // part of a filler / hedge / vague expression
    if (w.norm.length >= 4 && !STOPWORDS.has(w.norm) && !w.norm.includes("'")) {
      contentCounts[w.norm] = (contentCounts[w.norm] ?? 0) + 1;
    }
  }
  const readTextWords = opts.exercise?.readText
    ? new Set(opts.exercise.readText.split(/\s+/).map(normalize))
    : null;
  const repetitions: Record<string, number> = {};
  for (const [word, n] of Object.entries(contentCounts)) {
    if (readTextWords?.has(word)) continue; // reading drills repeat on purpose
    if (n >= 3 && n / Math.max(words.length, 1) >= 0.025) repetitions[word] = n;
  }
  const seen: Record<string, number> = {};
  words.forEach((w, i) => {
    if (repetitions[w.norm] && !kinds[i]) {
      seen[w.norm] = (seen[w.norm] ?? 0) + 1;
      if (seen[w.norm] > 1) mark(i, 1, "repetition", `rep:${w.norm}`);
    }
  });

  // Grammar (regex over the raw transcript, independent of tokenisation).
  const grammarFlags = detectGrammar(capture.transcript);

  // Argumentation / persuasion markers.
  const counterArgumentMarkers = countPhrase(capture.transcript, P_COUNTER);
  const exampleMarkers = countPhrase(capture.transcript, P_EXAMPLE);
  const ctaMarkers = countPhrase(capture.transcript, P_CTA);

  // Sentences and pauses.
  const pauses = detectPauses(capture, units);
  const sentenceWordCounts = units.map((_, si) => words.filter((w) => w.sentence === si).length);
  const nonEmpty = sentenceWordCounts.filter((n) => n > 0);
  const longSentences = nonEmpty.filter((n) => n > LONG_SENTENCE_WORDS).length;
  const avgSentenceWords = nonEmpty.length ? nonEmpty.reduce((a, b) => a + b, 0) / nonEmpty.length : 0;

  // Duration and pace.
  const wordCount = words.length;
  const isText = capture.source === "text";
  const durationSec = isText
    ? Math.max(5, Math.round((wordCount / 145) * 60))
    : Math.max(1, capture.durationSec);
  let edges = 0;
  if (!isText && capture.silences?.length) {
    const lead = capture.silences.find((s) => s.start <= 0.3);
    const trail = capture.silences.find((s) => s.end >= durationSec - 0.3 && s !== lead);
    edges = (lead ? lead.end - lead.start : 0) + (trail ? trail.end - trail.start : 0);
  }
  const trimmedDuration = Math.max(1, durationSec - Math.min(edges, durationSec * 0.6));
  const totalPause = pauses.reduce((a, p) => a + (p.end - p.start), 0);
  const speakingSec = Math.max(1, trimmedDuration - totalPause);
  const wpm = Math.round((wordCount / trimmedDuration) * 60);
  const pace = paceSamples(capture.segments);
  const med = median(pace.map((p) => p.wpm)) || wpm;
  const accelerations = pace.length >= 3 ? pace.filter((p) => p.wpm > med * 1.3).length : 0;
  const slowdowns = pace.length >= 3 ? pace.filter((p) => p.wpm < med * 0.65).length : 0;
  const longestPause = pauses.reduce((m, p) => Math.max(m, p.end - p.start), 0);
  const stability = volumeStability(capture.volume);
  const silenceRatio = isText ? 0 : Math.max(0, Math.min(1, totalPause / trimmedDuration));

  const fillerCount = Object.values(fillers).reduce((a, b) => a + b, 0);
  const fillerPer100 = wordCount ? (fillerCount / wordCount) * 100 : 0;
  const lexicalDiversity = mattr(words.map((w) => w.norm));

  const metrics: Metrics = {
    wordCount,
    uniqueWords: new Set(words.map((w) => w.norm)).size,
    durationSec: Math.round(durationSec),
    speakingSec: Math.round(speakingSec),
    wpm,
    fillerCount,
    fillerPer100: Math.round(fillerPer100 * 10) / 10,
    fillers,
    repetitions,
    sentenceCount: nonEmpty.length,
    avgSentenceWords: Math.round(avgSentenceWords * 10) / 10,
    longSentences,
    pauseCount: pauses.length,
    longestPause: Math.round(longestPause * 10) / 10,
    silenceRatio: Math.round(silenceRatio * 100) / 100,
    lexicalDiversity: Math.round(lexicalDiversity * 100) / 100,
    connectors: [...connectors],
    counterArgumentMarkers,
    exampleMarkers,
    ctaMarkers,
    hedges,
    grammarFlags,
    pace,
    accelerations,
    slowdowns,
    volumeStability: stability,
    typed: isText,
    transcriptionSource: capture.source,
  };

  // ---- Scores ------------------------------------------------------------
  const target = opts.exercise?.durationSec ?? 60;
  const usedRatio = isText ? 1 : durationSec / target;
  const longPauses = pauses.filter((p) => p.end - p.start >= LONG_PAUSE).length;
  const expectedPauses = Math.max(1, Math.floor(durationSec / 20));
  const hes100 = wordCount ? (hesitationSounds / wordCount) * 100 : 0;

  const parasites = interp(fillerPer100, [[0, 97], [1, 92], [3, 82], [6, 68], [10, 52], [16, 35]]);

  let debit: number;
  if (isText) debit = 70;
  else {
    const [lo, hi] = IDEAL_WPM;
    const gap = wpm < lo ? lo - wpm : wpm > hi ? wpm - hi : 0;
    debit = 95 - gap * 0.9 - Math.min(12, accelerations * 4) - Math.min(8, slowdowns * 3);
  }

  const fluidite = 95 - hes100 * 3 - stutters * 4 - longPauses * 9
    - Math.max(0, pauses.length - longPauses - expectedPauses) * 2 - fillerPer100 * 0.8 - silenceRatio * 55;

  const clarte = 92 - longSentences * 6 - Math.max(0, avgSentenceWords - 22) * 1.2 - vague * 5 - fillerPer100 * 1 - silenceRatio * 20;

  const vocabulaire = interp(lexicalDiversity, [[0.45, 45], [0.55, 60], [0.65, 76], [0.72, 86], [0.8, 94]])
    - Object.keys(repetitions).length * 4 - vague * 2;

  const conclusion = [...connectors].some((c) => CONCLUSION_MARKERS.includes(c));
  let structure = interp(connectors.size, [[0, 50], [1, 62], [2, 72], [3, 80], [4, 87], [5, 92]])
    + (conclusion ? 5 : 0)
    + (nonEmpty.length >= 3 ? 3 : -5);
  if (opts.exercise?.readText) structure = Math.max(structure, 80); // reading drills: structure given

  let confiance = 88 - hedges * 5 - fillerPer100 * 1.5 - longPauses * 6 - silenceRatio * 30;
  if (stability !== null) confiance += (stability - 0.6) * 20;
  if (!isText && usedRatio < 0.4) confiance -= 10;
  if (!isText && usedRatio < 0.4) structure -= 10;

  const grammaire = 96 - grammarFlags.length * 10;

  const argumentation = interp(counterArgumentMarkers + exampleMarkers, [[0, 48], [1, 62], [2, 76], [3, 86], [4, 93]])
    + (conclusion ? 4 : 0) - vague * 2;

  const persuasion = 55 + ctaMarkers * 10 + exampleMarkers * 6 - hedges * 4 - fillerPer100 * 1.2;

  const idealWordsPerIdea = 45; // roughly one idea every ~45 words at a natural pace
  const expectedIdeas = Math.max(1, Math.round(wordCount / idealWordsPerIdea));
  const ideaMarkers = Math.max(1, connectors.size + 1);
  const concision = 90 - Math.max(0, ideaMarkers - expectedIdeas) * 3 - longSentences * 5 - Math.max(0, avgSentenceWords - 20) * 1;

  const raw: Record<Dimension, number> = {
    clarte: clamp(clarte), fluidite: clamp(fluidite), confiance: clamp(confiance),
    structure: clamp(structure), vocabulaire: clamp(vocabulaire), debit: clamp(debit),
    parasites: clamp(parasites), argumentation: clamp(argumentation), grammaire: clamp(grammaire),
    persuasion: clamp(persuasion), concision: clamp(concision),
  };
  // Very short answers can't earn high scores: not enough signal.
  if (wordCount < 25) {
    const cap = wordCount < 8 ? 35 : 60;
    for (const d of DIMENSIONS) raw[d] = Math.min(raw[d], cap);
  }
  // A recording that's mostly dead air can't score well either, whatever the
  // few words in it look like: real silence is a strong, honest signal on
  // its own, measured straight from the microphone (not from the
  // transcript, which some browsers' speech recognition can under-report).
  if (!isText && silenceRatio >= 0.5) {
    const cap = silenceRatio >= 0.7 ? 30 : 50;
    for (const d of DIMENSIONS) raw[d] = Math.min(raw[d], cap);
  }
  const scores: Scores = { ...raw, global: globalScore(raw) };

  // ---- Issues ------------------------------------------------------------
  const issues: Issue[] = [];
  const issueIndex = new Map<string, number>();
  const addIssue = (key: string, issue: Issue) => { issueIndex.set(key, issues.length); issues.push(issue); };

  Object.entries(fillers)
    .sort((a, b) => b[1] - a[1])
    .forEach(([word, n]) => {
      const sound = HESITATION_SOUNDS.has(word);
      addIssue(`filler:${word}`, {
        kind: "filler",
        label: `« ${word} »`,
        count: n,
        detail: `« ${word} » utilisé ${n} fois.`,
        suggestion: sound
          ? "Remplace l'hésitation par un silence d'une seconde : il passe pour de la réflexion."
          : `Supprime « ${word} » ou remplace-le par une courte pause naturelle.`,
      });
    });
  if (stutters) addIssue("stutter", {
    kind: "repetition", label: "Mots doublés", count: stutters,
    detail: `${stutters} mot${stutters > 1 ? "s" : ""} répété${stutters > 1 ? "s" : ""} à la suite (« je je »).`,
    suggestion: "Termine ta phrase dans ta tête avant de la dire, puis ralentis sur le premier mot.",
  });
  Object.entries(repetitions).forEach(([word, n]) => addIssue(`rep:${word}`, {
    kind: "repetition", label: `« ${word} » répété`, count: n,
    detail: `« ${word} » revient ${n} fois.`,
    suggestion: "Cherche un synonyme ou reformule avec un pronom pour varier.",
  }));
  if (longSentences) addIssue("long", {
    kind: "long_sentence", label: "Phrases trop longues", count: longSentences,
    detail: `${longSentences} phrase${longSentences > 1 ? "s" : ""} de plus de ${LONG_SENTENCE_WORDS} mots.`,
    suggestion: "Une idée par phrase. Coupe dès que tu entends « et » ou « qui » s'enchaîner.",
  });
  if (pauses.length > expectedPauses || longPauses) addIssue("pause", {
    kind: "pause", label: "Silences subis", count: pauses.length,
    detail: `${pauses.length} pause${pauses.length > 1 ? "s" : ""} notable${pauses.length > 1 ? "s" : ""}, la plus longue de ${metrics.longestPause.toFixed(1).replace(".", ",")} s.`,
    suggestion: "Les pauses après une idée sont bonnes. Celles au milieu d'une phrase trahissent l'hésitation : prépare ta prochaine idée pendant la précédente.",
  });
  if (hedges) addIssue("hedge", {
    kind: "hedge", label: "Formules d'excuse", count: hedges,
    detail: `${hedges} formule${hedges > 1 ? "s" : ""} qui affaibli${hedges > 1 ? "ssent" : "t"} ton propos (« un peu », « je sais pas »…).`,
    suggestion: "Affirme. « Je pense que c'est un peu important » devient « C'est important ».",
  });
  if (vague) addIssue("vague", {
    kind: "vague", label: "Mots flous", count: vague,
    detail: `${vague} expression${vague > 1 ? "s" : ""} vague${vague > 1 ? "s" : ""} (« truc », « tout ça »…).`,
    suggestion: "Nomme les choses précisément : un exemple concret vaut mieux que « des trucs comme ça ».",
  });
  grammarFlags.forEach((g) => addIssue(`gram:${g.match}`, {
    kind: "grammar", label: g.label, count: 1,
    detail: `${g.label} : tournure à revoir.`,
    suggestion: g.fix,
  }));
  if (accelerations) issues.push({
    kind: "pause", label: "Accélérations", count: accelerations,
    detail: `Tu accélères nettement ${accelerations} fois au cours de ta réponse.`,
    suggestion: "Repère les moments où tu t'emballes (souvent sur ce que tu connais bien) et pose une respiration.",
  });

  // ---- Annotated transcript ---------------------------------------------
  const sentences: TranscriptSentence[] = units.map((u, si) => {
    const tokens: TranscriptToken[] = [];
    words.forEach((w, i) => {
      if (w.sentence !== si) return;
      const key = issueKeys[i];
      tokens.push({ text: w.raw, kind: kinds[i], issue: key !== undefined ? issueIndex.get(key) : undefined });
    });
    const next = units[si + 1];
    let pauseAfter: number | undefined;
    if (u.end !== undefined) {
      const p = pauses.find((p) => p.start >= u.end! - 0.6 && (!next?.start || p.end <= next.start + 0.6));
      if (p) pauseAfter = Math.round((p.end - p.start) * 10) / 10;
    }
    return { tokens, tooLong: sentenceWordCounts[si] > LONG_SENTENCE_WORDS, wordCount: sentenceWordCounts[si], pauseAfter };
  }).filter((s) => s.tokens.length > 0);

  const example = pickQuote(sentences);
  const constraintResult = checkConstraint(opts.constraint, words, metrics);
  const feedback = buildFeedback(scores, metrics, issues, example, { usedRatio, isText, readText: !!opts.exercise?.readText, category: opts.exercise?.category });

  return { scores, metrics, issues, sentences, feedback, constraintResult, engine: "heuristic" };
}

/** The sentence carrying the most flagged tokens — a real, grounded excerpt. */
function pickQuote(sentences: TranscriptSentence[]): QuotedExample | null {
  let best: { text: string; kind: IssueKind; score: number } | null = null;
  for (const s of sentences) {
    const flagged = s.tokens.filter((t) => t.kind);
    if (!flagged.length && !s.tooLong) continue;
    const kind = flagged[0]?.kind ?? "long_sentence";
    const score = flagged.length + (s.tooLong ? 2 : 0);
    if (!best || score > best.score) {
      best = { text: s.tokens.map((t) => t.text).join(" "), kind, score };
    }
  }
  return best ? { text: best.text, issue: best.kind } : null;
}
