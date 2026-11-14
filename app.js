"use strict";

const CFG = window.ESTANTE_CONFIG || {};

// ---------- sections ----------
const ICONS = {
  estante: '<rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><path d="M7 5v14M17 5v14M3 9.5h4M3 14.5h4M17 9.5h4M17 14.5h4" stroke="currentColor" stroke-width="1.6"/>',
  descobrir: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/><path d="M15.5 8.5l-2 5-5 2 2-5z" fill="currentColor"/>',
  inicio: '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/>',
};
const ST_WATCH = { fila: "Quero ver", andamento: "Assistindo", concluido: "Visto" };
// The database keeps section = "estante" for every row; only movies and series are shown.
const SECTIONS = {
  estante: {
    label: "Filmes e séries", item: "título", itemArt: "o primeiro título",
    subs: {
      filme: { label: "Filmes", one: "Filme", src: "tmdb-movie", creator: "Direção", status: { fila: "Quero ver", concluido: "Visto" } },
      serie: { label: "Séries", one: "Série", src: "tmdb-tv", creator: "Criação", status: { ...ST_WATCH, concluido: "Vista" } },
    },
    status: ST_WATCH,
    fields: (sub) => [
      { col: "creator", label: SECTIONS.estante.subs[sub].creator },
      { col: "year", label: "Ano", year: true },
      { col: "genre", label: "Gênero", full: true },
      { key: "imdb", label: "Nota IMDb", hint: "Ex.: 7.8", num: true },
      { key: "rt", label: "Rotten Tomatoes", hint: "Ex.: 93%" },
    ],
    titleLabel: "Título", synLabel: "Sinopse", notesLabel: "Anotações",
    notesHint: "Onde assistir, quem indicou, por que quero ver…",
  },
};
const SECTION_KEYS = Object.keys(SECTIONS);
const GENERIC_STATUS = { fila: "Na fila", andamento: "Em andamento", concluido: "Concluídos" };
const statusLabels = (section, sub) => (sub && SECTIONS[section].subs[sub]?.status) || SECTIONS[section].status;
function sectionOfType(type) { return SECTION_KEYS.find((s) => SECTIONS[s].subs[type]) || "estante"; }
const isShown = (it) => Boolean(SECTIONS[it.section]?.subs[it.type]);
// details kept on save even though the form has no field for them
const HIDDEN_DETAILS = ["imdbid", "tmdbid"];
function score(v) { const n = parseFloat(String(v || "").replace(",", ".")); return isNaN(n) ? null : n; }
function fmtImdb(v) { const n = score(v); return n == null ? "" : n.toFixed(1).replace(".", ","); }
function fmtRt(v) { const n = score(v); return n == null ? "" : Math.round(n) + "%"; }

const $ = (id) => document.getElementById(id);
const state = {
  items: [], section: "inicio", sub: "", q: "", status: "", sort: "recent", rating: 0,
  editing: null, dlgSection: "estante", user: null, loaded: false, signUp: false,
};
let sb = null;

