import { useEffect, useState } from "react";
import {
  BrainCircuit, Check, ChevronDown, Eye, Lightbulb, Pause, RotateCcw, Sparkles, Target, TrendingUp, Wand2,
} from "lucide-react";
import type { Analysis, Issue, Session } from "@eloquence/core";
import { DIMENSION_HINTS, DIMENSION_LABELS, DIMENSIONS } from "@eloquence/core";
import { loadClip } from "../lib/audioStore";
import { useAccount } from "../lib/store";
import { DimensionBars } from "./ui";
import { PaceChart } from "./charts";

const KIND_LABEL: Record<string, string> = {
  filler: "Mot parasite",
  repetition: "Répétition",
  hedge: "Formule d'excuse",
  vague: "Mot flou",
  grammar: "Tournure fautive",
  forbidden: "Mot interdit",
};

export function Transcript({ analysis }: { analysis: Analysis }) {
  const issues = analysis.issues;
  return (
    <div className="stack">
      <p className="transcript">
        {analysis.sentences.map((s, si) => (
          <span key={si}>
            <span className={`sent${s.tooLong ? " long" : ""}`} title={s.tooLong ? `Phrase longue : ${s.wordCount} mots` : undefined}>
              {s.tokens.map((t, ti) => {
                const space = ti < s.tokens.length - 1 ? " " : "";
                if (!t.kind) return <span key={ti}>{t.text}{space}</span>;
                const issue: Issue | undefined = t.issue !== undefined ? issues[t.issue] : undefined;
                const tip = `${KIND_LABEL[t.kind] ?? ""}${issue ? ` — ${issue.detail}` : ""}`;
                return (
                  <span key={ti}>
                    <mark className={t.kind} title={tip}>
                      {t.text}
                      <span className="sr-only"> ({KIND_LABEL[t.kind]})</span>
                    </mark>{space}
                  </span>
                );
              })}
            </span>
            {s.pauseAfter ? (
              <span className="pause" title={`Pause de ${s.pauseAfter} s`}>
                <Pause size={10} aria-hidden="true" />{s.pauseAfter.toString().replace(".", ",")} s
                <span className="sr-only"> de pause</span>
              </span>
            ) : null}
            {si < analysis.sentences.length - 1 ? " " : ""}
          </span>
        ))}
      </p>
      <div className="hl-legend" aria-label="Légende">
        <span><i style={{ background: "var(--hl-filler-bg)" }} />Mots parasites</span>
        <span><i style={{ background: "var(--hl-rep-bg)" }} />Répétitions</span>
        <span><i style={{ background: "var(--hl-hedge-bg)" }} />Formulations floues / grammaire</span>
        <span><i style={{ background: "transparent", borderBottom: "2px dotted var(--hl-long)", borderRadius: 0 }} />Phrases trop longues</span>
        <span><Pause size={12} aria-hidden="true" />Longues pauses</span>
      </div>
    </div>
  );
}

