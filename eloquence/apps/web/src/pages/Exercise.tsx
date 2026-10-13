import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle, Check, Keyboard, Mic, MicOff, Pause, Play, RotateCcw, Square, X,
} from "lucide-react";
import { getCategory, getExercise, type ActivitySource, type Exercise as ExerciseT, type GameConstraint, type SpeechCapture } from "@eloquence/core";
import { useAccount } from "../lib/store";
import { ApiError } from "../lib/http";
import { canGoBackInApp } from "../lib/nav";
import { localWhisperSupported, transcribeLocally } from "../lib/localWhisper";
import { MIC_ERROR_TEXT, micSupport, useRecorder, type RecorderResult } from "../lib/recorder";
import { clock, formatDurationLong } from "./exerciseFormat";
import { Icon } from "../components/ui";

type Phase = "prep" | "live" | "text" | "transcribing" | "analyzing" | "failed" | "empty";

export interface ExerciseNavState {
  activity?: ExerciseT;
  constraint?: GameConstraint;
  source?: ActivitySource;
  onboarding?: boolean;
  /** Set while running the initial diagnostic battery. */
  diagnostic?: { stepId: string; title: string; index: number; total: number };
  /** Set while running a "session rapide" queue item. */
  quickReturn?: boolean;
}

const STEPS = ["Transcription de ta voix", "Rythme et pauses", "Mots parasites et répétitions", "Retour de ton coach"];