// ---------- helpers ----------
function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
function svg(name, size) {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("width", size || 18); s.setAttribute("height", size || 18); s.setAttribute("aria-hidden", "true");
  s.innerHTML = ICONS[name]; // static markup defined above
  return s;
}
function norm(s) { return (s || "").toString().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
function show(id, msg, ok) { const n = $(id); n.textContent = msg || ""; n.hidden = !msg; if (id === "notice") n.className = ok ? "ok" : "notice"; }
function stars(n) {
  const s = el("span", "stars"); s.setAttribute("aria-label", n + " de 5");
  for (let i = 1; i <= 5; i++) s.appendChild(el("span", i <= n ? "" : "off", "★"));
  return s;
}
function plainText(html) { return new DOMParser().parseFromString(html || "", "text/html").body.textContent.trim(); }
function safeHttps(url) {
  if (!url) return null;
  const u = String(url).trim().replace(/^http:\/\//, "https://");
  try { return new URL(u).protocol === "https:" ? u : null; } catch (e) { return null; }
}
function isPlaceholder(v) { return !v || /^COLE_AQUI/.test(v); }
function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }

// ---------- generated cover ----------
const PALETTE = [["#1f3a5f", "#f2d492"], ["#5b1e2d", "#f6d7c3"], ["#173f35", "#e9e4c9"], ["#2d2a4a", "#f0b87a"], ["#3d2c1e", "#e8d3a9"], ["#0f4c5c", "#ffd6a5"], ["#4a1942", "#f9c6c9"], ["#22313f", "#9ad1d4"]];
function colorsFor(title) { let h = 0; for (const ch of title || "") h = (h * 31 + ch.charCodeAt(0)) >>> 0; return PALETTE[h % PALETTE.length]; }
function coverEl(it, big) {
  const c = el("div", "cover" + (big ? " big" : ""));
  c.setAttribute("aria-hidden", "true");
  const url = safeHttps(it.coverUrl);
  if (url) {
    const img = document.createElement("img");
    img.alt = ""; img.loading = "lazy"; img.referrerPolicy = "no-referrer"; img.src = url;
    img.addEventListener("error", () => c.replaceWith(coverEl({ ...it, coverUrl: null }, big)));
    c.appendChild(img);
    return c;
  }
  const [bg, fg] = colorsFor(it.title);
  c.classList.add("gen"); c.style.setProperty("--cbg", bg); c.style.setProperty("--cfg", fg);
  c.appendChild(el("span", "ct", it.title || "Sem nome"));
  c.appendChild(el("span", "cc", it.creator || SECTIONS[it.section]?.subs[it.type]?.one || ""));
  return c;
}

// ---------- rows <-> items ----------
function fromRow(r) {
  const section = SECTIONS[r.section] ? r.section : sectionOfType(r.type);
  const labels = SECTIONS[section].subs[r.type] ? statusLabels(section, r.type) : null;
  return {
    id: r.id, section, type: r.type, title: r.title, creator: r.creator, year: r.year,
    status: !labels || labels[r.status] ? r.status : "fila", rating: r.rating, notes: r.notes, synopsis: r.synopsis, genre: r.genre,
    coverUrl: r.cover_url, details: r.details && typeof r.details === "object" ? r.details : {},
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}
function cleanDetails(d) {
  const out = {};
  Object.entries(d && typeof d === "object" ? d : {}).forEach(([k, v]) => {
    if (!/^[a-z]{1,20}$/.test(k)) return;
    const s = String(v ?? "").trim().slice(0, 300);
    if (s) out[k] = s;
  });
  return out;
}
function toRow(it) {
  const section = SECTIONS[it.section] ? it.section : sectionOfType(it.type);
  const subs = SECTIONS[section].subs;
  const type = subs[it.type] ? it.type : Object.keys(subs)[0];
  const statuses = statusLabels(section, type);
  const year = String(it.year || "").trim();
  return {
    section, type,
    title: String(it.title || "").trim().slice(0, 200),
    creator: String(it.creator || "").trim().slice(0, 200),
    year: /^\d{4}$/.test(year) ? year : "",
    status: statuses[it.status] ? it.status : "fila",
    rating: Math.max(0, Math.min(5, Math.round(Number(it.rating) || 0))),
    notes: String(it.notes || "").trim().slice(0, 2000),
    synopsis: String(it.synopsis || "").trim().slice(0, 3000),
    genre: String(it.genre || "").trim().slice(0, 80),
    cover_url: safeHttps(it.coverUrl ?? it.cover_url),
    details: cleanDetails(it.details),
  };
}

// ---------- navigation ----------
function parseHash() {
  const [s, sub] = decodeURIComponent(location.hash.replace(/^#/, "")).split("/");
  if (SECTIONS[s]) return { section: s, sub: SECTIONS[s].subs[sub] ? sub : "" };
  if (s === "descobrir") return { section: s, sub: "" };
  return { section: "inicio", sub: "" };
}
function go(section, sub) {
  const h = section === "inicio" ? "#inicio" : "#" + section + (sub ? "/" + sub : "");
  if (location.hash !== h) location.hash = h; else applyRoute();
}
function applyRoute() {
  const r = parseHash();
  if (r.section !== state.section) { state.q = ""; state.status = ""; $("q").value = ""; }
  state.section = r.section; state.sub = r.sub;
  closeMenu();
  render();
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", applyRoute);

function openMenu() { $("sidebar").classList.add("open"); $("backdrop").hidden = false; $("menuBtn").setAttribute("aria-expanded", "true"); }
function closeMenu() { $("sidebar").classList.remove("open"); $("backdrop").hidden = true; $("menuBtn").setAttribute("aria-expanded", "false"); }
$("menuBtn").addEventListener("click", () => ($("sidebar").classList.contains("open") ? closeMenu() : openMenu()));
$("backdrop").addEventListener("click", closeMenu);
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && $("sidebar").classList.contains("open")) closeMenu(); });

// ---------- views ----------
function showView(name) {
  $("setupView").hidden = name !== "setup";
  $("authView").hidden = name !== "auth";
  $("appView").hidden = name !== "app";
}
function countBy(list, key) { const c = {}; list.forEach((i) => { c[i[key]] = (c[i[key]] || 0) + 1; }); return c; }

function renderNav() {
  const nav = $("nav"); nav.replaceChildren();
  const bySec = countBy(state.items, "section");
  const home = el("a", "nav-link"); home.href = "#inicio";
  home.append(svg("inicio"), "Início");
  if (state.section === "inicio") home.setAttribute("aria-current", "page");
  nav.appendChild(home);
  const dl = el("a", "nav-link"); dl.href = "#descobrir";
  dl.append(svg("descobrir"), "Descobrir");
  if (state.section === "descobrir") dl.setAttribute("aria-current", "page");
  nav.appendChild(dl);
  SECTION_KEYS.forEach((s) => {
    const sec = SECTIONS[s];
    const a = el("a", "nav-link sec-" + s); a.href = "#" + s;
    a.append(svg(s), sec.label);
    a.appendChild(el("span", "n", String(bySec[s] || 0)));
    if (state.section === s && !state.sub) a.setAttribute("aria-current", "page");
    nav.appendChild(a);
    const subs = el("div", "nav-sub sec-" + s);
    const byType = countBy(state.items.filter((i) => i.section === s), "type");
    Object.entries(sec.subs).forEach(([k, v]) => {
      const l = el("a", "nav-link"); l.href = "#" + s + "/" + k;
      l.append(v.label); l.appendChild(el("span", "n", String(byType[k] || 0)));
      if (state.section === s && state.sub === k) l.setAttribute("aria-current", "page");
      subs.appendChild(l);
    });
    nav.appendChild(subs);
  });
}

function statusLine(list) {
  const c = countBy(list, "status");
  const words = { fila: ["na fila", "na fila"], andamento: ["em andamento", "em andamento"], concluido: ["concluído", "concluídos"] };
  return Object.keys(words).filter((k) => c[k]).map((k) => c[k] + " " + words[k][c[k] === 1 ? 0 : 1]).join(" · ");
}

function card(it) {
  const sec = SECTIONS[it.section];
  const card = el("article", "card sec-" + it.section);
  card.tabIndex = 0; card.setAttribute("role", "button"); card.setAttribute("aria-label", "Editar " + it.title);
  card.style.cursor = "pointer";
  card.addEventListener("click", () => openDialog(it));
  card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDialog(it); } });
  card.appendChild(coverEl(it));
  const body = el("div", "body");
  const top = el("div", "card-top");
  top.appendChild(el("span", "kind", sec.subs[it.type]?.one || sec.label));
  top.appendChild(el("span", "status s-" + it.status, statusLabels(it.section, it.type)[it.status] || ""));
  body.appendChild(top);
  body.appendChild(el("h3", null, it.title));
  const meta = [it.creator, it.year].filter(Boolean).join(", ");
  if (meta) body.appendChild(el("div", "meta", meta));
  if (it.genre) body.appendChild(el("div", "genre", it.genre));
  const d = it.details || {};
  const sc = [fmtImdb(d.imdb) && "IMDb " + fmtImdb(d.imdb), fmtRt(d.rt) && "Rotten Tomatoes " + fmtRt(d.rt)].filter(Boolean).join(" · ");
  if (sc) body.appendChild(el("div", "extra", sc));
  if (it.rating) body.appendChild(stars(it.rating));
  if (it.synopsis) body.appendChild(el("p", "syn", it.synopsis));
  if (it.notes) body.appendChild(el("p", "mynote", it.notes));
  card.appendChild(body);
  return card;
}