export function IssueList({ issues, limit }: { issues: Issue[]; limit?: number }) {
  const list = limit ? issues.slice(0, limit) : issues;
  if (!list.length) {
    return <p className="muted">Rien de notable à corriger. Ton propos est propre.</p>;
  }
  return (
    <div>
      {list.map((i, idx) => (
        <div className="issue" key={idx}>
          <span className={`count ${i.kind === "filler" ? "tone-danger" : i.kind === "repetition" ? "tone-warning" : "tone-primary"}`}>×{i.count}</span>
          <div className="grow">
            <div className="strong">{i.detail}</div>
            <div className="small muted" style={{ marginTop: 2 }}>{i.suggestion}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ConstraintBanner({ analysis }: { analysis: Analysis }) {
  const cr = analysis.constraintResult;
  if (!cr) return null;
  return (
    <div className={`banner ${cr.passed ? "demo" : "warn"}`} role="status">
      {cr.passed ? <Check size={18} /> : <Target size={18} />}
      <span className="grow"><strong>{cr.passed ? "Défi réussi." : "Défi non réussi."}</strong> {cr.detail}</span>
    </div>
  );
}

export function CoachFeedback({ analysis, onRetry }: { analysis: Analysis; onRetry?: () => void }) {
  const f = analysis.feedback;
  return (
    <section className="card" aria-labelledby="fb-title">
      <div className="row-between" style={{ marginBottom: 16 }}>
        <h2 id="fb-title" style={{ fontSize: 18 }}>Le retour de ton coach</h2>
        {analysis.engine === "llm" && <span className="pill primary"><Sparkles size={13} />IA</span>}
      </div>
      <div className="stack" style={{ gap: 16 }}>
        <div className="feedback-block">
          <span className="fb-icon tone-success"><Check size={18} /></span>
          <div>
            <h3>Ce que tu fais bien</h3>
            <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4 }}>{f.strengths.map((s, i) => <li key={i}><p style={{ display: "inline" }}>{s}</p></li>)}</ul>
          </div>
        </div>
        <div className="feedback-block">
          <span className="fb-icon tone-warning"><TrendingUp size={18} /></span>
          <div>
            <h3>Ce qui te pénalise</h3>
            <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4 }}>{f.weaknesses.map((s, i) => <li key={i}><p style={{ display: "inline" }}>{s}</p></li>)}</ul>
          </div>
        </div>
        {f.example && (
          <div className="feedback-block">
            <span className="fb-icon tone-neutral"><Eye size={18} /></span>
            <div>
              <h3>Exemple, dans ce que tu as dit</h3>
              <p style={{ fontStyle: "italic" }}>« {f.example.text} »</p>
              <p className="small muted" style={{ marginTop: 6 }}>{f.why}</p>
            </div>
          </div>
        )}
        <div className="feedback-block">
          <span className="fb-icon tone-primary"><Lightbulb size={18} /></span>
          <div><h3>Comment corriger</h3><p>{f.howToFix}</p></div>
        </div>
        <div className="feedback-block">
          <span className="fb-icon tone-neutral"><Target size={18} /></span>
          <div><h3>Objectif pour la prochaine fois</h3><p>{f.goal}</p></div>
        </div>
      </div>
      {onRetry && (
        <button className="btn btn-primary btn-block btn-lg" style={{ marginTop: 20 }} onClick={onRetry}>
          <RotateCcw size={18} />Refaire l'exercice
        </button>
      )}
    </section>
  );
}

/**
 * Shown only when an AI key is configured — the heuristic engine can't
 * judge whether what was said actually makes sense, so this never appears
 * (and never fabricates a verdict) offline.
 */
export function ContentCoherence({ analysis }: { analysis: Analysis }) {
  const c = analysis.contentCoherence;
  if (!c) return null;
  const tone = c.score >= 70 ? "tone-success" : c.score >= 40 ? "tone-warning" : "tone-danger";
  return (
    <section className="card" aria-labelledby="coherence-title">
      <div className="row-between" style={{ marginBottom: 10 }}>
        <h2 id="coherence-title" style={{ fontSize: 18 }}>Pertinence du contenu</h2>
        <span className="pill primary"><Sparkles size={13} />IA</span>
      </div>
      <div className="feedback-block">
        <span className={`fb-icon ${tone}`}><BrainCircuit size={18} /></span>
        <div>
          <p><strong>{c.score}/100</strong> — {c.reason}</p>
          <p className="tiny faint" style={{ marginTop: 6 }}>Contrairement aux autres scores (débit, mots parasites…), celui-ci juge si ce que tu as dit répond vraiment à la consigne, pas juste comment tu l'as dit.</p>
        </div>
      </div>
    </section>
  );
}

export function ScoresCard({ analysis, deltas }: { analysis: Analysis; deltas?: Partial<Record<(typeof DIMENSIONS)[number], number>> }) {
  return (
    <section className="card" aria-labelledby="scores-title">
      <h2 id="scores-title" style={{ fontSize: 18, marginBottom: 16 }}>Détail par compétence</h2>
      <DimensionBars scores={analysis.scores} deltas={deltas} unmeasured={analysis.metrics.typed ? ["debit"] : undefined} />
      <details style={{ marginTop: 16 }}>
        <summary className="small muted" style={{ cursor: "pointer" }}>Comment sont calculés ces scores ?</summary>
        <ul className="small muted" style={{ paddingLeft: 18, marginTop: 8, display: "grid", gap: 4 }}>
          {DIMENSIONS.map((d) => <li key={d}><strong>{DIMENSION_LABELS[d]}</strong> : {DIMENSION_HINTS[d]}</li>)}
        </ul>
        <p className="tiny faint" style={{ marginTop: 8 }}>Ce sont des indicateurs d'entraînement calculés à partir de ta voix et de ton texte — pas une mesure scientifique exacte, et jamais une lecture de ton état intérieur.</p>
      </details>
    </section>
  );
}

export function AdvancedMetrics({ analysis }: { analysis: Analysis }) {
  const m = analysis.metrics;
  return (
    <section className="card" aria-labelledby="adv-title">
      <h2 id="adv-title" style={{ fontSize: 18, marginBottom: 16 }}>Analyse avancée</h2>
      <div className="stack-lg">
        <div className="grid-3">
          <div className="stat"><span className="v">{m.typed ? "—" : m.wpm}</span><span className="l">mots / min</span></div>
          <div className="stat"><span className="v">{m.wordCount}</span><span className="l">mots</span></div>
          <div className="stat"><span className="v">{m.fillerPer100.toString().replace(".", ",")}</span><span className="l">parasites / 100 mots</span></div>
          <div className="stat"><span className="v">{m.pauseCount}</span><span className="l">pauses notables</span></div>
          <div className="stat"><span className="v">{m.avgSentenceWords.toString().replace(".", ",")}</span><span className="l">mots / phrase</span></div>
          <div className="stat"><span className="v">{Math.round(m.lexicalDiversity * 100)} %</span><span className="l">diversité lexicale</span></div>
        </div>
        {m.pace.length >= 2 && (
          <div className="stack" style={{ gap: 8 }}>
            <div className="row-between"><span className="strong small">Débit au fil de ta réponse</span><span className="tiny faint">zone verte : 130–160</span></div>
            <PaceChart samples={m.pace} />
          </div>
        )}
        {m.connectors.length > 0 && (
          <div className="stack" style={{ gap: 8 }}>
            <span className="strong small">Mots de liaison utilisés</span>
            <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>{m.connectors.map((c) => <span key={c} className="pill">{c}</span>)}</div>
          </div>
        )}
        <div className="row" style={{ gap: 16, flexWrap: "wrap" }}>
          <span className="pill">{m.exampleMarkers} exemple(s) concret(s)</span>
          <span className="pill">{m.counterArgumentMarkers} nuance/contre-argument</span>
          {m.grammarFlags.length > 0 && <span className="pill warning">{m.grammarFlags.length} tournure(s) à revoir</span>}
        </div>
        <div className="stack" style={{ gap: 4 }}>
          <span className="strong small">Tous les points relevés</span>
          <IssueList issues={analysis.issues} />
        </div>
      </div>
    </section>
  );
}

export function AudioPlayer({ session }: { session: Session }) {
  const [src, setSrc] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    let url: string | null = null;
    let alive = true;
    if (!session.audioUrl) { setMissing(true); return; }
    if (session.audioUrl.startsWith("idb:")) {
      void loadClip(session.audioUrl.slice(4)).then((blob) => {
        if (!alive) return;
        if (!blob) { setMissing(true); return; }
        url = URL.createObjectURL(blob);
        setSrc(url);
      });
    } else {
      // Fetch the whole file into a Blob instead of pointing <audio> at the
      // server URL directly: Safari negotiates HTTP Range requests against
      // the recorded MP4's fragmented container unreliably (plays through
      // instantly with no sound). A fully-downloaded Blob URL has no range
      // negotiation to get wrong — the browser just seeks in memory.
      void fetch(session.audioUrl)
        .then((r) => (r.ok ? r.blob() : Promise.reject(new Error("audio fetch failed"))))
        .then((blob) => {
          if (!alive) return;
          url = URL.createObjectURL(blob);
          setSrc(url);
        })
        .catch(() => { if (alive) setMissing(true); });
    }
    return () => { alive = false; if (url) URL.revokeObjectURL(url); };
  }, [session.audioUrl]);
  if (missing) return null;
  return (
    <section className="card tight" aria-label="Réécouter ta réponse">
      <div className="row" style={{ marginBottom: 10 }}>
        <span className="strong small">🔊 Réécoute-toi</span>
        <span className="tiny faint" style={{ marginLeft: "auto" }}>C'est là qu'on progresse le plus</span>
      </div>
      {src ? <audio controls src={src} style={{ width: "100%" }} preload="metadata" /> : <div className="skeleton" style={{ height: 40 }} />}
    </section>
  );
}

