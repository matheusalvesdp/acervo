"use strict";

const CFG = window.ESTANTE_CONFIG || {};

// ---------- sections ----------
const ICONS = {
  estante: '<path d="M5 4h3v16H5zM10 4h3v16h-3zM15.2 4.6l2.9-.8 3.9 15.5-2.9.8z" fill="currentColor"/>',
  bebidas: '<path d="M7 3h10l-1 7a4 4 0 0 1-8 0zM12 14v5M8 21h8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  viagens: '<path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="10" r="2.2" fill="currentColor"/>',
  jogos: '<path d="M7 8h10a4 4 0 0 1 4 4.5l-.6 3.6a2 2 0 0 1-3.4 1L15 15H9l-2 2.1a2 2 0 0 1-3.4-1L3 12.5A4 4 0 0 1 7 8z" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/><path d="M8 11v3M6.5 12.5h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="15.5" cy="12" r="1" fill="currentColor"/><circle cx="17" cy="13.8" r="1" fill="currentColor"/>',
  inicio: '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/>',
};
const ST_WATCH = { fila: "Quero ver", andamento: "Assistindo", concluido: "Visto" };
const SECTIONS = {
  estante: {
    label: "Estante", item: "título", itemArt: "o primeiro título",
    subs: {
      filme: { label: "Filmes", one: "Filme", src: "tmdb-movie", creator: "Direção" },
      serie: { label: "Séries", one: "Série", src: "tmdb-tv", creator: "Criação", status: { ...ST_WATCH, concluido: "Vista" } },
      anime: { label: "Animes", one: "Anime", src: "tmdb-anime", creator: "Estúdio" },
      livro: { label: "Livros", one: "Livro", src: "books", creator: "Autoria", status: { fila: "Quero ler", andamento: "Lendo", concluido: "Lido" } },
    },
    status: ST_WATCH,
    fields: (sub) => [
      { col: "creator", label: SECTIONS.estante.subs[sub].creator },
      { col: "year", label: "Ano", year: true },
      { col: "genre", label: "Gênero", full: true },
    ],
    titleLabel: "Título", synLabel: "Sinopse", notesLabel: "Anotações",
    notesHint: "Onde assistir, edição do livro, por que quero ver…",
  },
  bebidas: {
    label: "Bebidas", item: "bebida", itemArt: "a primeira bebida",
    subs: {
      vinho: { label: "Vinhos", one: "Vinho", src: "wiki", creator: "Vinícola" },
      whisky: { label: "Whiskys", one: "Whisky", src: "wiki", creator: "Destilaria" },
      cerveja: { label: "Cervejas", one: "Cerveja", src: "wiki", creator: "Cervejaria" },
    },
    status: { fila: "Quero provar", concluido: "Provei" },
    fields: (sub) => [
      { col: "creator", label: SECTIONS.bebidas.subs[sub].creator },
      { key: "origin", label: "País / região", hint: "Ex.: Mendoza, Argentina" },
      sub === "vinho" ? { col: "genre", label: "Uva", hint: "Ex.: Malbec" }
        : sub === "whisky" ? { col: "genre", label: "Tipo", hint: "Ex.: Single malt, bourbon" }
        : { col: "genre", label: "Estilo", hint: "Ex.: IPA, Pilsen" },
      sub === "vinho" ? { col: "year", label: "Safra", year: true }
        : sub === "whisky" ? { key: "age", label: "Idade", hint: "Ex.: 12 anos" }
        : { key: "volume", label: "Volume", hint: "Ex.: 473 ml" },
      { key: "abv", label: "Teor alcoólico", hint: "Ex.: 13,5%" },
      { key: "price", label: "Preço", hint: "Ex.: R$ 120" },
      { key: "where", label: "Onde comprei ou provei", full: true },
    ],
    titleLabel: "Nome", synLabel: "Descrição", notesLabel: "Notas de prova",
    notesHint: "Aroma, sabor, harmonização…",
  },
  viagens: {
    label: "Viagens", item: "destino", itemArt: "o primeiro destino",
    subs: {
      pais: { label: "Países", one: "País", src: "wiki" },
      cidade: { label: "Cidades", one: "Cidade", src: "wiki", creator: "País" },
    },
    status: { fila: "Quero ir", andamento: "Planejando", concluido: "Fui" },
    fields: (sub) => [
      ...(sub === "cidade" ? [{ col: "creator", label: "País" }] : []),
      { key: "when", label: "Quando", hint: "Ex.: jul/2024" },
      { key: "with", label: "Com quem", full: sub === "cidade" },
      { key: "highlights", label: "Lugares favoritos", full: true, hint: "Ex.: Mercado da Ribeira, Belém" },
    ],
    titleLabel: "Lugar", synLabel: "Sobre o lugar", notesLabel: "Anotações",
    notesHint: "Dicas, roteiro, onde ficar…", wide: true,
  },
  jogos: {
    label: "Jogos", item: "jogo", itemArt: "o primeiro jogo",
    subs: {
      ps5: { label: "PlayStation 5", one: "PS5", src: "rawg" },
      xbox: { label: "Xbox", one: "Xbox", src: "rawg" },
      nintendo: { label: "Nintendo", one: "Nintendo", src: "rawg" },
      steam: { label: "Steam", one: "Steam", src: "rawg" },
      mobile: { label: "Mobile", one: "Mobile", src: "rawg" },
      outro: { label: "Outras plataformas", one: "Outra plataforma", src: "rawg" },
    },
    status: { fila: "Quero jogar", andamento: "Jogando", concluido: "Zerei", abandonado: "Larguei" },
    fields: () => [
      { col: "creator", label: "Estúdio" },
      { col: "year", label: "Ano", year: true },
      { col: "genre", label: "Gênero" },
      { key: "hours", label: "Horas jogadas", num: true },
    ],
    titleLabel: "Jogo", synLabel: "Sobre o jogo", notesLabel: "Anotações",
    notesHint: "Onde parei, troféus, dicas…",
  },
};
const SECTION_KEYS = Object.keys(SECTIONS);
const GENERIC_STATUS = { fila: "Na fila", andamento: "Em andamento", concluido: "Concluídos", abandonado: "Abandonados" };
const statusLabels = (section, sub) => (sub && SECTIONS[section].subs[sub]?.status) || SECTIONS[section].status;
function sectionOfType(type) { return SECTION_KEYS.find((s) => SECTIONS[s].subs[type]) || "estante"; }

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
function show(id, msg) { const n = $(id); n.textContent = msg || ""; n.hidden = !msg; }
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
  const c = el("div", "cover" + (big ? " big" : "") + (SECTIONS[it.section]?.wide ? " wide" : ""));
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
  return {
    id: r.id, section, type: r.type, title: r.title, creator: r.creator, year: r.year,
    status: r.status, rating: r.rating, notes: r.notes, synopsis: r.synopsis, genre: r.genre,
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
  const words = { fila: ["na fila", "na fila"], andamento: ["em andamento", "em andamento"], concluido: ["concluído", "concluídos"], abandonado: ["abandonado", "abandonados"] };
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
  const d = it.details || {};
  const meta = [it.creator, d.origin, it.year, d.age].filter(Boolean).join(", ");
  if (meta) body.appendChild(el("div", "meta", meta));
  if (it.genre) body.appendChild(el("div", "genre", it.genre));
  const extra = it.section === "bebidas" ? [d.price, d.abv, d.volume]
    : it.section === "viagens" ? [d.when, d.with ? "com " + d.with : ""]
    : it.section === "jogos" ? [d.hours ? d.hours + " h jogadas" : ""] : [];
  const ex = extra.filter(Boolean).join(" · ");
  if (ex) body.appendChild(el("div", "extra", ex));
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
  const sel = $("fStatus");
  if (sel.dataset.for !== s + "/" + state.sub) {
    sel.replaceChildren(new Option("Todos os status", ""), ...Object.entries(labels).map(([k, v]) => new Option(v, k)));
    sel.dataset.for = s + "/" + state.sub;
    if (!labels[state.status]) state.status = "";
    sel.value = state.status;
  }

  const q = norm(state.q);
  const rows = scope.filter((it) =>
    (!state.status || it.status === state.status) &&
    (!q || norm([it.title, it.creator, it.notes, it.synopsis, it.genre, ...Object.values(it.details || {})].join(" ")).includes(q)));
  const by = {
    title: (a, b) => (a.title || "").localeCompare(b.title || "", "pt-BR"),
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
  const home = state.section === "inicio";
  $("homeView").hidden = !home;
  $("sectionView").hidden = home;
  if (home) { document.title = "Meu Acervo"; renderHome(); } else renderSection();
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
  state.items = data.map(fromRow);
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
  async "tmdb-anime"(q) { return tmdbSearch(q, true, true); },
  async books(q) { return bookSearch(q); },
  async rawg(q) {
    if (isPlaceholder(CFG.RAWG_KEY)) throw noKey("RAWG");
    const u = new URL("https://api.rawg.io/api/games");
    u.searchParams.set("key", CFG.RAWG_KEY); u.searchParams.set("search", q); u.searchParams.set("page_size", "8");
    const d = await getJSON(u);
    return (d.results || []).map((r) => ({
      source: "rawg", id: r.id, title: r.name, year: (r.released || "").slice(0, 4),
      cover: safeHttps(r.background_image), genre: (r.genres || []).slice(0, 2).map((g) => g.name).join(", "),
      sub: (r.platforms || []).slice(0, 4).map((p) => p.platform.name).join(", "),
    }));
  },
  async wiki(q) {
    const u = new URL("https://pt.wikipedia.org/w/api.php");
    Object.entries({
      action: "query", format: "json", origin: "*", generator: "search", gsrsearch: q, gsrlimit: "8",
      prop: "pageimages|extracts|description", exintro: "1", explaintext: "1", exsentences: "3",
      piprop: "thumbnail", pithumbsize: "500",
    }).forEach(([k, v]) => u.searchParams.set(k, v));
    const d = await getJSON(u);
    return Object.values((d.query && d.query.pages) || {}).sort((a, b) => a.index - b.index).map((p) => ({
      source: "wiki", id: p.pageid, title: p.title, sub: p.description || "",
      cover: p.thumbnail ? safeHttps(p.thumbnail.source) : null, synopsis: (p.extract || "").trim(),
    }));
  },
};
async function tmdbSearch(q, tv, anime) {
  if (isPlaceholder(CFG.TMDB_KEY)) throw noKey("TMDB");
  const d = await tmdb(tv ? "/search/tv" : "/search/movie", { query: q, language: "pt-BR", include_adult: "false" });
  let res = d.results || [];
  if (anime) { const a = res.filter((r) => (r.genre_ids || []).includes(16)); if (a.length) res = a; }
  return res.slice(0, 8).map((r) => ({
    source: "tmdb", id: r.id, tv, anime,
    title: tv ? r.name : r.title,
    original: tv ? r.original_name : r.original_title,
    year: ((tv ? r.first_air_date : r.release_date) || "").slice(0, 4),
    cover: r.poster_path ? POSTER + r.poster_path : null,
    synopsis: r.overview || "",
  }));
}
async function bookSearch(q) {
  try {
    const u = new URL("https://www.googleapis.com/books/v1/volumes");
    u.searchParams.set("q", q); u.searchParams.set("maxResults", "8"); u.searchParams.set("printType", "books");
    if (CFG.GOOGLE_BOOKS_KEY) u.searchParams.set("key", CFG.GOOGLE_BOOKS_KEY);
    const d = await getJSON(u);
    const out = (d.items || []).map((v) => {
      const i = v.volumeInfo || {};
      const img = i.imageLinks && (i.imageLinks.thumbnail || i.imageLinks.smallThumbnail);
      return {
        source: "gbooks", id: v.id,
        title: i.title + (i.subtitle ? ": " + i.subtitle : ""),
        creator: (i.authors || []).join(", "),
        year: (i.publishedDate || "").slice(0, 4),
        cover: img ? safeHttps(img.replace("&edge=curl", "")) : null,
        synopsis: plainText(i.description),
        genre: (i.categories || [])[0] || "",
      };
    });
    if (out.length) return out;
  } catch (e) { /* Google Books unavailable or rate limited: try Open Library */ }
  const u = new URL("https://openlibrary.org/search.json");
  u.searchParams.set("q", q); u.searchParams.set("limit", "8");
  u.searchParams.set("fields", "key,title,author_name,first_publish_year,cover_i");
  const d = await getJSON(u);
  return (d.docs || []).map((r) => ({
    source: "openlibrary", id: r.key,
    title: r.title, creator: (r.author_name || []).slice(0, 2).join(", "),
    year: r.first_publish_year ? String(r.first_publish_year) : "",
    cover: r.cover_i ? "https://covers.openlibrary.org/b/id/" + r.cover_i + "-L.jpg" : null,
  }));
}
async function workDetails(r) {
  if (r.source === "tmdb") {
    const path = (r.tv ? "/tv/" : "/movie/") + r.id;
    const d = await tmdb(path, r.tv ? { language: "pt-BR" } : { language: "pt-BR", append_to_response: "credits" });
    let synopsis = d.overview || "";
    if (!synopsis) { try { synopsis = (await tmdb(path, { language: "en-US" })).overview || ""; } catch (e) {} }
    const creator = r.anime
      ? (d.production_companies || []).slice(0, 2).map((p) => p.name).join(", ")
      : r.tv ? (d.created_by || []).map((p) => p.name).join(", ")
      : ((d.credits && d.credits.crew) || []).filter((p) => p.job === "Director").map((p) => p.name).join(", ");
    return {
      title: r.tv ? d.name : d.title, creator, year: r.year,
      genre: (d.genres || []).slice(0, 2).map((g) => g.name).join(", "),
      synopsis, cover: d.poster_path ? POSTER + d.poster_path : r.cover,
    };
  }
  if (r.source === "openlibrary") {
    let synopsis = "";
    try {
      const w = await getJSON("https://openlibrary.org" + r.id + ".json");
      synopsis = typeof w.description === "string" ? w.description : (w.description && w.description.value) || "";
    } catch (e) {}
    return { ...r, synopsis: synopsis.split("\n----------")[0].trim() };
  }
  if (r.source === "rawg") {
    const d = await getJSON("https://api.rawg.io/api/games/" + r.id + "?key=" + encodeURIComponent(CFG.RAWG_KEY));
    return {
      ...r, creator: (d.developers || []).slice(0, 2).map((p) => p.name).join(", "),
      synopsis: (d.description_raw || "").trim().slice(0, 1200),
      cover: safeHttps(d.background_image) || r.cover,
    };
  }
  return r;
}

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
    show("searchState", d.synopsis ? "" : "Não há descrição disponível para esta opção. Escreva uma se quiser.");
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
function openDialog(item, sectionKey) {
  state.editing = item || null;
  const s = item ? item.section : sectionKey || (SECTIONS[state.section] ? state.section : "estante");
  state.dlgSection = s;
  const sec = SECTIONS[s];
  $("form").className = "edit sec-" + s;
  const seg = $("subSeg"); seg.replaceChildren();
  const startSub = item ? item.type : (s === state.section && state.sub) || Object.keys(sec.subs)[0];
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
  $("subLegend").textContent = s === "jogos" ? "Plataforma" : "Tipo";
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
  // details that belong to another sub (e.g. "age" after switching whisky → vinho) are dropped
  const allowed = new Set(SECTIONS[state.dlgSection].fields(it.type).filter((f) => f.key).map((f) => f.key));
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
  const rows = list.filter((x) => x && typeof x === "object" && x.title && !x.example).map((x) => {
    const r = toRow(x);
    const when = x.created_at || x.createdAt;
    if (when && !isNaN(Date.parse(when))) r.created_at = new Date(when).toISOString();
    return r;
  });
  if (!rows.length) { show("notice", "Não encontrei registros nesse arquivo."); return; }
  show("notice", "");
  for (let i = 0; i < rows.length; i += 100) {
    const { error } = await sb.from("items").insert(rows.slice(i, i + 100));
    if (error) { show("notice", "A importação parou no meio: " + dbError(error)); break; }
  }
  await loadItems();
});

// ---------- toolbar ----------
$("q").addEventListener("input", (e) => { state.q = e.target.value; render(); });
$("fStatus").addEventListener("change", (e) => { state.status = e.target.value; render(); });
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