function renderHome() {
  const all = state.items;
  $("homeCounts").textContent = !state.loaded ? "Carregando seu acervo…"
    : all.length ? plural(all.length, "registro", "registros") + " · " + statusLine(all) : "Nenhum registro ainda";
  const grid = $("homeGrid"); grid.replaceChildren();
  SECTION_KEYS.forEach((s) => {
    const sec = SECTIONS[s];
    const list = all.filter((i) => i.section === s);
    const c = el("div", "home-card sec-" + s);
    const h = el("h3"); h.appendChild(svg(s, 20));
    const a = el("a", null, sec.label); a.href = "#" + s; h.appendChild(a);
    c.appendChild(h);
    c.appendChild(el("div", "big", String(list.length)));
    c.appendChild(el("div", "stat", list.length ? statusLine(list) : "Nada registrado ainda"));
    const chips = el("div", "chips");
    const byType = countBy(list, "type");
    Object.entries(sec.subs).forEach(([k, v]) => {
      const ch = el("a", "chip", v.label); ch.href = "#" + s + "/" + k;
      ch.appendChild(el("b", null, String(byType[k] || 0)));
      chips.appendChild(ch);
    });
    c.appendChild(chips);
    const add = el("button", "btn", "+ Adicionar"); add.type = "button";
    add.addEventListener("click", () => openDialog(null, s));
    c.appendChild(add);
    grid.appendChild(c);
  });
  const recent = $("recent"); recent.replaceChildren();
  [...all].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 6).forEach((it) => recent.appendChild(card(it)));
  recent.hidden = !all.length;
  recent.previousElementSibling.hidden = !all.length;
  $("homeEmpty").hidden = !state.loaded || all.length > 0;
}

function renderSection() {
  const s = state.section, sec = SECTIONS[s];
  $("sectionView").className = "sec-" + s;
  $("secEyebrow").textContent = state.sub ? sec.label : "";
  $("secEyebrow").hidden = !state.sub;
  $("secTitle").textContent = state.sub ? sec.subs[state.sub].label : sec.label;
  document.title = (state.sub ? sec.subs[state.sub].label : sec.label) + " · Meu Acervo";
  $("q").placeholder = "Buscar em " + (state.sub ? sec.subs[state.sub].label : sec.label).toLowerCase();

  const inSec = state.items.filter((i) => i.section === s);
  const scope = state.sub ? inSec.filter((i) => i.type === state.sub) : inSec;
  $("counts").textContent = !state.loaded ? "Carregando…" : scope.length ? plural(scope.length, "registro", "registros") + " · " + statusLine(scope) : "Nenhum registro ainda";

  // sub tabs
  const tabs = $("subTabs"); tabs.replaceChildren();
  const byType = countBy(inSec, "type");
  [["", "Tudo", inSec.length], ...Object.entries(sec.subs).map(([k, v]) => [k, v.label, byType[k] || 0])].forEach(([k, label, n]) => {
    const b = el("button", "tab", label); b.type = "button";
    b.appendChild(el("span", "n", String(n)));
    b.setAttribute("aria-pressed", String(state.sub === k));
    b.addEventListener("click", () => go(s, k));
    tabs.appendChild(b);
  });

  // status filter
  const labels = state.sub ? statusLabels(s, state.sub) : Object.fromEntries(Object.keys(sec.status).map((k) => [k, GENERIC_STATUS[k]]));
  if (!labels[state.status]) state.status = "";
  const byStatus = countBy(scope, "status");
  const stTabs = $("statusTabs"); stTabs.replaceChildren();
  [["", "Todos", scope.length], ...Object.entries(labels).map(([k, v]) => [k, v, byStatus[k] || 0])].forEach(([k, label, n]) => {
    const b = el("button", "tab", label); b.type = "button";
    b.appendChild(el("span", "n", String(n)));
    b.setAttribute("aria-pressed", String(state.status === k));
    b.addEventListener("click", () => { state.status = k; render(); });
    stTabs.appendChild(b);
  });

  const q = norm(state.q);
  const rows = scope.filter((it) =>
    (!state.status || it.status === state.status) &&
    (!q || norm([it.title, it.creator, it.notes, it.synopsis, it.genre, ...Object.values(it.details || {})].join(" ")).includes(q)));
  // items without the value always go to the end
  const desc = (f) => (a, b) => { const x = f(a), y = f(b); return x == null ? (y == null ? 0 : 1) : y == null ? -1 : y - x; };
  const asc = (f) => (a, b) => { const x = f(a), y = f(b); return x == null ? (y == null ? 0 : 1) : y == null ? -1 : x - y; };
  const year = (i) => score(i.year);
  const by = {
    title: (a, b) => (a.title || "").localeCompare(b.title || "", "pt-BR"),
    "year-desc": desc(year),
    "year-asc": asc(year),
    imdb: desc((i) => score(i.details?.imdb)),
    rt: desc((i) => score(i.details?.rt)),
    rating: (a, b) => (b.rating || 0) - (a.rating || 0) || (b.createdAt || "").localeCompare(a.createdAt || ""),
    recent: (a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""),
  };
  rows.sort(by[state.sort]);
  const list = $("list"); list.replaceChildren(...rows.map(card));

  const empty = $("empty");
  empty.hidden = rows.length > 0 || !state.loaded;
  if (scope.length) {
    $("emptyTitle").textContent = "Nada encontrado com esses filtros";
    $("emptyText").textContent = "Tente outra busca ou outro status.";
  } else {
    $("emptyTitle").textContent = "Nenhum registro aqui ainda";
    $("emptyText").textContent = "Clique em \"+ Adicionar\" para registrar " + sec.itemArt + ". O acervo busca a imagem e as informações para você.";
  }
}

function render() {
  renderNav();
  const v = state.section === "inicio" ? "home" : state.section === "descobrir" ? "discover" : "section";
  $("homeView").hidden = v !== "home";
  $("sectionView").hidden = v !== "section";
  $("discoverView").hidden = v !== "discover";
  if (v === "home") { document.title = "Meu Acervo"; renderHome(); }
  else if (v === "discover") { document.title = "Descobrir · Meu Acervo"; renderDiscover(); }
  else renderSection();
}

// ---------- data ----------
async function loadItems() {
  const { data, error } = await sb.from("items").select("*").order("created_at", { ascending: false });
  if (error) {
    show("notice", /section|details|column/i.test(error.message || "")
      ? "O banco de dados ainda está na versão antiga. Rode o arquivo supabase.sql de novo no SQL Editor do Supabase e recarregue a página."
      : "Não deu para carregar seu acervo. Verifique a conexão e recarregue a página.");
    return;
  }
  show("notice", "");
  // rows from removed lists (books, drinks, trips, games…) stay in the database but are not shown
  state.items = data.map(fromRow).filter(isShown);
  state.loaded = true;
  render();
}
function dbError(error) {
  if (!error) return "";
  const m = error.message || "";
  if (/JWT|session/i.test(m)) return "Sua sessão expirou. Entre de novo.";
  if (/section|details|items_type_check|items_status_check|column/i.test(m)) return "O banco de dados ainda está na versão antiga. Rode o arquivo supabase.sql de novo no Supabase.";
  return "Não deu para salvar agora. Verifique a conexão e tente de novo.";
}

