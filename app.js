"use strict";

const CFG = window.ESTANTE_CONFIG || {};
const TYPES = { filme: "Filme", serie: "Série", livro: "Livro" };
const CREATOR = { filme: "Direção", serie: "Criação", livro: "Autoria" };
const STATUS = {
  filme: { fila: "Quero ver", andamento: "Assistindo", concluido: "Visto" },
  serie: { fila: "Quero ver", andamento: "Assistindo", concluido: "Vista" },
  livro: { fila: "Quero ler", andamento: "Lendo", concluido: "Lido" },
};
const $ = (id) => document.getElementById(id);
const state = {
  items: [], tab: "todos", q: "", status: "", sort: "recent", rating: 0,
  editing: null, user: null, loaded: false, signUp: false,
};
let sb = null;

try { const t = localStorage.getItem("estante.tab"); if (t && (t === "todos" || TYPES[t])) state.tab = t; } catch (e) {}

// ---------- helpers ----------
function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
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
  c.appendChild(el("span", "ct", it.title || "Sem título"));
  c.appendChild(el("span", "cc", it.creator || TYPES[it.type] || ""));
  return c;
}

// ---------- rows <-> items ----------
function fromRow(r) {
  return {
    id: r.id, type: r.type, title: r.title, creator: r.creator, year: r.year, by: r.recommended_by,
    status: r.status, rating: r.rating, notes: r.notes, synopsis: r.synopsis, genre: r.genre,
    coverUrl: r.cover_url, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}
function toRow(it) {
  const year = String(it.year || "").trim();
  return {
    type: TYPES[it.type] ? it.type : "filme",
    title: String(it.title || "").trim().slice(0, 200),
    creator: String(it.creator || "").trim().slice(0, 200),
    year: /^\d{4}$/.test(year) ? year : "",
    recommended_by: String(it.by ?? it.recommended_by ?? "").trim().slice(0, 80),
    status: ["fila", "andamento", "concluido"].includes(it.status) ? it.status : "fila",
    rating: Math.max(0, Math.min(5, Math.round(Number(it.rating) || 0))),
    notes: String(it.notes || "").trim().slice(0, 2000),
    synopsis: String(it.synopsis || "").trim().slice(0, 3000),
    genre: String(it.genre || "").trim().slice(0, 80),
    cover_url: safeHttps(it.coverUrl ?? it.cover_url),
  };
}

// ---------- views ----------
function showView(name) {
  $("setupView").hidden = name !== "setup";
  $("authView").hidden = name !== "auth";
  $("appView").hidden = name !== "app";
}

function render() {
  const all = state.items;
  const c = { todos: all.length, filme: 0, serie: 0, livro: 0 };
  all.forEach((it) => { if (c[it.type] != null) c[it.type]++; });
  document.querySelectorAll("[data-n]").forEach((n) => (n.textContent = c[n.dataset.n]));
  document.querySelectorAll("#tabs .tab").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.type === state.tab)));
  const pend = all.filter((i) => i.status !== "concluido").length;
  $("counts").textContent = !state.loaded ? "Carregando suas listas…" : all.length
    ? `${c.filme} ${c.filme === 1 ? "filme" : "filmes"} · ${c.serie} ${c.serie === 1 ? "série" : "séries"} · ${c.livro} ${c.livro === 1 ? "livro" : "livros"} · ${pend} na fila ou em andamento`
    : "Nenhum título salvo ainda";

  const q = norm(state.q);
  const rows = all.filter((it) =>
    (state.tab === "todos" || it.type === state.tab) &&
    (!state.status || it.status === state.status) &&
    (!q || norm([it.title, it.creator, it.by, it.notes, it.synopsis, it.genre].join(" ")).includes(q)));
  const by = {
    title: (a, b) => (a.title || "").localeCompare(b.title || "", "pt-BR"),
    rating: (a, b) => (b.rating || 0) - (a.rating || 0) || (b.createdAt || "").localeCompare(a.createdAt || ""),
    by: (a, b) => (a.by || "~").localeCompare(b.by || "~", "pt-BR") || (a.title || "").localeCompare(b.title || "", "pt-BR"),
    recent: (a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""),
  };
  rows.sort(by[state.sort]);

  const list = $("list"); list.replaceChildren();
  rows.forEach((it) => {
    const card = el("article", "card");
    card.tabIndex = 0; card.setAttribute("role", "button"); card.setAttribute("aria-label", "Editar " + it.title);
    card.style.cursor = "pointer";
    card.addEventListener("click", () => openDialog(it));
    card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDialog(it); } });
    card.appendChild(coverEl(it));
    const body = el("div", "body");
    const top = el("div", "card-top");
    top.appendChild(el("span", "kind k-" + it.type, TYPES[it.type] || "Item"));
    top.appendChild(el("span", "status s-" + it.status, (STATUS[it.type] || STATUS.filme)[it.status] || ""));
    body.appendChild(top);
    body.appendChild(el("h3", null, it.title));
    const meta = [it.creator, it.year].filter(Boolean).join(", ");
    if (meta) body.appendChild(el("div", "meta", meta));
    if (it.genre) body.appendChild(el("div", "genre", it.genre));
    if (it.by) { const m = el("div", "meta"); m.append("Origem: "); m.appendChild(el("b", null, it.by)); body.appendChild(m); }
    if (it.rating) body.appendChild(stars(it.rating));
    if (it.synopsis) body.appendChild(el("p", "syn", it.synopsis));
    if (it.notes) body.appendChild(el("p", "mynote", it.notes));
    card.appendChild(body);
    list.appendChild(card);
  });

  const empty = $("empty");
  empty.hidden = rows.length > 0 || !state.loaded;
  if (!rows.length && all.length) {
    empty.querySelector("h2").textContent = "Nada encontrado com esses filtros";
    empty.querySelector("p").textContent = "Tente outra busca, outro status ou a aba Tudo.";
  } else {
    empty.querySelector("h2").textContent = "Sua estante está esperando o primeiro título";
    empty.querySelector("p").textContent = "Adicione um filme, série ou livro. A estante busca a capa e a sinopse para você.";
  }
}

