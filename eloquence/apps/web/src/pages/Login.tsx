import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogIn } from "lucide-react";
import { useStore } from "../lib/store";
import { Wordmark } from "../components/ui";
import { ApiError } from "../lib/http";

export function Login() {
  const { login } = useStore();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
      nav("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Connexion impossible. Réessaie.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="onb">
      <div className="onb-head">
        <button className="icon-btn" onClick={() => nav(-1)} aria-label="Retour"><ArrowLeft size={22} /></button>
        <span style={{ width: 44 }} />
      </div>
      <div className="onb-body">
        <div>
          <Wordmark />
          <h1 style={{ marginTop: 18 }}>Se connecter</h1>
          <p className="muted" style={{ marginTop: 8 }}>Si un e-mail et un mot de passe ont été associés à ton compte, connecte-toi ici pour le retrouver sur cet appareil.</p>
        </div>
        <form onSubmit={submit} className="stack" style={{ gap: 14 }}>
          <label className="field">
            <span>E-mail</span>
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="field">
            <span>Mot de passe</span>
            <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error && <p className="small" style={{ color: "var(--danger, #e0503a)" }}>{error}</p>}
          <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={busy}>
            <LogIn size={17} />{busy ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