// ---------- auth ----------
function setAuthMode(signUp) {
  state.signUp = signUp;
  $("modeIn").setAttribute("aria-pressed", String(!signUp));
  $("modeUp").setAttribute("aria-pressed", String(signUp));
  $("authSubmit").textContent = signUp ? "Criar conta" : "Entrar";
  $("authPass").autocomplete = signUp ? "new-password" : "current-password";
  show("authNotice", ""); show("authOk", "");
}
function authError(error) {
  const m = (error && error.message) || "";
  if (/invalid login credentials/i.test(m)) return "E-mail ou senha incorretos.";
  if (/email not confirmed/i.test(m)) return "Confirme seu e-mail pelo link que enviamos antes de entrar.";
  if (/already registered|already exists/i.test(m)) return "Já existe uma conta com este e-mail. Use a aba Entrar.";
  if (/rate limit/i.test(m)) return "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.";
  if (/sending (confirmation|magic link)? ?email|confirmation email|not authorized/i.test(m))
    return "O Supabase tentou enviar um e-mail de confirmação e não conseguiu. No painel do Supabase, desligue \"Confirm email\" em Authentication → Sign In / Providers → Email.";
  if (/signups? not allowed|signups? (are )?disabled|email signups/i.test(m))
    return "O cadastro está desativado no Supabase. Em Authentication → Sign In / Providers, ative \"Allow new users to sign up\" e o provedor Email.";
  if (/invalid api key|no api key|apikey|jwt|unregistered api key/i.test(m))
    return "A chave do Supabase no config.js não foi aceita. Confira SUPABASE_ANON_KEY (copie a chave pública de novo, sem espaços).";
  if (/failed to fetch|networkerror|load failed|fetch/i.test(m) || (error && error.status === 0))
    return "O site não conseguiu falar com o Supabase. Confira SUPABASE_URL no config.js: deve ser só https://xxxx.supabase.co. Se estiver certo, veja se o projeto não está pausado no painel do Supabase.";
  if (/email.*invalid|invalid.*email|validate email/i.test(m)) return "O Supabase não aceitou este endereço de e-mail. Confira se está escrito certo.";
  if (/password/i.test(m)) return "A senha não atende às regras do Supabase: " + m;
  return "Não deu para entrar agora." + (m ? " Detalhe do Supabase: " + m : " Verifique a conexão e tente de novo.");
}
$("modeIn").addEventListener("click", () => setAuthMode(false));
$("modeUp").addEventListener("click", () => setAuthMode(true));
$("authForm").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const email = $("authEmail").value.trim();
  const password = $("authPass").value;
  show("authNotice", ""); show("authOk", "");
  $("authSubmit").disabled = true;
  try {
    if (state.signUp) {
      const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + location.pathname } });
      if (error) { console.error(error); show("authNotice", authError(error)); }
      else if (!data.session) show("authOk", "Conta criada. Enviamos um link para " + email + ". Confirme o e-mail e depois entre.");
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) { console.error(error); show("authNotice", authError(error)); }
    }
  } catch (e) {
    console.error(e);
    show("authNotice", authError(e));
  } finally { $("authSubmit").disabled = false; }
});
$("googleBtn").addEventListener("click", async () => {
  const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname } });
  if (error) show("authNotice", "Não deu para entrar com Google agora.");
});
$("signOut").addEventListener("click", async () => { await sb.auth.signOut(); });

// ---------- metadata search ----------
async function getJSON(url, headers) {
  const r = await fetch(url, { headers: headers || {} });
  if (!r.ok) { const e = new Error("HTTP " + r.status); e.status = r.status; throw e; }
  return r.json();
}
function tmdb(path, params) {
  const key = CFG.TMDB_KEY || "";
  const u = new URL("https://api.themoviedb.org/3" + path);
  Object.entries(params || {}).forEach(([k, v]) => u.searchParams.set(k, v));
  const bearer = key.startsWith("eyJ");
  if (!bearer) u.searchParams.set("api_key", key);
  return getJSON(u, bearer ? { Authorization: "Bearer " + key } : null);
}
const POSTER = "https://image.tmdb.org/t/p/w342";
const noKey = (name) => Object.assign(new Error("no key"), { noKey: name });

const PROVIDERS = {
  async "tmdb-movie"(q) { return tmdbSearch(q, false); },
  async "tmdb-tv"(q) { return tmdbSearch(q, true); },
};
async function tmdbSearch(q, tv) {
  if (isPlaceholder(CFG.TMDB_KEY)) throw noKey("TMDB");
  const d = await tmdb(tv ? "/search/tv" : "/search/movie", { query: q, language: "pt-BR", include_adult: "false" });
  return (d.results || []).slice(0, 8).map((r) => ({
    source: "tmdb", id: r.id, tv,
    title: tv ? r.name : r.title,
    original: tv ? r.original_name : r.original_title,
    year: ((tv ? r.first_air_date : r.release_date) || "").slice(0, 4),
    cover: r.poster_path ? POSTER + r.poster_path : null,
    synopsis: r.overview || "",
  }));
}
async function workDetails(r) {
  if (r.source === "tmdb") {
    const path = (r.tv ? "/tv/" : "/movie/") + r.id;
    const d = await tmdb(path, { language: "pt-BR", append_to_response: r.tv ? "external_ids" : "credits,external_ids" });
    let synopsis = d.overview || "";
    if (!synopsis) { try { synopsis = (await tmdb(path, { language: "en-US" })).overview || ""; } catch (e) {} }
    const creator = r.tv ? (d.created_by || []).map((p) => p.name).join(", ")
      : ((d.credits && d.credits.crew) || []).filter((p) => p.job === "Director").map((p) => p.name).join(", ");
    return {
      title: r.tv ? d.name : d.title, creator, year: r.year,
      genre: (d.genres || []).slice(0, 2).map((g) => g.name).join(", "),
      synopsis, cover: d.poster_path ? POSTER + d.poster_path : r.cover,
      tmdbid: String(r.id), imdbid: d.imdb_id || (d.external_ids && d.external_ids.imdb_id) || "",
    };
  }
  return r;
}

