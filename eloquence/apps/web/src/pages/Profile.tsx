import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell, Camera, ChevronRight, Clock, ClipboardCheck, CloudUpload, Download, Globe, LogOut, Mic, Moon,
  Pencil, ShieldCheck, Target, Trash2, Trophy, Upload,
} from "lucide-react";
import { GOAL_GROUPS, GOAL_LABELS, LEVEL_LABELS, levelFor, type Goal, type Level, type UserSettings } from "@eloquence/core";
import { useAccount } from "../lib/store";
import { http } from "../lib/http";
import { localWhisperSupported } from "../lib/localWhisper";
import { nf, spokenTime } from "../lib/format";
import { Avatar, Sheet, Switch } from "../components/ui";

const LANGS: { id: UserSettings["language"]; label: string }[] = [
  { id: "fr-FR", label: "Français (France)" },
  { id: "fr-BE", label: "Français (Belgique)" },
  { id: "fr-CH", label: "Français (Suisse)" },
  { id: "fr-CA", label: "Français (Canada)" },
];

async function resizeImage(file: File, size = 256): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const s = Math.min(bitmap.width, bitmap.height);
  ctx.drawImage(bitmap, (bitmap.width - s) / 2, (bitmap.height - s) / 2, s, s, 0, 0, size, size);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function Profile() {
  const { account, summary, mode, updateMe, logout, deleteAccount, importBackup, toast } = useAccount();
  const { user } = account;
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const level = levelFor(summary.xp);

  const save = async (patch: Parameters<typeof updateMe>[0], msg?: string) => {
    try {
      await updateMe(patch);
      if (msg) toast(msg, "success");
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };
  const setSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => save({ settings: { [key]: value } });

  const toggleNotifications = async (on: boolean) => {
    if (on && "Notification" in window && Notification.permission !== "granted") {
      const p = await Notification.requestPermission();
      if (p !== "granted") {
        toast("Notifications bloquées par le navigateur. Autorise-les dans ses réglages.", "error");
        return;
      }
    }
    await setSetting("notifications", on);
  };

  const exportData = async () => {
    try {
      const data = mode === "account" ? await http("GET", "/api/me/export") : account;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "eloquence-mes-donnees.json";
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const importData = async (file?: File) => {
    if (!file) return;
    try {
      const raw = JSON.parse(await file.text());
      await importBackup(raw);
      toast("Données importées.", "success");
    } catch (e) {
      toast(e instanceof SyntaxError ? "Ce fichier n'est pas un export valide." : (e as Error).message, "error");
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  };

  const onAvatar = async (file?: File) => {
    if (!file) return;
    try {
      await save({ avatar: await resizeImage(file) }, "Photo mise à jour.");
    } catch {
      toast("Image illisible. Essaie un autre fichier.", "error");
    }
  };

  return (
    <div className="page">
      <header className="card center stack" style={{ alignItems: "center", paddingTop: 28 }}>
        <div style={{ position: "relative" }}>
          <Avatar name={user.firstName} src={user.avatar} size={88} />
          <button className="icon-btn" onClick={() => fileRef.current?.click()} aria-label="Changer de photo"
            style={{ position: "absolute", right: -6, bottom: -6, width: 36, height: 36, background: "var(--surface)", boxShadow: "var(--shadow)", borderRadius: "50%" }}>
            <Camera size={17} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => void onAvatar(e.target.files?.[0])} />
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 650 }}>{user.firstName}</h1>
          <p className="small muted">{mode === "demo" ? "Profil de démonstration" : mode === "guest" ? "Profil local, sans compte" : "Profil personnel, sauvegardé automatiquement"}</p>
        </div>
        <span className="pill primary">Niveau {level.level} · {level.name}</span>
        <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}><Pencil size={15} />Modifier le profil</button>
      </header>

      <div className="grid-3">
        <div className="stat-tile" style={{ gap: 4 }}><div className="stat"><span className="v row" style={{ gap: 4 }}>{summary.streak}🔥</span><span className="l">Série</span></div></div>
        <div className="stat-tile" style={{ gap: 4 }}><div className="stat"><span className="v">{summary.sessionCount}</span><span className="l">Sessions</span></div></div>
        <div className="stat-tile" style={{ gap: 4 }}><div className="stat"><span className="v">{spokenTime(summary.totalSec)}</span><span className="l">Parlé</span></div></div>
      </div>

      {mode === "demo" && (
        <div className="card" style={{ background: "var(--primary-soft)", boxShadow: "none" }}>
          <div className="row" style={{ alignItems: "flex-start" }}>
            <CloudUpload size={22} color="var(--primary-ink)" style={{ flexShrink: 0 }} />
            <div className="stack" style={{ gap: 10 }}>
              <strong>Tu explores la démo</strong>
              <span className="small muted">Crée ton profil pour t'entraîner avec tes propres sessions.</span>
              <div>
                <button className="btn btn-primary btn-sm" onClick={async () => { await logout(); nav("/bienvenue"); }}>Créer mon profil</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {mode === "guest" && (
        <div className="card" style={{ background: "var(--primary-soft)", boxShadow: "none" }}>
          <div className="row" style={{ alignItems: "flex-start" }}>
            <CloudUpload size={22} color="var(--primary-ink)" style={{ flexShrink: 0 }} />
            <div className="stack" style={{ gap: 10 }}>
              <strong>Serveur injoignable</strong>
              <span className="small muted">Le serveur était injoignable au démarrage : tes données restent pour l'instant sur cet appareil uniquement. Recharge la page une fois le serveur de nouveau accessible — elles seront alors sauvegardées automatiquement.</span>
            </div>
          </div>
        </div>
      )}

      <section className="stack">
        <h2 className="section-title">Objectifs & niveau</h2>
        <div className="list">
          <button className="list-item" onClick={() => setEditing(true)}>
            <span className="li-icon"><Target size={18} /></span>
            <span className="grow"><span className="li-title">{user.goals.length} objectif{user.goals.length > 1 ? "s" : ""}</span><br /><span className="li-sub">{user.goals.map((g) => GOAL_LABELS[g]).join(", ")}</span></span>
            <ChevronRight size={18} className="li-end" />
          </button>
          <Link to="/diagnostic" className="list-item">
            <span className="li-icon"><ClipboardCheck size={18} /></span>
            <span className="grow"><span className="li-title">Diagnostic initial</span><br /><span className="li-sub">{user.diagnosticDone ? "Terminé — le refaire" : "Pas encore fait"}</span></span>
            <ChevronRight size={18} className="li-end" />
          </Link>
          <Link to="/programme" className="list-item">
            <span className="li-icon"><Clock size={18} /></span>
            <span className="grow"><span className="li-title">Programme</span><br /><span className="li-sub">{account.program ? account.program.title : "Aucun programme actif"}</span></span>
            <ChevronRight size={18} className="li-end" />
          </Link>
          <Link to="/badges" className="list-item">
            <span className="li-icon"><Trophy size={18} /></span>
            <span className="grow"><span className="li-title">Badges</span><br /><span className="li-sub">{summary.badges.length} débloqué{summary.badges.length > 1 ? "s" : ""} · {nf.format(summary.xp)} XP</span></span>
            <ChevronRight size={18} className="li-end" />
          </Link>
        </div>
      </section>

      <section className="stack">
        <h2 className="section-title">Paramètres</h2>
        <div className="list">
          <div className="list-item">
            <span className="li-icon"><Bell size={18} /></span>
            <span className="grow"><span className="li-title">Rappel quotidien</span><br /><span className="li-sub">Si ta session du jour n'est pas faite à {user.settings.reminderHour} h</span></span>
            <Switch checked={user.settings.notifications} onChange={(v) => void toggleNotifications(v)} label="Rappel quotidien" />
          </div>
          {user.settings.notifications && (
            <div className="list-item">
              <span className="li-icon" />
              <label htmlFor="hour" className="grow li-title">Heure du rappel</label>
              <select id="hour" className="select" style={{ width: 110, minHeight: 40 }} value={user.settings.reminderHour} onChange={(e) => void setSetting("reminderHour", Number(e.target.value))}>
                {Array.from({ length: 16 }, (_, i) => i + 7).map((h) => <option key={h} value={h}>{h} h</option>)}
              </select>
            </div>
          )}
          <div className="list-item">
            <span className="li-icon"><Clock size={18} /></span>
            <label htmlFor="dur" className="grow"><span className="li-title">Durée des improvisations</span><br /><span className="li-sub">Temps de parole par défaut</span></label>
            <select id="dur" className="select" style={{ width: 110, minHeight: 40 }} value={user.settings.sessionSeconds} onChange={(e) => void setSetting("sessionSeconds", Number(e.target.value))}>
              {[30, 45, 60, 90, 120, 180].map((s) => <option key={s} value={s}>{s < 60 ? `${s} s` : `${s / 60} min${s % 60 ? " 30" : ""}`}</option>)}
            </select>
          </div>
          <div className="list-item">
            <span className="li-icon"><Globe size={18} /></span>
            <label htmlFor="lang" className="grow"><span className="li-title">Langue de la voix</span><br /><span className="li-sub">Pour la reconnaissance vocale</span></label>
            <select id="lang" className="select" style={{ width: 170, minHeight: 40 }} value={user.settings.language} onChange={(e) => void setSetting("language", e.target.value as UserSettings["language"])}>
              {LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
          </div>
          {localWhisperSupported() && (
            <div className="list-item">
              <span className="li-icon"><Mic size={18} /></span>
              <span className="grow"><span className="li-title">Transcription locale (gratuite)</span><br /><span className="li-sub">Un modèle Whisper tourne dans ton navigateur — garde les « euh », rien n'est envoyé à un serveur. Télécharge ~40 Mo la première fois.</span></span>
              <Switch checked={user.settings.localTranscription} onChange={(v) => void setSetting("localTranscription", v)} label="Transcription locale" />
            </div>
          )}
          <div className="list-item" style={{ flexWrap: "wrap" }}>
            <span className="li-icon"><Moon size={18} /></span>
            <span className="grow li-title">Thème</span>
            <div className="segmented" role="group" aria-label="Thème" style={{ minWidth: 230 }}>
              {(["system", "light", "dark"] as const).map((t) => (
                <button key={t} aria-pressed={user.settings.theme === t} onClick={() => void setSetting("theme", t)}>
                  {t === "system" ? "Auto" : t === "light" ? "Clair" : "Sombre"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="stack">
        <h2 className="section-title">Confidentialité</h2>
        <div className="list">
          <div className="list-item">
            <span className="li-icon"><ShieldCheck size={18} /></span>
            <span className="grow"><span className="li-title">Conserver mes enregistrements</span><br /><span className="li-sub">Pour les réécouter. Sinon, seule la transcription est gardée.</span></span>
            <Switch checked={user.settings.saveAudio} onChange={(v) => void setSetting("saveAudio", v)} label="Conserver mes enregistrements" />
          </div>
          <button className="list-item" onClick={() => void exportData()}>
            <span className="li-icon"><Download size={18} /></span>
            <span className="grow li-title">Exporter mes données</span>
            <ChevronRight size={18} className="li-end" />
          </button>
          <button className="list-item" onClick={() => importRef.current?.click()}>
            <span className="li-icon"><Upload size={18} /></span>
            <span className="grow"><span className="li-title">Importer mes données</span><br /><span className="li-sub">Depuis un fichier exporté précédemment — s'ajoute à ce compte.</span></span>
            <ChevronRight size={18} className="li-end" />
          </button>
          <input ref={importRef} type="file" accept="application/json" hidden onChange={(e) => void importData(e.target.files?.[0])} />
          <button className="list-item" onClick={async () => {
            if (!window.confirm(mode === "account" ? "Supprimer définitivement ton compte, tes sessions et tes enregistrements ?" : "Effacer toutes les données de cet appareil ?")) return;
            try { await deleteAccount(); nav("/bienvenue", { replace: true }); } catch (e) { toast((e as Error).message, "error"); }
          }}>
            <span className="li-icon tone-danger"><Trash2 size={18} /></span>
            <span className="grow li-title" style={{ color: "var(--danger)" }}>{mode === "account" ? "Supprimer mon compte" : "Effacer mes données"}</span>
          </button>
        </div>
      </section>

      {mode !== "account" && (
        <button className="btn btn-outline btn-block" onClick={async () => { await logout(); nav("/bienvenue", { replace: true }); }}>
          <LogOut size={17} />{mode === "demo" ? "Quitter la démo" : "Changer de profil"}
        </button>
      )}
      <p className="tiny faint center">Éloquence · gratuit, sans limite, pour ton usage personnel.</p>

      {editing && <EditProfile onClose={() => setEditing(false)} />}
    </div>
  );
}

function EditProfile({ onClose }: { onClose: () => void }) {
  const { account, updateMe, toast } = useAccount();
  const [firstName, setFirstName] = useState(account.user.firstName);
  const [goals, setGoals] = useState<Goal[]>(account.user.goals);
  const [level, setLevel] = useState<Level>(account.user.level);
  const [busy, setBusy] = useState(false);
  const toggle = (g: Goal) => setGoals((gs) => (gs.includes(g) ? gs.filter((x) => x !== g) : [...gs, g]));
  const submit = async () => {
    if (goals.length === 0) { toast("Choisis au moins un objectif.", "error"); return; }
    setBusy(true);
    try {
      await updateMe({ firstName: firstName.trim(), goals, level });
      toast("Profil mis à jour.", "success");
      onClose();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet onClose={onClose} label="Modifier le profil">
      <form className="stack-lg" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
        <h2 style={{ fontSize: 22 }}>Modifier le profil</h2>
        <div className="field"><label htmlFor="efn">Prénom</label>
          <input id="efn" className="input" value={firstName} maxLength={40} onChange={(e) => setFirstName(e.target.value)} /></div>
        <div className="field"><label htmlFor="elevel">Niveau à l'oral</label>
          <select id="elevel" className="select" value={level} onChange={(e) => setLevel(e.target.value as Level)}>
            {(Object.keys(LEVEL_LABELS) as Level[]).map((l) => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
          </select></div>
        <div className="stack" style={{ gap: 10 }}>
          <span className="strong small">Objectifs ({goals.length})</span>
          {GOAL_GROUPS.map((grp) => (
            <div key={grp.title} className="stack" style={{ gap: 6 }}>
              <span className="tiny faint strong">{grp.title.toUpperCase()}</span>
              <div className="chips" style={{ margin: 0, padding: 0, flexWrap: "wrap" }}>
                {grp.goals.map((g) => <button key={g} type="button" className="chip" aria-pressed={goals.includes(g)} onClick={() => toggle(g)}>{GOAL_LABELS[g]}</button>)}
              </div>
            </div>
          ))}
        </div>
        <button className="btn btn-primary btn-lg btn-block" disabled={busy || !firstName.trim()}>{busy && <span className="spinner" />}Enregistrer</button>
      </form>
    </Sheet>
  );
}
