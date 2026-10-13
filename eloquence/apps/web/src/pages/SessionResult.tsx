import { useMemo } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronRight, Cloud, Home as HomeIcon, Sparkles, Trash2, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { DIMENSION_LABELS, DIMENSIONS, buildGameActivity, compareAttempts, getBadge, getExercise, getGame, type Comparison, type SessionResult as Result } from "@eloquence/core";
import { useAccount } from "../lib/store";
import { useLaunchActivity } from "../lib/launch";
import { canGoBackInApp } from "../lib/nav";
import { longDay, signed } from "../lib/format";
import { EmptyState, Icon, ScoreRing, TopBar } from "../components/ui";
import { CompareBars } from "../components/charts";
import {
  AdvancedMetrics, AudioPlayer, CoachFeedback, ConstraintBanner, ContentCoherence, ImproveAnswer, IssueList, ModelAnswer,
  ScoresCard, Transcript,
} from "../components/analysis";

export function SessionResult() {
  const { id = "" } = useParams();
  const location = useLocation() as { state?: { result?: Result; onboarding?: boolean } };
  const { account, mode, deleteSession, toast } = useAccount();
  const launch = useLaunchActivity();
  const nav = useNavigate();
  const fresh = location.state?.result?.session.id === id ? location.state.result : undefined;
  const session = account.sessions.find((s) => s.id === id) ?? fresh?.session;

  const comparison: Comparison | null = useMemo(() => {
    if (fresh) return fresh.comparison;
    if (!session) return null;
    const prev = account.sessions
      .filter((s) => s.exerciseId === session.exerciseId && s.createdAt < session.createdAt)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    return prev ? compareAttempts(prev, session) : null;
  }, [fresh, session, account.sessions]);

  if (!session) {
    return (
      <div className="page no-nav">
        <TopBar title="Session" />
        <EmptyState icon={<Sparkles size={24} />} title="Session introuvable" action={<Link to="/historique" className="btn btn-primary">Voir l'historique</Link>}>
          Elle a peut-être été supprimée.
        </EmptyState>
      </div>
    );
  }

  const a = session.analysis;
  const catalogExercise = getExercise(session.exerciseId);
  const retry = () => {
    if (catalogExercise) launch(catalogExercise, { source: session.source });
    else toast("Cet exercice a été généré au tirage : relance-le depuis Jeux, Sujets ou Simulations pour un nouveau tirage.", "info");
  };
  const topIssues = a.issues.filter((i) => i.kind === "filler" || i.kind === "repetition").slice(0, 2);
  const deltas = comparison?.dimensions;
  const xpTotal = fresh?.xp.reduce((n, l) => n + l.xp, 0) ?? 0;
  const recurring = fresh?.recurringChallenge;

  const remove = async () => {
    if (!window.confirm("Supprimer cette session et son enregistrement ? Cette action est définitive.")) return;
    try {
      await deleteSession(session.id);
      toast("Session supprimée.", "success");
      nav("/historique", { replace: true });
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  return (
    <div className="page no-nav">
      <TopBar title={fresh ? "Ton analyse" : "Session"} onBack={() => (fresh ? nav("/", { replace: true }) : (canGoBackInApp() ? nav(-1) : nav("/historique", { replace: true })))}
        right={fresh ? <Link to="/" className="icon-btn" aria-label="Accueil"><HomeIcon size={20} /></Link> : undefined} />

      <section className="card center celebrate" aria-labelledby="score-title" style={{ paddingTop: 28 }}>
        <div className="small faint">{session.exerciseTitle} · {longDay(session.createdAt)}{session.attempt > 1 ? ` · essai n°${session.attempt}` : ""}</div>
        <div style={{ display: "grid", placeItems: "center", margin: "18px 0 14px" }}>
          <ScoreRing score={session.score} size={168} stroke={12} />
        </div>
        <h1 id="score-title" style={{ fontSize: 20, fontWeight: 650, maxWidth: 420, margin: "0 auto" }}>{a.feedback.headline}</h1>
        {comparison && (
          <div style={{ marginTop: 12 }}>
            <span className={`pill ${comparison.delta > 0 ? "success" : comparison.delta < 0 ? "warning" : ""}`}>
              {comparison.delta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}{signed(comparison.delta)} points
            </span>
          </div>
        )}
      </section>

      {a.constraintResult && (
        <div style={{ marginTop: -4 }}><ConstraintBanner analysis={a} /></div>
      )}

      {fresh && (xpTotal > 0 || fresh.newBadges.length > 0) && (
        <section className="card celebrate" aria-labelledby="xp-title">
          <div className="row-between">
            <h2 id="xp-title" className="section-title">Récompenses</h2>
            <span className="xp-total tabular">+{xpTotal} XP</span>
          </div>
          <div style={{ marginTop: 6 }}>
            {fresh.xp.map((l) => <div className="xp-line" key={l.label}><span className="muted">{l.label}</span><span className="strong tabular">+{l.xp} XP</span></div>)}
          </div>
          {fresh.levelUp && (
            <div className="banner demo" style={{ marginTop: 12 }}><Zap size={18} /><span className="grow">Niveau {fresh.levelUp.level} atteint : <strong>{fresh.levelUp.name}</strong>.</span></div>
          )}
          {fresh.newBadges.map((b) => (
            <div key={b.id} className="row" style={{ marginTop: 12 }}>
              <span className="badge-tile" style={{ padding: 0, boxShadow: "none", background: "transparent" }}><span className="b-ic"><Icon name={getBadge(b.id)?.icon ?? "Award"} /></span></span>
              <div><div className="strong">Badge débloqué : {b.title}</div><div className="small muted">{b.description}</div></div>
            </div>
          ))}
        </section>
      )}

      {fresh && recurring && (
        <section className="card" style={{ background: "var(--warning-soft)", boxShadow: "none" }}>
          <div className="row" style={{ alignItems: "flex-start" }}>
            <span style={{ fontSize: 20 }}>🔁</span>
            <div className="stack" style={{ gap: 8 }}>
              <strong>{recurring.label} revient souvent</strong>
              <span className="small">Détecté sur {recurring.sessionsAffected} de tes dernières sessions. Un défi ciblé peut le faire disparaître en quelques jours.</span>
              <button className="btn btn-sm btn-primary" style={{ alignSelf: "flex-start" }}
                onClick={() => { const g = getGame(recurring.suggestedGameId); if (g) { const built = buildGameActivity(g); launch(built.exercise, { source: "jeu", constraint: built.constraint }); } }}>
                Relever le défi
              </button>
            </div>
          </div>
        </section>
      )}

      {mode === "guest" && (
        <section className="card" style={{ background: "var(--primary-soft)", boxShadow: "none" }} aria-labelledby="save-title">
          <div className="row" style={{ alignItems: "flex-start" }}>
            <Cloud size={22} color="var(--primary-ink)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div className="stack" style={{ gap: 10 }}>
              <h2 id="save-title" style={{ fontSize: 17 }}>Serveur injoignable</h2>
              <p className="small muted">Cette session reste pour l'instant sur cet appareil. Recharge la page une fois le serveur de nouveau accessible pour la sauvegarder automatiquement.</p>
            </div>
          </div>
        </section>
      )}

      <ContentCoherence analysis={a} />
      <ScoresCard analysis={a} deltas={deltas} />

      {comparison && (
        <section className="card" aria-labelledby="cmp-title">
          <h2 id="cmp-title" style={{ fontSize: 18 }}>Avant / après</h2>
          <div className="grid-2" style={{ margin: "16px 0" }}>
            <div className="card soft tight"><div className="small muted">Tentative précédente</div><div className="stat"><span className="v">{comparison.previousScore}<span className="small faint">/100</span></span></div></div>
            <div className="card soft tight" style={{ background: "var(--primary-soft)" }}><div className="small" style={{ color: "var(--primary-ink)" }}>Nouvelle tentative</div><div className="stat"><span className="v">{comparison.newScore}<span className="small faint">/100</span></span></div></div>
          </div>
          <p style={{ marginBottom: 16 }}>{comparison.message}</p>
          <div className="row" style={{ flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
            {DIMENSIONS.filter((d) => d !== "parasites" && (comparison.dimensions[d] ?? 0) !== 0)
              .sort((x, y) => Math.abs(comparison.dimensions[y]!) - Math.abs(comparison.dimensions[x]!)).slice(0, 3)
              .map((d) => <span key={d} className={`pill ${comparison.dimensions[d]! > 0 ? "success" : "warning"}`}>{DIMENSION_LABELS[d]} : {signed(comparison.dimensions[d]!)}</span>)}
            {comparison.fillerChangePct !== null && comparison.fillerChangePct !== 0 && (
              <span className={`pill ${comparison.fillerChangePct < 0 ? "success" : "warning"}`}>Mots parasites : {comparison.fillerChangePct > 0 ? "+" : "−"}{Math.abs(comparison.fillerChangePct)} %</span>
            )}
          </div>
          <CompareBars rows={DIMENSIONS.map((d) => ({ label: DIMENSION_LABELS[d], before: session.analysis.scores[d] - (comparison.dimensions[d] ?? 0), after: session.analysis.scores[d] }))} />
        </section>
      )}

      <section className="card" aria-labelledby="tr-title">
        <div className="row-between" style={{ marginBottom: 14 }}>
          <h2 id="tr-title" style={{ fontSize: 18 }}>Ta réponse</h2>
          {a.metrics.transcriptionSource === "local-whisper" && <span className="pill">Transcrit localement (IA)</span>}
          {a.metrics.transcriptionSource === "server-stt" && <span className="pill">Transcrit par Whisper (serveur)</span>}
        </div>
        <Transcript analysis={a} />
        {topIssues.length > 0 && (
          <div className="card soft tight" style={{ marginTop: 18 }}>
            <div className="section-title" style={{ marginBottom: 2 }}>À améliorer</div>
            <IssueList issues={topIssues} />
          </div>
        )}
      </section>

      <AudioPlayer session={session} />

      <CoachFeedback analysis={a} onRetry={retry} />

      <ImproveAnswer session={session} />
      <ModelAnswer session={session} />

      <AdvancedMetrics analysis={a} />

      <div className="stack">
        {fresh && (
          <Link to="/progression" className="list-item card" style={{ padding: "14px 16px" }}>
            <span className="li-icon"><Icon name="Trophy" size={18} /></span>
            <span className="grow li-title">Voir ma progression</span>
            <ChevronRight size={18} className="faint" />
          </Link>
        )}
        <button className="btn btn-ghost btn-block" onClick={remove}><Trash2 size={16} />Supprimer cette session</button>
      </div>
    </div>
  );
}