// IMDb and Rotten Tomatoes scores come from OMDb (omdbapi.com), looked up by IMDb id.
async function omdbScores(imdbid) {
  if (!imdbid || isPlaceholder(CFG.OMDB_KEY)) return null;
  const u = new URL("https://www.omdbapi.com/");
  u.searchParams.set("i", imdbid); u.searchParams.set("apikey", CFG.OMDB_KEY);
  const d = await getJSON(u);
  if (d.Response === "False") {
    const e = new Error(d.Error || "OMDb"); e.omdb = /limit/i.test(d.Error || "") ? "limit" : /key/i.test(d.Error || "") ? "key" : "";
    throw e;
  }
  const rt = (d.Ratings || []).find((x) => x.Source === "Rotten Tomatoes");
  return { imdb: score(d.imdbRating) != null ? d.imdbRating : "", rt: rt ? rt.Value : "" };
}
// For items saved before scores existed: find the TMDB entry by title and year to get the IMDb id.
async function tmdbFind(it) {
  const tv = it.type === "serie";
  const params = { query: it.title, language: "pt-BR", include_adult: "false" };
  if (it.year) params[tv ? "first_air_date_year" : "year"] = it.year;
  const d = await tmdb(tv ? "/search/tv" : "/search/movie", params);
  const r = (d.results || [])[0];
  return r ? String(r.id) : "";
}
async function findImdbId(it) {
  const tmdbid = await tmdbFind(it);
  if (!tmdbid) return { imdbid: "", tmdbid: "" };
  const ext = await tmdb((it.type === "serie" ? "/tv/" : "/movie/") + tmdbid + "/external_ids");
  return { imdbid: ext.imdb_id || "", tmdbid };
}
let fetchingScores = false;
async function refreshScores() {
  if (fetchingScores) return;
  closeMenu();
  if (isPlaceholder(CFG.OMDB_KEY)) { show("notice", "Falta a chave do OMDb no config.js para buscar as notas do IMDb e do Rotten Tomatoes. Veja o LEIA-ME.md."); return; }
  if (isPlaceholder(CFG.TMDB_KEY)) { show("notice", "Falta a chave do TMDB no config.js."); return; }
  const todo = state.items.filter((i) => !(i.details && i.details.imdb));
  if (!todo.length) { show("notice", "Todos os títulos já têm nota do IMDb.", true); return; }
  fetchingScores = true;
  let ok = 0, miss = 0, stop = "";
  try {
    for (let n = 0; n < todo.length; n++) {
      const it = todo[n];
      show("notice", "Buscando notas… " + (n + 1) + " de " + todo.length, true);
      try {
        const details = { ...(it.details || {}) };
        if (!details.imdbid) Object.assign(details, await findImdbId(it));
        const s = details.imdbid ? await omdbScores(details.imdbid) : null;
        if (s) { if (s.imdb) details.imdb = s.imdb; if (s.rt && !details.rt) details.rt = s.rt; }
        const clean = cleanDetails(details);
        if (JSON.stringify(clean) !== JSON.stringify(cleanDetails(it.details))) {
          const { data, error } = await sb.from("items").update({ details: clean }).eq("id", it.id).select().single();
          if (error) { stop = dbError(error); break; }
          const saved = fromRow(data);
          state.items = state.items.map((i) => (i.id === saved.id ? saved : i));
        }
        if (clean.imdb) ok++; else miss++;
      } catch (e) {
        if (e.omdb === "limit") { stop = "O OMDb chegou ao limite de buscas do dia (1.000). Tente de novo amanhã."; break; }
        if (e.omdb === "key") { stop = "A chave do OMDb no config.js não foi aceita. Confira se você ativou a chave pelo link do e-mail."; break; }
        if (e.status === 429) { stop = "Muitas buscas seguidas. Espere um minuto e tente de novo."; break; }
        miss++;
      }
    }
  } finally { fetchingScores = false; }
  render();
  show("notice", stop || ("Notas atualizadas: " + plural(ok, "título", "títulos") + " com nota" + (miss ? ", " + miss + " sem nota encontrada (preencha à mão, se quiser)." : ".")), !stop);
}
$("scoresBtn").addEventListener("click", refreshScores);

let searchSeq = 0;
function currentSub() { const c = document.querySelector('input[name="sub"]:checked'); return c ? c.value : Object.keys(SECTIONS[state.dlgSection].subs)[0]; }
async function runSearch() {
  const q = $("fTitle").value.trim();
  if (q.length < 2) { show("formNotice", "Escreva o nome antes de buscar."); return; }
  show("formNotice", "");
  const seq = ++searchSeq;
  const box = $("results");
  show("searchState", "Buscando…");
  try {
    const src = SECTIONS[state.dlgSection].subs[currentSub()].src;
    const found = await PROVIDERS[src](q);
    if (seq !== searchSeq) return;
    box.replaceChildren();
    if (!found.length) { box.hidden = true; show("searchState", "Nada encontrado. Confira a grafia ou preencha à mão."); return; }
    show("searchState", "Escolha a opção certa para preencher imagem e informações.");
    found.forEach((r) => {
      const b = el("button", "result"); b.type = "button";
      if (r.cover) { const img = document.createElement("img"); img.alt = ""; img.loading = "lazy"; img.referrerPolicy = "no-referrer"; img.src = r.cover; b.appendChild(img); }
      else b.appendChild(el("span", "noimg"));
      const t = el("span");
      t.appendChild(el("b", null, r.title));
      const sub = [r.year, r.creator, r.original && r.original !== r.title ? r.original : "", r.sub].filter(Boolean).join(" · ");
      if (sub) t.appendChild(el("small", null, sub));
      b.appendChild(t);
      b.addEventListener("click", () => pick(r));
      box.appendChild(b);
    });
    box.hidden = false;
  } catch (e) {
    if (seq !== searchSeq) return;
    box.hidden = true;
    show("searchState", e.noKey
      ? "Falta a chave do " + e.noKey + " no config.js para buscar aqui. Preencha à mão ou veja o LEIA-ME.md."
      : e.status === 429 ? "Muitas buscas seguidas. Espere um minuto e tente de novo."
      : "Não deu para buscar agora. Verifique a conexão e tente de novo.");
  }
}
function setField(col, value) {
  const inp = document.querySelector('[data-col="' + col + '"]');
  if (inp && value) inp.value = value;
}
function setDetail(key, value) {
  const inp = document.querySelector('[data-key="' + key + '"]');
  if (inp) inp.value = value || "";
}
let picked = {};
async function pick(r) {
  show("searchState", "Carregando detalhes…");
  try {
    const d = await workDetails(r);
    $("fTitle").value = d.title || r.title;
    setField("creator", d.creator);
    setField("year", d.year);
    setField("genre", d.genre);
    if (d.synopsis) $("fSyn").value = d.synopsis;
    $("fCoverUrl").value = d.cover || "";
    $("results").hidden = true;
    picked = { imdbid: d.imdbid || "", tmdbid: d.tmdbid || "" };
    setDetail("imdb", ""); setDetail("rt", "");
    let msg = d.synopsis ? "" : "Não há descrição disponível para esta opção. Escreva uma se quiser.";
    try {
      const s = await omdbScores(d.imdbid);
      if (s) { setDetail("imdb", s.imdb); setDetail("rt", s.rt); }
    } catch (e) { msg = (msg ? msg + " " : "") + "Não deu para buscar as notas do IMDb agora."; }
    show("searchState", msg);
    drawCoverPreview();
  } catch (e) { show("searchState", "Não deu para carregar os detalhes. Tente outra opção."); }
}
let autoTimer = null;
$("fTitle").addEventListener("input", () => {
  drawCoverPreview();
  if (state.editing) return;
  clearTimeout(autoTimer);
  if ($("fTitle").value.trim().length >= 3) autoTimer = setTimeout(runSearch, 700);
});
$("searchBtn").addEventListener("click", runSearch);

