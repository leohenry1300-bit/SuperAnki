import { useEffect } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { dayKey } from "@eloquence/core";
import { StoreProvider, useStore } from "./lib/store";
import { AppShell } from "./components/shell";
import { FullScreenLoader, Toasts, Wordmark } from "./components/ui";
import { Onboarding } from "./pages/Onboarding";
import { Login } from "./pages/Login";
import { Home } from "./pages/Home";
import { Train } from "./pages/Train";
import { Games } from "./pages/Games";
import { Topics } from "./pages/Topics";
import { Simulations } from "./pages/Simulations";
import { Library, LibraryCourse, LessonDetail } from "./pages/Library";
import { Diagnostic, DiagnosticReportPage } from "./pages/Diagnostic";
import { Exercise } from "./pages/Exercise";
import { SessionResult } from "./pages/SessionResult";
import { Progress } from "./pages/Progress";
import { Defis } from "./pages/Defis";
import { Badges, History } from "./pages/History";
import { Coach } from "./pages/Coach";
import { Program } from "./pages/Program";
import { Profile } from "./pages/Profile";

function RequireProfile() {
  const { mode, status } = useStore();
  const location = useLocation();
  if (status !== "ready") return null;
  if (mode === "none") return <Navigate to="/bienvenue" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** Skip onboarding if a profile (account, guest or demo) already exists. */
function OnboardingRoute() {
  const { mode } = useStore();
  return mode === "none" ? <Onboarding /> : <Navigate to="/" replace />;
}

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

/** In-app daily reminder while the app is open (browser notifications). */
function useReminder() {
  const { account } = useStore();
  useEffect(() => {
    if (!account?.user.settings.notifications || !("Notification" in window)) return;
    const check = () => {
      if (Notification.permission !== "granted") return;
      const now = new Date();
      const key = `eloquence:reminded:${dayKey(now)}`;
      const trained = account.sessions.some((s) => dayKey(s.createdAt) === dayKey(now));
      if (trained || now.getHours() < account.user.settings.reminderHour) return;
      try {
        if (localStorage.getItem(key)) return;
        localStorage.setItem(key, "1");
      } catch { return; }
      new Notification("Éloquence", { body: "Une minute pour ta session du jour ? Ta série t'attend.", icon: "/icon.svg" });
    };
    check();
    const t = window.setInterval(check, 60_000);
    return () => window.clearInterval(t);
  }, [account]);
}

function Root() {
  const { status, bootError, retryBoot } = useStore();
  useReminder();
  if (status === "booting") return <FullScreenLoader />;
  if (status === "error") {
    return (
      <div className="onb" style={{ justifyContent: "center", textAlign: "center", gap: 16 }}>
        <Wordmark />
        <h1 className="page-title">Impossible de charger ton compte</h1>
        <p className="muted">{bootError}</p>
        <button className="btn btn-primary" onClick={retryBoot}><RefreshCw size={16} />Réessayer</button>
      </div>
    );
  }
  return (
    <>
      <a href="#main" className="sr-only">Aller au contenu</a>
      <ScrollTop />
      <Routes>
        <Route path="/bienvenue" element={<OnboardingRoute />} />
        <Route path="/connexion" element={<Login />} />
        <Route element={<RequireProfile />}>
          <Route element={<AppShell />}>
            <Route index element={<Home />} />
            <Route path="/entrainement" element={<Train />} />
            <Route path="/progression" element={<Progress />} />
            <Route path="/coach" element={<Coach />} />
            <Route path="/profil" element={<Profile />} />
          </Route>
          <Route path="/jeux" element={<Games />} />
          <Route path="/sujets" element={<Topics />} />
          <Route path="/simulations" element={<Simulations />} />
          <Route path="/bibliotheque" element={<Library />} />
          <Route path="/bibliotheque/lecon/:lessonId" element={<LessonDetail />} />
          <Route path="/bibliotheque/:courseId" element={<LibraryCourse />} />
          <Route path="/diagnostic" element={<Diagnostic />} />
          <Route path="/diagnostic/bilan" element={<DiagnosticReportPage />} />
          <Route path="/exercice/:id" element={<Exercise />} />
          <Route path="/session/:id" element={<SessionResult />} />
          <Route path="/historique" element={<History />} />
          <Route path="/badges" element={<Badges />} />
          <Route path="/programme" element={<Program />} />
          <Route path="/defis" element={<Defis />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toasts />
    </>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Root />
      </BrowserRouter>
    </StoreProvider>
  );
}
