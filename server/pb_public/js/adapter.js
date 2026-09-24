/* Farm Log ⇄ PocketBase connector.
 *
 * The app talks to a small document-store interface (collection().onSnapshot / add,
 * doc().set / update / delete) through window.claude.use("db") — the same interface
 * the beta used. This file provides it on top of the PocketBase server on the Mac mini:
 *
 *   - sign-in (email + password, remembered on the device)
 *   - live updates: changes from teammates appear without reloading
 *   - works offline: data is cached on the phone, and changes made without signal
 *     are queued and sent when the connection comes back
 */
(() => {
  const pb = new PocketBase(location.origin);
  pb.autoCancellation(false);
  window.pb = pb;

  const $ = (s) => document.querySelector(s);
  const signedIn = () => pb.authStore.isValid && pb.authStore.record;
  const userKey = () => pb.authStore.record?.id || "anon";

  /* ── Sign-in screen ─────────────────────────────────────────────── */
  function showLogin(msg) {
    document.body.classList.add("signed-out");
    $("#login").hidden = false;
    if (msg) $("#loginMsg").textContent = msg;
    setTimeout(() => $("#l-email")?.focus(), 50);
  }
  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("#loginForm button");
    btn.disabled = true;
    $("#loginMsg").textContent = "Signing in…";
    try {
      await pb.collection("users").authWithPassword($("#l-email").value.trim(), $("#l-pass").value);
      location.reload();
    } catch (err) {
      $("#loginMsg").textContent = err?.status === 0
        ? "Can't reach the farm server. Check your connection and try again."
        : "That email and password didn't match. Team logins are made in the admin dashboard; the admin login itself only works there (at /_/). Ask the farm owner if you need a login or a password reset.";
      btn.disabled = false;
    }
  });

  /* ── Account menu (tap your avatar) ─────────────────────────────── */
  $("#avatar").addEventListener("click", (e) => {
    e.stopPropagation();
    const m = $("#acctMenu");
    m.hidden = !m.hidden;
  });
  document.addEventListener("click", (e) => { if (!e.target.closest("#acctMenu")) $("#acctMenu").hidden = true; });
  $("#signOut").addEventListener("click", () => {
    try { Object.keys(localStorage).filter((k) => k.startsWith("farmlog:")).forEach((k) => localStorage.removeItem(k)); } catch (_) {}
    pb.authStore.clear();
    location.reload();
  });

  if (!signedIn()) {
    showLogin();
    window.claude = { use: async () => null };
    return;
  }
  document.body.classList.remove("signed-out");
  const u = pb.authStore.record;
  $("#acctName").textContent = u.name || u.email;
  $("#acctEmail").textContent = u.email || "";

  // Confirm the saved sign-in is still good (skipped when offline).
  if (navigator.onLine) {
    pb.collection("users").authRefresh().catch((err) => {
      if (err?.status === 401 || err?.status === 403 || err?.status === 404) { pb.authStore.clear(); location.reload(); }
    });
  }

  /* ── Local cache (so the app opens instantly and works offline) ─── */
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(`farmlog:${userKey()}:${k}`)); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(`farmlog:${userKey()}:${k}`, JSON.stringify(v)); } catch (_) {} },
  };

  const cols = {};
  function col(name) {
    return cols[name] ||= { map: new Map(store.get("c:" + name) || []), listeners: new Set(), docListeners: new Map(), started: false, loaded: false };
  }
  const snap = (id, d) => ({ id, exists: d !== undefined, data: () => d, metadata: { fromCache: false, hasPendingWrites: false } });
  function emit(name) {
    const C = col(name);
    store.set("c:" + name, [...C.map]);
    const docs = [...C.map].map(([id, d]) => snap(id, d));
    const qs = { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: { fromCache: !C.loaded, hasPendingWrites: false } };
    C.listeners.forEach((f) => { try { f(qs); } catch (e) { console.error(e); } });
    C.docListeners.forEach((set, id) => set.forEach((f) => { try { f(snap(id, C.map.get(id))); } catch (e) { console.error(e); } }));
  }
  async function load(name) {
    const C = col(name);
    try {
      const recs = await pb.collection(name).getFullList({ batch: 500, fields: "id,data" });
      C.map = new Map(recs.map((r) => [r.id, r.data || {}]));
      // keep changes that are still waiting to be sent
      queue().filter((op) => op.c === name).forEach((op) => applyLocal(op));
      C.loaded = true;
    } catch (err) {
      console.warn("load", name, err);
    }
    emit(name);
  }
  function start(name) {
    const C = col(name);
    if (C.started) return;
    C.started = true;
    if (C.map.size) setTimeout(() => emit(name), 0);
    load(name);
    pb.collection(name).subscribe("*", (ev) => {
      if (ev.action === "delete") C.map.delete(ev.record.id);
      else C.map.set(ev.record.id, ev.record.data || {});
      emit(name);
    }).catch((err) => console.warn("subscribe", name, err));
  }
  // Catch up after the phone wakes or reconnects (realtime can miss changes while asleep).
  let catchUp = 0;
  const reloadAll = () => { clearTimeout(catchUp); catchUp = setTimeout(() => Object.keys(cols).forEach((n) => cols[n].started && load(n)), 400); };
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") { flush(); reloadAll(); } });
  addEventListener("online", () => { flush(); reloadAll(); });

  /* ── Writes, with an offline queue ──────────────────────────────── */
  const queue = () => store.get("queue") || [];
  const setQueue = (q) => { store.set("queue", q); syncState(); };
  function syncState() {
    const n = queue().length;
    window.dispatchEvent(new CustomEvent("farm-sync", { detail: { pending: n, online: navigator.onLine } }));
  }
  function applyLocal(op) {
    const C = col(op.c);
    if (op.t === "delete") C.map.delete(op.id);
    else if (op.t === "update") C.map.set(op.id, { ...(C.map.get(op.id) || {}), ...op.data });
    else C.map.set(op.id, op.data);
  }
  async function send(op) {
    const c = pb.collection(op.c);
    if (op.t === "create") {
      try { return await c.create({ id: op.id, data: op.data }); }
      catch (err) { if (err?.status === 400 && err?.response?.data?.id) return c.update(op.id, { data: op.data }); throw err; }
    }
    if (op.t === "set") {
      try { return await c.update(op.id, { data: op.data }); }
      catch (err) { if (err?.status === 404) return c.create({ id: op.id, data: op.data }); throw err; }
    }
    if (op.t === "update") {
      const cur = col(op.c).map.get(op.id) || (await c.getOne(op.id)).data || {};
      return c.update(op.id, { data: { ...cur, ...op.data } });
    }
    if (op.t === "delete") {
      try { return await c.delete(op.id); } catch (err) { if (err?.status !== 404) throw err; }
    }
  }
  const isOffline = (err) => err?.status === 0 || !navigator.onLine;
  let flushing = false;
  async function flush() {
    if (flushing || !navigator.onLine) return;
    flushing = true;
    try {
      let q = queue();
      while (q.length) {
        try { await send(q[0]); }
        catch (err) {
          if (isOffline(err)) break;
          console.warn("Dropped a change the server refused:", q[0], err);
        }
        q = queue().slice(1);
        setQueue(q);
      }
    } finally { flushing = false; syncState(); }
  }
  async function write(op) {
    applyLocal(op);
    emit(op.c);
    if (queue().length) { setQueue([...queue(), op]); flush(); return; } // keep order behind earlier offline changes
    try {
      await send(op);
    } catch (err) {
      if (isOffline(err)) {
        setQueue([...queue(), op]);
        setTimeout(() => window.dispatchEvent(new CustomEvent("farm-queued")), 60);
        return;
      }
      load(op.c); // undo the optimistic change
      throw { code: err?.status === 403 || err?.status === 400 ? "invalid_argument" : "unavailable", message: err?.message || "Save failed" };
    }
  }
  const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(15)), (b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");

  function docRef(c, id) {
    return {
      id, path: `${c}/${id}`,
      get: async () => { start(c); return snap(id, col(c).map.get(id)); },
      set: (data) => write({ t: "set", c, id, data: JSON.parse(JSON.stringify(data)) }),
      update: (data) => write({ t: "update", c, id, data: JSON.parse(JSON.stringify(data)) }),
      delete: () => write({ t: "delete", c, id }),
      onSnapshot(next) {
        const C = col(c);
        if (!C.docListeners.has(id)) C.docListeners.set(id, new Set());
        C.docListeners.get(id).add(next);
        start(c);
        if (C.loaded || C.map.has(id)) setTimeout(() => next(snap(id, C.map.get(id))), 0);
        return () => C.docListeners.get(id)?.delete(next);
      },
    };
  }
  const db = {
    collection: (name) => ({
      path: name,
      doc: (id) => docRef(name, id || newId()),
      add: async (data) => { const id = newId(); await write({ t: "create", c: name, id, data: JSON.parse(JSON.stringify(data)) }); return docRef(name, id); },
      onSnapshot(next) { const C = col(name); C.listeners.add(next); start(name); return () => C.listeners.delete(next); },
    }),
    doc: (path) => { const [c, id] = path.split("/"); return docRef(c, id); },
  };

  /* ── People ─────────────────────────────────────────────────────── */
  const initials = (s) => (s || "?").split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  const avatarFor = (rec) => rec?.avatar ? pb.files.getURL(rec, rec.avatar, { thumb: "64x64" })
    : "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="16" fill="#8ec444"/><text x="16" y="21" font-family="sans-serif" font-size="13" font-weight="600" text-anchor="middle" fill="#1d2a0e">${initials(rec?.name || rec?.email)}</text></svg>`);
  let people = null;
  async function loadPeople() {
    if (people) return people;
    try { people = new Map((await pb.collection("users").getFullList({ fields: "id,name,email,avatar,collectionId,collectionName" })).map((r) => [r.id, r])); store.set("people", [...people]); }
    catch (_) { people = new Map(store.get("people") || []); }
    return people;
  }
  const user = {
    me: async () => ({ id: u.id, name: u.name || u.email, email: u.email, avatarUrl: avatarFor(u), color: "#8ec444", isOwner: false, canEdit: true }),
    id: async () => u.id,
    isOwner: async () => false,
    canEdit: async () => true,
    can: async () => true,
    profiles: async (ids) => {
      const ps = await loadPeople();
      return Object.fromEntries([].concat(ids).map((id) => {
        const r = ps.get(id);
        return [id, { id, name: r ? (r.name || r.email) : "", isMe: id === u.id, avatarUrl: avatarFor(r), color: "#8ec444", email: null, guest: false }];
      }));
    },
  };

  window.claude = { use: async (name) => (name === "db" ? db : name === "user" ? user : null) };
  flush();
  syncState();
})();