// ---------- dialog ----------
function buildFields(item) {
  const sub = currentSub();
  const box = $("dynFields");
  // keep what was typed when switching sub
  const prev = {};
  box.querySelectorAll("input").forEach((i) => { prev[i.dataset.col || "d:" + i.dataset.key] = i.value; });
  box.replaceChildren();
  SECTIONS[state.dlgSection].fields(sub).forEach((f) => {
    const lab = el("label", "field" + (f.full ? " full" : ""));
    lab.appendChild(el("span", null, f.label));
    const inp = document.createElement("input");
    inp.maxLength = f.col === "genre" ? 80 : f.year ? 4 : 200;
    inp.autocomplete = "off";
    if (f.year) { inp.inputMode = "numeric"; inp.pattern = "[0-9]{4}"; }
    if (f.num) { inp.inputMode = "decimal"; }
    if (f.hint) inp.placeholder = f.hint;
    const id = f.col ? "f-" + f.col : "fd-" + f.key;
    inp.id = id;
    if (f.col) inp.dataset.col = f.col; else inp.dataset.key = f.key;
    const k = f.col || "d:" + f.key;
    inp.value = prev[k] != null ? prev[k] : item ? (f.col ? item[f.col] || "" : (item.details || {})[f.key] || "") : "";
    if (f.col === "creator") inp.addEventListener("input", drawCoverPreview);
    lab.appendChild(inp);
    box.appendChild(lab);
  });
}
function fillStatus(value) {
  const labels = statusLabels(state.dlgSection, currentSub());
  const sel = $("fStat");
  sel.replaceChildren(...Object.entries(labels).map(([k, v]) => new Option(v, k)));
  sel.value = labels[value] ? value : "fila";
}
function drawRate() {
  const r = $("rate"); r.replaceChildren();
  for (let i = 1; i <= 5; i++) {
    const b = el("button", i <= state.rating ? "on" : "", "★"); b.type = "button";
    b.setAttribute("aria-label", i + (i === 1 ? " estrela" : " estrelas"));
    b.setAttribute("aria-pressed", String(i === state.rating));
    b.addEventListener("click", () => { state.rating = i; drawRate(); });
    r.appendChild(b);
  }
  if (state.rating) { const c = el("button", "clear", "sem nota"); c.type = "button"; c.addEventListener("click", () => { state.rating = 0; drawRate(); }); r.appendChild(c); }
}
function drawCoverPreview() {
  const coverUrl = $("fCoverUrl").value.trim();
  const creator = document.querySelector('[data-col="creator"]');
  const it = { section: state.dlgSection, type: currentSub(), title: $("fTitle").value.trim() || "Nome", creator: creator ? creator.value.trim() : "", coverUrl };
  $("coverPreview").replaceChildren(coverEl(it, true));
  $("coverHint").textContent = safeHttps(coverUrl)
    ? "Imagem encontrada. Para trocar, cole o link de outra imagem."
    : "Imagem ilustrada. Busque pelo nome ou cole o link de uma imagem.";
}
function openDialog(item, sectionKey, subKey) {
  state.editing = item || null;
  picked = {};
  const s = item ? item.section : sectionKey || (SECTIONS[state.section] ? state.section : "estante");
  state.dlgSection = s;
  const sec = SECTIONS[s];
  $("form").className = "edit sec-" + s;
  const seg = $("subSeg"); seg.replaceChildren();
  const startSub = item ? item.type : subKey || (s === state.section && state.sub) || Object.keys(sec.subs)[0];
  Object.entries(sec.subs).forEach(([k, v]) => {
    const lab = el("label");
    const r = document.createElement("input"); r.type = "radio"; r.name = "sub"; r.value = k; r.id = "sub-" + k; r.checked = k === startSub;
    r.addEventListener("change", () => {
      buildFields(null); fillStatus($("fStat").value); drawCoverPreview();
      if (!state.editing && $("fTitle").value.trim().length >= 3) runSearch();
    });
    lab.append(r, el("span", null, v.one));
    seg.appendChild(lab);
  });
  $("dlgTitle").textContent = (item ? "Editar " : "Adicionar ") + sec.item;
  $("titleLabel").textContent = sec.titleLabel;
  $("synLabel").textContent = sec.synLabel;
  $("notesLabel").textContent = sec.notesLabel;
  $("fNotes").placeholder = sec.notesHint;
  $("fTitle").value = item?.title || "";
  $("fSyn").value = item?.synopsis || "";
  $("fNotes").value = item?.notes || "";
  $("fCoverUrl").value = item?.coverUrl || "";
  $("dynFields").replaceChildren();
  buildFields(item);
  $("results").hidden = true; $("results").replaceChildren();
  show("searchState", ""); show("formNotice", "");
  fillStatus(item?.status);
  state.rating = item?.rating || 0; drawRate();
  drawCoverPreview();
  $("delBtn").hidden = !item;
  $("confirmDel").hidden = true; $("actions").hidden = false;
  $("stamp").textContent = item?.createdAt ? "Adicionado em " + new Date(item.createdAt).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }) : "";
  $("dlg").showModal();
  $("fTitle").focus();
}
$("fCoverUrl").addEventListener("input", drawCoverPreview);
$("cancelBtn").addEventListener("click", () => $("dlg").close());
$("dlg").addEventListener("close", () => { clearTimeout(autoTimer); searchSeq++; });

