const app = new SuperAnki();
window.app = app;
app.init().catch(err => {
    console.error(err);
    const boot = document.getElementById('boot');
    if (boot) boot.innerHTML = `Oups, le chargement a échoué : ${esc(err.message)}. <br><button class="btn btn-primary" style="margin-top:12px" onclick="location.reload()">Recharger</button>`;
});

/* Self-update: a few seconds after start the app reads the tiny live version.json; if a newer build exists it clears its cache and reloads once,
   so the phone never stays on an old copy. */
setTimeout(async () => {
    try {
        if (!/^https?:/.test(location.protocol)) return;
        const meta = document.querySelector('meta[name=app-build]'), cur = meta ? Number(meta.content) : 0;
        const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' }); if (!r.ok) return;
        const live = Number((await r.json()).build) || 0;
        if (!cur || !live || live <= cur) return;
        if (sessionStorage.getItem('lh_upd') === String(live)) return;   // already tried for this build: never loop
        sessionStorage.setItem('lh_upd', String(live));
        if (window.caches) { const ks = await caches.keys(); await Promise.all(ks.filter(k => k.startsWith('superanki-')).map(k => caches.delete(k))); }
        const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration(); if (reg) await reg.update().catch(() => {});
        app.toast('Nouvelle version : mise à jour…', 'success');
        setTimeout(() => location.reload(), 700);
    } catch { /* offline: nothing to do */ }
}, 4000);