// ---------- data ----------
async function loadItems() {
  const { data, error } = await sb.from("items").select("*").order("created_at", { ascending: false });
  if (error) { show("notice", "Não deu para carregar sua estante. Verifique a conexão e recarregue a página."); return; }
  show("notice", "");
  state.items = data.map(fromRow);
  state.loaded = true;
  render();
}
function dbError(error) {
  if (!error) return "";
  if (/JWT|session/i.test(error.message || "")) return "Sua sessão expirou. Entre de novo.";
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

// ---------- metadata search (TMDB, Google Books, Open Library) ----------
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

async function searchWorks(type, q) {
  if (type === "filme" || type === "serie") {
    if (isPlaceholder(CFG.TMDB_KEY)) throw Object.assign(new Error("no key"), { noKey: true });
    const tv = type === "serie";
    const d = await tmdb(tv ? "/search/tv" : "/search/movie", { query: q, language: "pt-BR", include_adult: "false" });
    return (d.results || []).slice(0, 8).map((r) => ({
      source: "tmdb", id: r.id, type,
      title: tv ? r.name : r.title,
      original: tv ? r.original_name : r.original_title,
      year: ((tv ? r.first_air_date : r.release_date) || "").slice(0, 4),
      cover: r.poster_path ? POSTER + r.poster_path : null,
      synopsis: r.overview || "",
    }));
  }
  try {
    const u = new URL("https://www.googleapis.com/books/v1/volumes");
    u.searchParams.set("q", q); u.searchParams.set("maxResults", "8"); u.searchParams.set("printType", "books");
    if (CFG.GOOGLE_BOOKS_KEY) u.searchParams.set("key", CFG.GOOGLE_BOOKS_KEY);
    const d = await getJSON(u);
    const out = (d.items || []).map((v) => {
      const i = v.volumeInfo || {};
      const img = i.imageLinks && (i.imageLinks.thumbnail || i.imageLinks.smallThumbnail);
      return {
        source: "gbooks", id: v.id, type,
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
  u.searchParams.set("fields", "key,title,author_name,first_publish_year,cover_i,subject");
  const d = await getJSON(u);
  return (d.docs || []).map((r) => ({
    source: "openlibrary", id: r.key, type,
    title: r.title, creator: (r.author_name || []).slice(0, 2).join(", "),
    year: r.first_publish_year ? String(r.first_publish_year) : "",
    cover: r.cover_i ? "https://covers.openlibrary.org/b/id/" + r.cover_i + "-L.jpg" : null,
    synopsis: "", genre: "",
  }));
}

async function workDetails(r) {
  if (r.source === "tmdb") {
    const tv = r.type === "serie";
    const d = await tmdb((tv ? "/tv/" : "/movie/") + r.id, tv ? { language: "pt-BR" } : { language: "pt-BR", append_to_response: "credits" });
    let synopsis = d.overview || "";
    if (!synopsis) {
      try { synopsis = (await tmdb((tv ? "/tv/" : "/movie/") + r.id, { language: "en-US" })).overview || ""; } catch (e) {}
    }
    const creator = tv
      ? (d.created_by || []).map((p) => p.name).join(", ")
      : ((d.credits && d.credits.crew) || []).filter((p) => p.job === "Director").map((p) => p.name).join(", ");
    return {
      title: tv ? d.name : d.title, creator, year: r.year,
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
  return r;
}

let searchSeq = 0;
async function runSearch() {
  const q = $("fTitle").value.trim();
  if (q.length < 2) { show("formNotice", "Escreva o título antes de buscar."); return; }
  show("formNotice", "");
  const seq = ++searchSeq;
  const box = $("results");
  show("searchState", "Buscando…");
  try {
    const found = await searchWorks(currentType(), q);
    if (seq !== searchSeq) return;
    box.replaceChildren();
    if (!found.length) { box.hidden = true; show("searchState", "Nada encontrado. Confira a grafia ou preencha à mão."); return; }
    show("searchState", "Escolha a obra certa para preencher capa, sinopse e os outros campos.");
    found.forEach((r) => {
      const b = el("button", "result"); b.type = "button";
      if (r.cover) { const img = document.createElement("img"); img.alt = ""; img.loading = "lazy"; img.referrerPolicy = "no-referrer"; img.src = r.cover; b.appendChild(img); }
      else b.appendChild(el("span", "noimg"));
      const t = el("span");
      t.appendChild(el("b", null, r.title));
      const sub = [r.year, r.creator, r.original && r.original !== r.title ? r.original : ""].filter(Boolean).join(" · ");
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
      ? "Falta a chave do TMDB no config.js para buscar filmes e séries."
      : e.status === 429 ? "Muitas buscas seguidas. Espere um minuto e tente de novo."
      : "Não deu para buscar agora. Verifique a conexão e tente de novo.");
  }
}
async function pick(r) {
  show("searchState", "Carregando detalhes…");
  try {
    const d = await workDetails(r);
    $("fTitle").value = d.title || r.title;
    if (d.creator) $("fCreator").value = d.creator;
    if (d.year) $("fYear").value = d.year;
    if (d.genre) $("fGenre").value = d.genre;
    if (d.synopsis) $("fSyn").value = d.synopsis;
    $("fCoverUrl").value = d.cover || "";
    $("results").hidden = true;
    show("searchState", d.synopsis ? "" : "Não há sinopse disponível para esta obra. Escreva uma se quiser.");
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
function currentType() { return document.querySelector('input[name="type"]:checked').value; }
function fillStatus(type, value) {
  const sel = $("fStat"); sel.replaceChildren();
  Object.entries(STATUS[type]).forEach(([k, v]) => { const o = el("option", null, v); o.value = k; sel.appendChild(o); });
  sel.value = value || "fila";
  $("creatorLabel").textContent = CREATOR[type];
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
  const it = { type: currentType(), title: $("fTitle").value.trim() || "Título", creator: $("fCreator").value.trim(), coverUrl };
  $("coverPreview").replaceChildren(coverEl(it, true));
  $("coverHint").textContent = safeHttps(coverUrl)
    ? "Capa encontrada. Para trocar, cole o link de outra imagem."
    : "Capa ilustrada. Busque a obra pelo título ou cole o link de uma imagem.";
}
function openDialog(item) {
  state.editing = item || null;
  const t = item ? item.type : (TYPES[state.tab] ? state.tab : "filme");
  $("t-" + t).checked = true;
  $("dlgTitle").textContent = item ? "Editar título" : "Novo título";
  $("fTitle").value = item?.title || "";
  $("fCreator").value = item?.creator || "";
  $("fYear").value = item?.year || "";
  $("fBy").value = item?.by || "";
  $("fGenre").value = item?.genre || "";
  $("fSyn").value = item?.synopsis || "";
  $("fNotes").value = item?.notes || "";
  $("fCoverUrl").value = item?.coverUrl || "";
  $("results").hidden = true; $("results").replaceChildren();
  show("searchState", ""); show("formNotice", "");
  fillStatus(t, item?.status);
  state.rating = item?.rating || 0; drawRate();
  drawCoverPreview();
  $("delBtn").hidden = !item;
  $("confirmDel").hidden = true; $("actions").hidden = false;
  $("stamp").textContent = item?.createdAt ? "Adicionado em " + new Date(item.createdAt).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }) : "";
  const names = [...new Set(["Pesquisa própria", ...state.items.map((i) => i.by).filter(Boolean)])].sort((a, b) => a.localeCompare(b, "pt-BR"));
  $("byList").replaceChildren(...names.map((n) => { const o = document.createElement("option"); o.value = n; return o; }));
  $("dlg").showModal();
  $("fTitle").focus();
}
document.querySelectorAll('input[name="type"]').forEach((r) => r.addEventListener("change", () => {
  fillStatus(currentType(), $("fStat").value);
  drawCoverPreview();
  if (!state.editing && $("fTitle").value.trim().length >= 3) runSearch();
}));
$("fCreator").addEventListener("input", drawCoverPreview);
$("fCoverUrl").addEventListener("input", drawCoverPreview);
$("cancelBtn").addEventListener("click", () => $("dlg").close());
$("dlg").addEventListener("close", () => { clearTimeout(autoTimer); searchSeq++; });

$("form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const title = $("fTitle").value.trim();
  if (!title) { show("formNotice", "Escreva o título antes de salvar."); return; }
  const year = $("fYear").value.trim();
  if (year && !/^\d{4}$/.test(year)) { show("formNotice", "Use quatro dígitos para o ano, por exemplo 2024."); return; }
  const coverRaw = $("fCoverUrl").value.trim();
  if (coverRaw && !safeHttps(coverRaw)) { show("formNotice", "O link da capa precisa começar com https://"); return; }
  const row = toRow({
    type: currentType(), title, creator: $("fCreator").value, year, by: $("fBy").value,
    status: $("fStat").value, rating: state.rating, notes: $("fNotes").value,
    synopsis: $("fSyn").value, genre: $("fGenre").value, coverUrl: coverRaw,
  });
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
  a.download = "estante-" + new Date().toISOString().slice(0, 10) + ".json";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});
$("importFile").addEventListener("change", async (ev) => {
  const file = ev.target.files[0]; ev.target.value = "";
  if (!file) return;
  let list;
  try { list = JSON.parse(await file.text()); } catch (e) { show("notice", "Este arquivo não é um JSON válido."); return; }
  if (!Array.isArray(list)) list = list && Array.isArray(list.items) ? list.items : [];
  const rows = list.filter((x) => x && typeof x === "object" && x.title && !x.example).map((x) => {
    const r = toRow(x);
    const when = x.created_at || x.createdAt;
    if (when && !isNaN(Date.parse(when))) r.created_at = new Date(when).toISOString();
    return r;
  });
  if (!rows.length) { show("notice", "Não encontrei títulos nesse arquivo."); return; }
  show("notice", "");
  for (let i = 0; i < rows.length; i += 100) {
    const { error } = await sb.from("items").insert(rows.slice(i, i + 100));
    if (error) { show("notice", "A importação parou no meio: " + dbError(error)); break; }
  }
  await loadItems();
  if ($("notice").hidden) { show("notice", ""); $("counts").textContent += ` · ${rows.length} importadas`; }
});

// ---------- toolbar ----------
$("tabs").addEventListener("click", (ev) => {
  const b = ev.target.closest(".tab"); if (!b) return;
  state.tab = b.dataset.type;
  try { localStorage.setItem("estante.tab", state.tab); } catch (e) {}
  render();
});
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
  if (changed) { state.loaded = false; render(); loadItems(); }
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