export function Exercise() {
  const { id = "" } = useParams();
  const location = useLocation();
  const navState = (location.state ?? {}) as ExerciseNavState;
  const exercise = navState.activity ?? getExercise(id);
  const source: ActivitySource = navState.source ?? (navState.activity ? "libre" : "catalogue");
  const onboarding = !!navState.onboarding;
  const { account, server, mode, submitSession, toast } = useAccount();
  const nav = useNavigate();

  const [phase, setPhase] = useState<Phase>("prep");
  const [failure, setFailure] = useState<string | null>(null);
  const [pending, setPending] = useState<RecorderResult | null>(null);
  const [text, setText] = useState("");
  const [step, setStep] = useState(0);
  const [transcribeProgress, setTranscribeProgress] = useState<number | null>(null);
  const finishRef = useRef<() => void>(() => undefined);

  const duration = exercise?.category === "improvisation" && !navState.activity ? account.user.settings.sessionSeconds : exercise?.durationSec ?? 60;
  const rec = useRecorder({
    language: account.user.settings.language,
    maxSeconds: duration,
    onAutoStop: () => finishRef.current(),
  });

  const serverTranscribes = mode === "account" && server?.stt === "openai";
  const wantsLocalWhisper = account.user.settings.localTranscription && localWhisperSupported();

  const submit = useCallback(async (capture: SpeechCapture, audio: Blob | null) => {
    if (!exercise) return;
    setPhase("analyzing");
    setStep(0);
    const timer = window.setInterval(() => setStep((s) => Math.min(STEPS.length - 1, s + 1)), 650);
    const minDelay = new Promise((r) => setTimeout(r, 2600));
    try {
      const [result] = await Promise.all([
        submitSession({ exercise, source: navState.diagnostic ? "diagnostic" : source, capture, audio, constraint: navState.constraint, onboarding }),
        minDelay,
      ]);
      window.clearInterval(timer);
      if (navState.diagnostic) {
        nav("/diagnostic", { replace: true, state: { stepResult: { stepId: navState.diagnostic.stepId, title: navState.diagnostic.title, sessionId: result.session.id, scores: result.session.analysis.scores } } });
        return;
      }
      nav(`/session/${result.session.id}`, { replace: true, state: { result, onboarding } });
    } catch (e) {
      window.clearInterval(timer);
      if (e instanceof ApiError && e.code === "empty_transcript") {
        setPhase("empty");
        return;
      }
      setFailure((e as Error).message);
      setPhase("failed");
    }
  }, [exercise, nav, onboarding, source, submitSession, navState.constraint, navState.diagnostic]);

  const finish = useCallback(async () => {
    if (rec.status !== "recording" && rec.status !== "paused") return;
    const result = await rec.stop();
    setPending(result);
    if (wantsLocalWhisper && result.audio) {
      setPhase("transcribing");
      setTranscribeProgress(null);
      try {
        const local = await transcribeLocally(result.audio, account.user.settings.language, (p) => setTranscribeProgress(p.percent));
        if (local.transcript.trim()) {
          Object.assign(result.capture, { transcript: local.transcript, segments: local.segments, source: "local-whisper" });
        } else {
          toast("La transcription locale n'a rien capté, on garde celle du navigateur.", "info");
        }
      } catch (e) {
        // Local model failed to load or run (unsupported device, out of
        // memory…): fall back to whatever the browser's own speech
        // recognition already captured — never block the session — but say
        // so, so it's never a silent, invisible fallback.
        const detail = (e as Error).message || String(e);
        console.error("[local whisper]", detail);
        toast(`Transcription locale indisponible : ${detail.slice(0, 140)}`, "error");
      }
    }
    const heard = result.capture.transcript.trim().length > 0;
    if (!heard && !serverTranscribes) {
      setPhase("empty");
      return;
    }
    await submit(result.capture, result.audio);
  }, [rec, serverTranscribes, submit, wantsLocalWhisper, account.user.settings.language]);
  finishRef.current = () => void finish();

  // Guards against a second getUserMedia() firing while the first is still
  // pending (e.g. a double space-bar press): without this, the first stream
  // never gets its ref set (overwritten by the second) and its tracks are
  // never stopped, silently holding the microphone busy for later attempts.
  const startingRef = useRef(false);
  const begin = async () => {
    if (startingRef.current || rec.status === "requesting" || rec.status === "recording") return;
    startingRef.current = true;
    try {
      if (await rec.start()) setPhase("live");
    } finally {
      startingRef.current = false;
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || (e.target as HTMLElement).closest("input, textarea, button, a")) return;
      e.preventDefault();
      if (phase === "prep") void begin();
      else if (phase === "live") void finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!exercise) {
    return (
      <div className="run">
        <Header onClose={() => nav("/entrainement")} />
        <div className="run-body center">
          <h1 className="page-title">Exercice introuvable</h1>
          <Link to="/entrainement" className="btn btn-primary">Voir les exercices</Link>
        </div>
      </div>
    );
  }

  const cat = getCategory(exercise.category);
  const remaining = Math.max(0, duration - rec.elapsed);
  const support = micSupport();

  if (phase === "transcribing") {
    return (
      <div className="analyzing" role="status" aria-live="polite">
        <div className="center">
          <div className="orb" aria-hidden="true" />
          <h1 className="page-title">Transcription locale en cours…</h1>
          <p className="muted" style={{ marginTop: 8 }}>
            {transcribeProgress === null
              ? "Ça tourne entièrement sur ton téléphone, rien n'est envoyé à un serveur."
              : transcribeProgress < 100
                ? `Téléchargement du modèle (une seule fois) : ${Math.round(transcribeProgress)} %`
                : "Analyse de ta voix…"}
          </p>
        </div>
      </div>
    );
  }

  if (phase === "analyzing") {
    return (
      <div className="analyzing" role="status" aria-live="polite">
        <div className="center">
          <div className="orb" aria-hidden="true" />
          <h1 className="page-title">Analyse de ta réponse…</h1>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <li key={s} className={i < step ? "done" : i === step ? "active" : ""}>
                {i < step ? <Check size={16} color="var(--success)" /> : i === step ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <span style={{ width: 16 }} />}
                {s}
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="run">
      <Header
        category={navState.diagnostic ? <><Icon name="ClipboardCheck" size={14} />Diagnostic {navState.diagnostic.index}/{navState.diagnostic.total}</> : <><Icon name={cat.icon} size={14} />{cat.title}</>}
        onClose={() => {
          if (phase === "live" && !window.confirm("Arrêter l'exercice ? Ta réponse ne sera pas analysée.")) return;
          rec.reset();
          if (onboarding) nav("/");
          else if (navState.diagnostic) nav("/diagnostic");
          else if (canGoBackInApp()) nav(-1);
          else nav("/entrainement");
        }}
      />

      <div className="run-body">
        <div className="run-prompt">
          <h1>{exercise.title}</h1>
          {exercise.prompt !== exercise.title && <p>{exercise.stance ? exercise.prompt : `« ${exercise.prompt} »`}</p>}
          {exercise.stance && <div className="stance">« {exercise.stance} »</div>}
          <p className="small" style={{ marginTop: 12 }}>{exercise.instruction}</p>
        </div>

        {exercise.readText && (phase === "prep" || phase === "live") && <div className="read-text">{exercise.readText}</div>}

        {phase === "prep" && exercise.scaffold && (
          <div className="scaffold" aria-label="Structure suggérée">
            <ol>{exercise.scaffold.map((s, i) => <li key={s}><span className="pill">{i + 1}. {s}</span></li>)}</ol>
          </div>
        )}

        {(phase === "prep" || phase === "live") && rec.status !== "error" && (
          <LiveRecorder rec={rec} remaining={remaining} duration={duration} onStart={begin} onFinish={() => void finish()} />
        )}

        {phase === "prep" && (rec.status === "error" || !support.ok) && (
          <MicErrorCard error={rec.error ?? (support.ok ? "unknown" : support.error)} onRetry={() => { rec.reset(); void begin(); }} onText={() => setPhase("text")} />
        )}

        {phase === "prep" && support.ok && rec.status !== "error" && !rec.speechAvailable && !serverTranscribes && (
          <div className="banner warn" role="note">
            <AlertTriangle size={18} aria-hidden="true" />
            <span className="grow">Ton navigateur ne transcrit pas la voix. Utilise Chrome ou Edge, ou réponds par écrit.</span>
          </div>
        )}

        {phase === "text" && (
          <form className="stack" onSubmit={(e) => { e.preventDefault(); void submit({ transcript: text, durationSec: 0, source: "text" }, null); }}>
            <label htmlFor="answer" className="strong">Écris ta réponse comme tu la dirais à l'oral</label>
            <textarea id="answer" className="textarea" rows={7} value={text} onChange={(e) => setText(e.target.value)} autoFocus
              placeholder="Garde les « euh » et les « du coup » si tu les dirais : l'analyse est là pour ça." />
            <div className="row-between tiny faint"><span>{text.trim() ? text.trim().split(/\s+/).length : 0} mots</span><span>Le débit n'est pas mesuré en mode texte</span></div>
            <button className="btn btn-primary btn-lg btn-block" disabled={text.trim().split(/\s+/).length < 5}>Analyser ma réponse</button>
            {support.ok && <button type="button" className="btn btn-ghost btn-block" onClick={() => { rec.reset(); setPhase("prep"); }}><Mic size={16} />Revenir au micro</button>}
          </form>
        )}

        {phase === "empty" && (
          <div className="card stack center" style={{ alignItems: "center" }} role="alert">
            <span className="stat-tile" style={{ padding: 0, boxShadow: "none" }}><span className="icon tone-warning" style={{ width: 48, height: 48, borderRadius: 16 }}><MicOff size={22} /></span></span>
            <h2 style={{ fontSize: 20 }}>{rec.speechAvailable ? "Nous n'avons rien entendu" : "Transcription indisponible"}</h2>
            <p className="muted">{rec.speechAvailable
              ? "Vérifie que ton micro n'est pas coupé, rapproche-toi et parle un peu plus fort."
              : "Ton navigateur n'a pas pu transcrire ta voix. Réessaie dans Chrome ou Edge, ou réponds par écrit."}</p>
            <div className="stack" style={{ width: "100%" }}>
              <button className="btn btn-primary btn-block" onClick={() => { rec.reset(); setPhase("prep"); }}><RotateCcw size={16} />Réessayer</button>
              <button className="btn btn-outline btn-block" onClick={() => setPhase("text")}><Keyboard size={16} />Répondre par écrit</button>
            </div>
          </div>
        )}

        {phase === "failed" && (
          <div className="card stack center" style={{ alignItems: "center" }} role="alert">
            <span className="stat-tile" style={{ padding: 0, boxShadow: "none" }}><span className="icon tone-danger" style={{ width: 48, height: 48, borderRadius: 16 }}><AlertTriangle size={22} /></span></span>
            <h2 style={{ fontSize: 20 }}>L'analyse n'a pas abouti</h2>
            <p className="muted">{failure}</p>
            <div className="stack" style={{ width: "100%" }}>
              {pending && <button className="btn btn-primary btn-block" onClick={() => void submit(pending.capture, pending.audio)}>Renvoyer ma réponse</button>}
              {!pending && text && <button className="btn btn-primary btn-block" onClick={() => void submit({ transcript: text, durationSec: 0, source: "text" }, null)}>Renvoyer ma réponse</button>}
              <button className="btn btn-outline btn-block" onClick={() => { rec.reset(); setPending(null); setPhase("prep"); }}>Recommencer l'exercice</button>
            </div>
          </div>
        )}
      </div>

      {phase === "prep" && support.ok && rec.status !== "error" && (
        <button className="btn btn-ghost btn-block btn-wrap" onClick={() => setPhase("text")}><Keyboard size={16} />Pas de micro ? Réponds par écrit</button>
      )}
    </div>
  );
}

function Header({ category, onClose }: { category?: React.ReactNode; onClose: () => void }) {
  return (
    <header className="topbar">
      <button className="icon-btn" onClick={onClose} aria-label="Quitter l'exercice"><X size={22} /></button>
      <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>{category && <span className="pill">{category}</span>}</div>
      <span className="spacer" />
    </header>
  );
}

function MicErrorCard({ error, onRetry, onText }: { error: keyof typeof MIC_ERROR_TEXT; onRetry: () => void; onText: () => void }) {
  const t = MIC_ERROR_TEXT[error];
  return (
    <div className="card stack center" style={{ alignItems: "center" }} role="alert">
      <span className="stat-tile" style={{ padding: 0, boxShadow: "none" }}><span className="icon tone-danger" style={{ width: 48, height: 48, borderRadius: 16 }}><MicOff size={22} /></span></span>
      <h2 style={{ fontSize: 20 }}>{t.title}</h2>
      <p className="muted">{t.body}</p>
      <div className="stack" style={{ width: "100%" }}>
        {error !== "unsupported" && error !== "insecure" && <button className="btn btn-primary btn-block" onClick={onRetry}><RotateCcw size={16} />Réessayer</button>}
        <button className="btn btn-outline btn-block" onClick={onText}><Keyboard size={16} />Répondre par écrit</button>
      </div>
    </div>
  );
}

type Rec = ReturnType<typeof useRecorder>;

function LiveRecorder({ rec, remaining, duration, onStart, onFinish }: {
  rec: Rec; remaining: number; duration: number; onStart: () => void; onFinish: () => void;
}) {
  const live = rec.status === "recording";
  const paused = rec.status === "paused";
  const active = live || paused;
  const haloRef = useRef<HTMLSpanElement>(null);
  const halo2Ref = useRef<HTMLSpanElement>(null);

  return (
    <div className="stack-lg">
      <div aria-live="off">
        <div className={`timer${active && remaining <= 10 ? " warn" : ""}`} role="timer" aria-label={`Temps restant ${Math.ceil(remaining)} secondes`}>
          {clock(active ? remaining : duration)}
        </div>
        <div className="timer-sub">{paused ? "En pause" : live ? "Parle naturellement" : formatDurationLong(duration)}</div>
      </div>

      <div className="mic-wrap">
        <span ref={halo2Ref} className={`mic-halo h2${!active ? " mic-idle-pulse" : ""}`} aria-hidden="true" />
        <span ref={haloRef} className="mic-halo" aria-hidden="true" />
        {!active ? (
          <button className="mic-btn" onClick={onStart} disabled={rec.status === "requesting"} aria-label="Commencer à parler">
            {rec.status === "requesting" ? <span className="spinner" style={{ width: 34, height: 34, borderWidth: 3 }} /> : <Mic size={52} strokeWidth={1.8} />}
          </button>
        ) : (
          <button className="mic-btn live" onClick={onFinish} aria-label="Terminer et analyser">
            <Square size={40} fill="currentColor" strokeWidth={0} />
          </button>
        )}
        {active && <HaloDriver analyser={rec.analyser} halo={haloRef} halo2={halo2Ref} paused={paused} />}
      </div>

      {active && <Waveform analyser={rec.analyser} paused={paused} />}

      {active && (
        <p className="live-text" aria-live="polite">
          {rec.finalText.split(" ").slice(-16).join(" ")} <span className="interim">{rec.interim}</span>
          {!rec.finalText && !rec.interim && <span className="interim">{rec.speechAvailable ? "La transcription s'affiche ici pendant que tu parles…" : "Enregistrement en cours…"}</span>}
        </p>
      )}

      {active ? (
        <div className="run-controls">
          <button className="round-btn" onClick={paused ? rec.resume : rec.pause} aria-label={paused ? "Reprendre" : "Mettre en pause"}>
            {paused ? <Play size={22} /> : <Pause size={22} />}
          </button>
          <button className="btn btn-secondary" onClick={onFinish}><Check size={18} />Terminer</button>
        </div>
      ) : (
        <p className="center small faint">Appuie sur le micro pour commencer <span className="kbd-hint">(ou barre d'espace)</span></p>
      )}
    </div>
  );
}

function useAnalyserLoop(analyser: RefObject<AnalyserNode | null>, paused: boolean, draw: (data: Uint8Array) => void) {
  useEffect(() => {
    let raf = 0;
    const data = new Uint8Array(256);
    const loop = () => {
      const an = analyser.current;
      if (an && !paused) {
        an.getByteFrequencyData(data);
        draw(data);
      } else if (paused) {
        draw(new Uint8Array(256));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [analyser, paused, draw]);
}

function HaloDriver({ analyser, halo, halo2, paused }: { analyser: RefObject<AnalyserNode | null>; halo: RefObject<HTMLSpanElement | null>; halo2: RefObject<HTMLSpanElement | null>; paused: boolean }) {
  const draw = useCallback((data: Uint8Array) => {
    let sum = 0;
    for (let i = 2; i < 80; i++) sum += data[i];
    const level = Math.min(1, sum / 78 / 140);
    if (halo.current) halo.current.style.transform = `scale(${1 + level * 0.35})`;
    if (halo2.current) halo2.current.style.transform = `scale(${1 + level * 0.7})`;
  }, [halo, halo2]);
  useAnalyserLoop(analyser, paused, draw);
  return null;
}

function Waveform({ analyser, paused }: { analyser: RefObject<AnalyserNode | null>; paused: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const draw = useCallback((data: Uint8Array) => {
    const c = canvas.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth * dpr;
    const h = c.clientHeight * dpr;
    if (c.width !== w) c.width = w;
    if (c.height !== h) c.height = h;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, w, h);
    const color = getComputedStyle(c).getPropertyValue("--primary").trim() || "#4f3bd6";
    ctx.fillStyle = color;
    const bars = 40;
    const gap = 4 * dpr;
    const bw = (w - gap * (bars - 1)) / bars;
    for (let i = 0; i < bars; i++) {
      const idx = Math.floor((Math.abs(i - bars / 2) / (bars / 2)) * 90) + 2;
      const v = data[idx] / 255;
      const bh = Math.max(3 * dpr, v * h * 0.95);
      ctx.globalAlpha = 0.35 + v * 0.65;
      const x = i * (bw + gap);
      const y = (h - bh) / 2;
      ctx.beginPath();
      ctx.roundRect(x, y, bw, bh, bw / 2);
      ctx.fill();
    }
  }, []);
  useAnalyserLoop(analyser, paused, draw);
  return <canvas ref={canvas} className="wave" aria-hidden="true" />;
}