const REWRITE_TABS = [
  { id: "clair", label: "Plus clair" },
  { id: "concis", label: "Plus concis" },
  { id: "pro", label: "Plus pro" },
  { id: "persuasif", label: "Plus persuasif" },
] as const;

export function ImproveAnswer({ session }: { session: Session }) {
  const { rewrite, toast } = useAccount();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ clair: string; concis: string; pro: string; persuasif: string | null } | null>(null);
  const [tab, setTab] = useState<(typeof REWRITE_TABS)[number]["id"]>("clair");

  const load = async () => {
    setOpen(true);
    if (result) return;
    setBusy(true);
    try {
      setResult(await rewrite(session.id, session.transcript));
    } catch (e) {
      toast((e as Error).message, "error");
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card">
      <button className="row-between" style={{ width: "100%", background: "none", border: 0, cursor: "pointer", padding: 0 }} onClick={() => (open ? setOpen(false) : void load())}>
        <span className="row" style={{ gap: 10 }}><Wand2 size={18} /><span className="strong">Améliorer ma réponse</span></span>
        <ChevronDown size={18} style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform .2s" }} />
      </button>
      {open && (
        <div className="stack" style={{ marginTop: 16 }}>
          {busy && <div className="skeleton" style={{ height: 100 }} />}
          {result && (
            <>
              <div className="segmented" role="tablist">
                {REWRITE_TABS.filter((t) => t.id !== "persuasif" || result.persuasif).map((t) => (
                  <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>
                ))}
              </div>
              <p style={{ lineHeight: 1.6 }}>{result[tab] ?? "Non disponible sans coach IA configuré."}</p>
              {!result.persuasif && <p className="tiny faint">La version persuasive et les reformulations les plus fines demandent le coach IA (clé Anthropic côté serveur). En local, ces versions restent mécaniques : elles retirent tes propres tics sans jamais inventer de contenu.</p>}
            </>
          )}
        </div>
      )}
    </section>
  );
}

export function ModelAnswer({ session }: { session: Session }) {
  const { modelAnswer, toast } = useAccount();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<string | null | undefined>(undefined);

  const load = async () => {
    setOpen(true);
    if (answer !== undefined) return;
    setBusy(true);
    try {
      setAnswer(await modelAnswer(session));
    } catch (e) {
      toast((e as Error).message, "error");
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card">
      <button className="row-between" style={{ width: "100%", background: "none", border: 0, cursor: "pointer", padding: 0 }} onClick={() => (open ? setOpen(false) : void load())}>
        <span className="row" style={{ gap: 10 }}><Sparkles size={18} /><span className="strong">Voir une réponse modèle</span></span>
        <ChevronDown size={18} style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform .2s" }} />
      </button>
      {open && (
        <div className="stack" style={{ marginTop: 16 }}>
          {busy && <div className="skeleton" style={{ height: 100 }} />}
          {answer === null && <p className="muted small">Disponible avec le coach IA (clé Anthropic configurée côté serveur). En local, utilise plutôt « Améliorer ma réponse », toujours disponible.</p>}
          {answer && (
            <>
              <p className="tiny faint">Une bonne façon d'y répondre — pas « la » seule bonne réponse.</p>
              <p style={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{answer}</p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
