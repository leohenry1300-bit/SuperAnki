import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Clock, Mic, Sparkles } from "lucide-react";
import {
  FREQUENCY_HINTS, FREQUENCY_LABELS, GOAL_GROUPS, GOAL_LABELS, LEVEL_HINTS, LEVEL_LABELS, ONBOARDING_EXERCISE_ID,
  getExercise, type Frequency, type Goal, type Level,
} from "@eloquence/core";
import { useStore } from "../lib/store";
import { useLaunchActivity } from "../lib/launch";
import { Wordmark } from "../components/ui";

const STEPS = 6;

export function Onboarding() {
  const { provisionAccount, startDemo } = useStore();
  const nav = useNavigate();
  const launch = useLaunchActivity();
  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [level, setLevel] = useState<Level | null>(null);
  const [frequency, setFrequency] = useState<Frequency | null>(null);
  const [firstName, setFirstName] = useState("");
  const [busy, setBusy] = useState(false);
  const exercise = getExercise(ONBOARDING_EXERCISE_ID)!;

  const next = () => setStep((s) => Math.min(STEPS - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));
  const profile = () => ({ firstName: firstName.trim() || "toi", goals: goals.length ? goals : ["aisance" as Goal], level: level ?? "intermediaire", frequency: frequency ?? "10" });
  const toggleGoal = (g: Goal) => setGoals((gs) => (gs.includes(g) ? gs.filter((x) => x !== g) : [...gs, g]));

  if (step === 0) {
    return (
      <div className="onb">
        <div className="onb-head"><Wordmark /></div>
        <div className="welcome-hero">
          <div className="welcome-visual" aria-hidden="true">
            {[0.5, 0.8, 1, 0.65, 0.9, 0.45, 0.75, 0.55].map((h, i) => (
              <span key={i} style={{ height: `${h * 100}%`, animationDelay: `${i * 0.12}s`, opacity: 0.35 + h * 0.6 }} />
            ))}
          </div>
          <h1>Parle avec plus <em>d'aisance.</em></h1>
          <p>Ton coach personnel de prise de parole : exercices, jeux, simulations, culture générale et programmes, sans aucune limite.</p>
        </div>
        <div className="onb-foot">
          <button className="btn btn-primary btn-lg btn-block" onClick={next}>Commencer</button>
          <button className="btn btn-outline btn-block" onClick={() => { startDemo(); nav("/"); }}>
            <Sparkles size={17} />Explorer la démo
          </button>
          <button className="btn btn-ghost btn-block" onClick={() => nav("/connexion")}>J'ai déjà un compte</button>
        </div>
      </div>
    );
  }

  return (
    <div className="onb">
      <div className="onb-head">
        <button className="icon-btn" onClick={back} aria-label="Étape précédente"><ArrowLeft size={22} /></button>
        <div className="onb-progress" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS - 1} aria-valuenow={step} aria-label={`Étape ${step} sur ${STEPS - 1}`}>
          {Array.from({ length: STEPS - 1 }, (_, i) => <i key={i} className={i < step ? "on" : ""} />)}
        </div>
        <span style={{ width: 44 }} />
      </div>

      {step === 1 && (
        <div className="onb-body">
          <div>
            <h1>Quels sont tes objectifs ?</h1>
            <p className="muted" style={{ marginTop: 8 }}>Choisis-en autant que tu veux. Ton programme s'adapte à tout ça.</p>
          </div>
          <div className="stack-lg" role="group" aria-label="Objectifs">
            {GOAL_GROUPS.map((grp) => (
              <div key={grp.title} className="stack" style={{ gap: 8 }}>
                <span className="section-title">{grp.title}</span>
                <div className="choice-list">
                  {grp.goals.map((g) => (
                    <button key={g} className="choice" role="checkbox" aria-checked={goals.includes(g)} onClick={() => toggleGoal(g)} style={{ padding: "12px 14px" }}>
                      <span className="choice-title small">{GOAL_LABELS[g]}</span>
                      <Check size={18} className="check" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary btn-lg btn-block" disabled={goals.length === 0} onClick={next}>Continuer ({goals.length} sélectionné{goals.length > 1 ? "s" : ""})</button>
        </div>
      )}
      {step === 2 && (
        <Choices
          title="Comment te sens-tu à l'oral aujourd'hui ?"
          sub="Pas de mauvaise réponse. C'est ton point de départ."
          options={(Object.keys(LEVEL_LABELS) as Level[]).map((l) => ({ id: l, title: LEVEL_LABELS[l], sub: LEVEL_HINTS[l] }))}
          value={level}
          onPick={(l) => { setLevel(l); setTimeout(next, 180); }}
        />
      )}
      {step === 3 && (
        <Choices
          title="Combien de temps veux-tu y consacrer ?"
          sub="La régularité compte plus que la durée."
          options={(Object.keys(FREQUENCY_LABELS) as Frequency[]).map((f) => ({ id: f, title: FREQUENCY_LABELS[f], sub: FREQUENCY_HINTS[f], Icon: Clock }))}
          value={frequency}
          onPick={(f) => { setFrequency(f); setTimeout(next, 180); }}
        />
      )}
      {step === 4 && (
        <form className="onb-body" onSubmit={(e) => { e.preventDefault(); if (firstName.trim()) next(); }}>
          <div>
            <h1>Comment t'appelles-tu ?</h1>
            <p className="muted" style={{ marginTop: 8 }}>Ton coach s'adressera à toi par ton prénom.</p>
          </div>
          <div className="field">
            <label htmlFor="fn">Prénom</label>
            <input id="fn" className="input" autoFocus autoComplete="given-name" maxLength={40} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ton prénom" />
          </div>
          <div style={{ flex: 1 }} />
          <button className="btn btn-primary btn-lg btn-block" disabled={!firstName.trim()}>Continuer</button>
        </form>
      )}
      {step === 5 && (
        <div className="onb-body">
          <div>
            <span className="pill success"><Check size={13} />Tout est gratuit et sans limite</span>
            <h1 style={{ marginTop: 14 }}>{firstName.trim()}, fais ton premier test oral.</h1>
            <p className="muted" style={{ marginTop: 10 }}>60 secondes pour mesurer ton point de départ. Tu pourras ensuite faire le diagnostic complet en 8 étapes, si tu veux un bilan détaillé.</p>
          </div>
          <div className="card">
            <div className="eyebrow">Ton sujet</div>
            <p className="display" style={{ fontSize: 22, marginTop: 8, lineHeight: 1.3 }}>« {exercise.prompt} »</p>
            <div className="row small muted" style={{ marginTop: 14, gap: 16 }}>
              <span className="row" style={{ gap: 6 }}><Clock size={15} />60 secondes</span>
              <span className="row" style={{ gap: 6 }}><Mic size={15} />Micro requis</span>
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <div className="onb-foot">
            <button className="btn btn-primary btn-lg btn-block" disabled={busy} onClick={async () => {
              setBusy(true);
              await provisionAccount(profile());
              launch(exercise, { onboarding: true, source: "catalogue" });
            }}>
              {busy && <span className="spinner" />}<Mic size={18} />Lancer mon premier test
            </button>
            <button className="btn btn-ghost btn-block" disabled={busy} onClick={async () => {
              setBusy(true);
              await provisionAccount(profile());
              nav("/", { replace: true });
            }}>Plus tard</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Choices<T extends string>({ title, sub, options, value, onPick }: {
  title: string;
  sub: string;
  options: { id: T; title: string; sub?: string; Icon?: typeof Clock }[];
  value: T | null;
  onPick: (v: T) => void;
}) {
  return (
    <div className="onb-body">
      <div>
        <h1>{title}</h1>
        <p className="muted" style={{ marginTop: 8 }}>{sub}</p>
      </div>
      <div className="choice-list" role="radiogroup" aria-label={title}>
        {options.map(({ id, title: t, sub: s, Icon }) => (
          <button key={id} className="choice" role="radio" aria-checked={value === id} onClick={() => onPick(id)}>
            {Icon && <span className="choice-icon"><Icon size={20} aria-hidden="true" /></span>}
            <span>
              <span className="choice-title">{t}</span>
              {s && <><br /><span className="choice-sub">{s}</span></>}
            </span>
            <Check size={20} className="check" aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}