$("form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const title = $("fTitle").value.trim();
  if (!title) { show("formNotice", "Escreva o nome antes de salvar."); return; }
  const yearInp = document.querySelector('[data-col="year"]');
  const year = yearInp ? yearInp.value.trim() : "";
  if (year && !/^\d{4}$/.test(year)) { show("formNotice", "Use quatro dígitos para o ano, por exemplo 2024."); return; }
  const coverRaw = $("fCoverUrl").value.trim();
  if (coverRaw && !safeHttps(coverRaw)) { show("formNotice", "O link da imagem precisa começar com https://"); return; }
  const it = {
    section: state.dlgSection, type: currentSub(), title, year,
    status: $("fStat").value, rating: state.rating, notes: $("fNotes").value,
    synopsis: $("fSyn").value, coverUrl: coverRaw,
    details: { ...(state.editing?.details || {}) },
  };
  document.querySelectorAll("#dynFields input").forEach((i) => {
    if (i.dataset.col) it[i.dataset.col] = i.value; else it.details[i.dataset.key] = i.value;
  });
  // drop detail keys that the current form no longer has
  Object.entries(picked).forEach(([k, v]) => { if (v) it.details[k] = v; });
  const allowed = new Set([...HIDDEN_DETAILS, ...SECTIONS[state.dlgSection].fields(it.type).filter((f) => f.key).map((f) => f.key)]);
  Object.keys(it.details).forEach((k) => { if (!allowed.has(k)) delete it.details[k]; });
  const row = toRow(it);
  $("saveBtn").disabled = true;
  try {
    const q = state.editing
      ? sb.from("items").update(row).eq("id", state.editing.id).select().single()
      : sb.from("items").insert(row).select().single();
    const { data, error } = await q;
    if (error) { show("formNotice", dbError(error)); return; }
    const saved = fromRow(data);
    state.items = state.editing
      ? state.items.map((i) => (i.id === saved.id ? saved : i))
      : [saved, ...state.items];
    $("dlg").close();
    render();
  } finally { $("saveBtn").disabled = false; }
});
$("delBtn").addEventListener("click", () => { $("actions").hidden = true; $("confirmDel").hidden = false; $("noDel").focus(); });
$("noDel").addEventListener("click", () => { $("confirmDel").hidden = true; $("actions").hidden = false; });
$("yesDel").addEventListener("click", async () => {
  if (!state.editing) return;
  const id = state.editing.id;
  const { error } = await sb.from("items").delete().eq("id", id);
  if (error) { show("formNotice", dbError(error)); return; }
  state.items = state.items.filter((i) => i.id !== id);
  $("dlg").close();
  render();
});

// ---------- discover (TMDB lists) ----------
const DISCOVER = {
  trending: { label: "Tendências da semana", path: (tv) => "/trending/" + (tv ? "tv" : "movie") + "/week" },
  now: { label: (tv) => (tv ? "No ar" : "Em cartaz"), path: (tv) => (tv ? "/tv/on_the_air" : "/movie/now_playing"), params: { region: "BR" } },
  popular: { label: "Populares", path: (tv) => (tv ? "/tv/popular" : "/movie/popular"), params: { region: "BR" } },
  top: { label: "Mais bem avaliados", path: (tv) => (tv ? "/tv/top_rated" : "/movie/top_rated") },
  foryou: { label: "Para você" },
};
const disc = { list: "trending", type: "filme", cache: {}, seq: 0 };
function tmdbItem(r, tv) {
  return {
    source: "tmdb", id: r.id, tv, title: tv ? r.name : r.title,
    original: tv ? r.original_name : r.original_title,
    year: ((tv ? r.first_air_date : r.release_date) || "").slice(0, 4),
    cover: r.poster_path ? POSTER + r.poster_path : null,
    synopsis: r.overview || "", vote: r.vote_average || 0, votes: r.vote_count || 0,
  };
}
function inMyList(r) {
  const type = r.tv ? "serie" : "filme";
  return state.items.some((i) => i.type === type && ((i.details && i.details.tmdbid === String(r.id)) ||
    (norm(i.title) === norm(r.title) && (!i.year || !r.year || i.year === r.year))));
}
// Recommendations from up to 6 titles the person liked (rated 4+ or watched).
async function forYou(tv) {
  const type = tv ? "serie" : "filme";
  const seeds = state.items.filter((i) => i.type === type && (i.rating >= 4 || i.status === "concluido"))
    .sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6);
  if (!seeds.length) return { results: [], noSeeds: true };
  const tally = new Map();
  for (const it of seeds) {
    const id = (it.details && it.details.tmdbid) || await tmdbFind(it).catch(() => "");
    if (!id) continue;
    const d = await tmdb((tv ? "/tv/" : "/movie/") + id + "/recommendations", { language: "pt-BR" }).catch(() => ({}));
    (d.results || []).forEach((r) => {
      const t = tally.get(r.id) || { r, n: 0, from: [] };
      t.n++; if (t.from.length < 2) t.from.push(it.title);
      tally.set(r.id, t);
    });
  }
  const results = [...tally.values()].sort((a, b) => b.n - a.n || (b.r.vote_average || 0) - (a.r.vote_average || 0))
    .map((t) => ({ ...tmdbItem(t.r, tv), because: t.from }));
  return { results };
}
async function loadDiscover(more) {
  const tv = disc.type === "serie";
  const key = disc.list + "/" + disc.type;
  const c = disc.cache[key] || (disc.cache[key] = { results: [], page: 0, total: 1 });
  if (!more && c.page) return;
  const seq = ++disc.seq;
  $("discMore").hidden = true;
  show("discState", "Carregando…");
  try {
    if (disc.list === "foryou") {
      const d = await forYou(tv);
      Object.assign(c, d, { page: 1, total: 1 });
    } else {
      const L = DISCOVER[disc.list];
      const d = await tmdb(L.path(tv), { language: "pt-BR", page: String(c.page + 1), ...(L.params || {}) });
      const seen = new Set(c.results.map((r) => r.id));
      c.results.push(...(d.results || []).filter((r) => !seen.has(r.id)).map((r) => tmdbItem(r, tv)));
      c.page = d.page || c.page + 1; c.total = Math.min(d.total_pages || 1, 20);
    }
    if (seq === disc.seq) show("discState", "");
  } catch (e) {
    c.error = e.status === 429 ? "Muitas buscas seguidas. Espere um minuto e tente de novo." : "Não deu para carregar agora. Verifique a conexão e tente de novo.";
    if (seq === disc.seq) show("discState", e.status === 429 ? "Muitas buscas seguidas. Espere um minuto e tente de novo." : "Não deu para carregar agora. Verifique a conexão e tente de novo.");
  }
  if (seq === disc.seq) renderDiscover();
}
function discCard(r) {
  const card = el("article", "card sec-estante");
  card.appendChild(coverEl({ section: "estante", type: r.tv ? "serie" : "filme", title: r.title, coverUrl: r.cover }));
  const body = el("div", "body");
  const top = el("div", "card-top");
  top.appendChild(el("span", "kind", r.tv ? "Série" : "Filme"));
  body.appendChild(top);
  body.appendChild(el("h3", null, r.title));
  const meta = [r.year, r.original && r.original !== r.title ? r.original : ""].filter(Boolean).join(" · ");
  if (meta) body.appendChild(el("div", "meta", meta));
  if (r.votes >= 20) body.appendChild(el("div", "extra", "Nota TMDB " + r.vote.toFixed(1).replace(".", ",")));
  if (r.because && r.because.length) body.appendChild(el("div", "genre", "Porque você gostou de " + r.because.join(" e ")));
  if (r.synopsis) body.appendChild(el("p", "syn", r.synopsis));
  if (inMyList(r)) body.appendChild(el("span", "status s-concluido", "Na sua lista"));
  else {
    const add = el("button", "btn", "+ Adicionar à lista"); add.type = "button";
    add.addEventListener("click", () => {
      openDialog(null, "estante", r.tv ? "serie" : "filme");
      $("fTitle").value = r.title;
      pick(r);
    });
    body.appendChild(add);
  }
  card.appendChild(body);
  return card;
}
function renderDiscover() {
  const tabs = $("discTabs"); tabs.replaceChildren();
  Object.entries(DISCOVER).forEach(([k, v]) => {
    const b = el("button", "tab", typeof v.label === "function" ? v.label(disc.type === "serie") : v.label); b.type = "button";
    b.setAttribute("aria-pressed", String(disc.list === k));
    b.addEventListener("click", () => { disc.list = k; renderDiscover(); });
    tabs.appendChild(b);
  });
  const types = $("discType"); types.replaceChildren();
  [["filme", "Filmes"], ["serie", "Séries"]].forEach(([k, label]) => {
    const b = el("button", "tab", label); b.type = "button";
    b.setAttribute("aria-pressed", String(disc.type === k));
    b.addEventListener("click", () => { disc.type = k; renderDiscover(); });
    types.appendChild(b);
  });
  if (isPlaceholder(CFG.TMDB_KEY)) { show("discState", "Falta a chave do TMDB no config.js."); return; }
  const key = disc.list + "/" + disc.type;
  const c = disc.cache[key];
  if (c && c.error && !c.page) { delete disc.cache[key]; $("discList").replaceChildren(); show("discState", c.error); return; }
  if (!c || !c.page) { $("discList").replaceChildren(); loadDiscover(false); return; }
  if (c.error) { show("discState", c.error); delete c.error; } else show("discState", "");
  const hideMine = $("discHide").checked;
  const rows = c.results.filter((r) => !(hideMine || disc.list === "foryou") || !inMyList(r));
  $("discList").replaceChildren(...rows.map(discCard));
  $("discMore").hidden = disc.list === "foryou" || c.page >= c.total;
  if (disc.list === "foryou") {
    show("discState", c.noSeeds
      ? "Dê nota 4 ou 5 (ou marque como " + (disc.type === "serie" ? "vista) em algumas séries" : "visto) em alguns filmes") + " da sua lista para receber recomendações."
      : rows.length ? "" : "Nenhuma recomendação nova por enquanto.");
  }
}
$("discMore").addEventListener("click", () => loadDiscover(true));
$("discHide").addEventListener("change", renderDiscover);

// ---------- export / import ----------
$("exportBtn").addEventListener("click", () => {
  const data = state.items.map((it) => ({ ...toRow(it), created_at: it.createdAt }));
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "acervo-" + new Date().toISOString().slice(0, 10) + ".json";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});
$("importFile").addEventListener("change", async (ev) => {
  const file = ev.target.files[0]; ev.target.value = "";
  if (!file) return;
  closeMenu();
  let list;
  try { list = JSON.parse(await file.text()); } catch (e) { show("notice", "Este arquivo não é um JSON válido."); return; }
  if (!Array.isArray(list)) list = list && Array.isArray(list.items) ? list.items : [];
  const rows = list.filter((x) => x && typeof x === "object" && x.title && !x.example && SECTIONS.estante.subs[x.type]).map((x) => {
    const r = toRow(x);
    const when = x.created_at || x.createdAt;
    if (when && !isNaN(Date.parse(when))) r.created_at = new Date(when).toISOString();
    return r;
  });
  if (!rows.length) { show("notice", "Não encontrei filmes ou séries nesse arquivo."); return; }
  show("notice", "");
  for (let i = 0; i < rows.length; i += 100) {
    const { error } = await sb.from("items").insert(rows.slice(i, i + 100));
    if (error) { show("notice", "A importação parou no meio: " + dbError(error)); break; }
  }
  await loadItems();
});

// ---------- toolbar ----------
$("q").addEventListener("input", (e) => { state.q = e.target.value; render(); });
$("sort").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
$("addBtn").addEventListener("click", () => openDialog(null));

// ---------- start ----------
function onSession(session) {
  const user = session ? session.user : null;
  const changed = (user && user.id) !== (state.user && state.user.id);
  state.user = user;
  if (!user) {
    state.items = []; state.loaded = false;
    if ($("dlg").open) $("dlg").close();
    showView("auth");
    return;
  }
  $("whoEmail").textContent = user.email || "";
  showView("app");
  if (changed) { state.loaded = false; applyRoute(); loadItems(); }
}

(function start() {
  if (isPlaceholder(CFG.SUPABASE_URL) || isPlaceholder(CFG.SUPABASE_ANON_KEY) || !window.supabase) { showView("setup"); return; }
  // accept a pasted URL with extra path (".../rest/v1/") or spaces
  let url = String(CFG.SUPABASE_URL).trim();
  try { url = new URL(url).origin; } catch (e) {}
  sb = window.supabase.createClient(url, String(CFG.SUPABASE_ANON_KEY).trim());
  if (CFG.LOGIN_GOOGLE) { $("googleBtn").hidden = false; $("orLine").hidden = false; }
  setAuthMode(false);
  // defer: supabase-js must not be called from inside its own auth callback
  sb.auth.onAuthStateChange((_event, session) => setTimeout(() => onSession(session), 0));
})();
