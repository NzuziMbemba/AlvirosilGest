// Mostra erros no ecrã (útil para diagnosticar páginas em branco no telemóvel)
(function () {
  const mostrar = (msg) => {
    let b = document.getElementById("mb-erro");
    if (!b) { b = document.createElement("div"); b.id = "mb-erro";
      b.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:99;background:#c62828;color:#fff;padding:10px 12px;font:13px system-ui;white-space:pre-wrap";
      (document.body || document.documentElement).appendChild(b); }
    b.textContent = "⚠️ Erro: " + msg;
  };
  window.addEventListener("error", (e) => mostrar((e.message || "erro") + (e.filename ? " (" + e.filename.split("/").pop() + ":" + e.lineno + ")" : "")));
  window.addEventListener("unhandledrejection", (e) => mostrar((e.reason && e.reason.message) || String(e.reason)));
})();

// AlviroGest — barra superior + menu com emojis (partilhado entre páginas)
// Para acrescentar uma opção nova ao menu, basta juntar uma linha à lista ABAS.
(function () {
  const ABAS = [
    { id: "painel", ico: "📊", nome: "Painel", url: "painel.html", papeis: ["gerente", "farmaceutico"] },
    { id: "vendas", ico: "🛒", nome: "Caixa / PDV", url: "app.html", papeis: ["gerente", "farmaceutico", "caixa"] },
    { id: "produtos", ico: "📦", nome: "Produtos", url: "produtos.html", papeis: ["gerente", "farmaceutico"] },
    { id: "funcionarios", ico: "🧑‍💼", nome: "Funcionários", url: "funcionarios.html", papeis: ["gerente"] },
    { id: "pessoas", ico: "👥", nome: "Gestão de Pessoas", url: "pessoas.html", papeis: ["gerente"] },
    { id: "salarios", ico: "💰", nome: "Salários", url: "salarios.html", papeis: ["gerente"] },
    { id: "financas", ico: "💸", nome: "Finanças", url: "financas.html", papeis: ["gerente"] },
    { id: "balanco", ico: "⚖️", nome: "Balanço", url: "balanco.html", papeis: ["gerente"] },
    { id: "arquivo", ico: "📁", nome: "Arquivo", url: "arquivo.html", papeis: ["gerente", "farmaceutico", "caixa"] },
    { id: "documentos", ico: "📄", nome: "Documentos RH", url: "documentos-rh.html", papeis: ["gerente"] },
    { id: "configuracoes", ico: "⚙️", nome: "Configurações", url: "configuracoes.html", papeis: ["gerente"] },
  ];

  const CSS = `
    :root { --cor-primaria:#1b5e20; --fundo:#f4f6f4; --cartao:#fff; --texto:#222; --suave:#777; --borda:#eee; }
    html[data-tema="dark"] { --fundo:#101712; --cartao:#1a241d; --texto:#e8efe9; --suave:#9aaa9e; --borda:#2a372d; }
    body { background: var(--fundo); color: var(--texto); }
    .mb-topo { background: var(--cor-primaria); color:#fff; padding:10px 14px; display:flex; flex-wrap:wrap; align-items:center; gap:8px 10px; font-size:.75rem; }
    .mb-marca { display:flex; align-items:center; gap:8px; margin-right:auto; font-size:1rem; }
    .mb-marca img { max-height:30px; }
    .mb-pilula { background:rgba(255,255,255,.18); border:none; color:#fff; padding:6px 10px; border-radius:999px; font-size:.75rem; font-weight:600; }
    .mb-topo button { cursor:pointer; }
    .mb-abas { background:var(--cartao); display:flex; overflow-x:auto; white-space:nowrap; border-bottom:1px solid var(--borda); position:sticky; top:0; z-index:5; }
    .mb-abas a { padding:14px 14px 11px; text-decoration:none; color:var(--suave); font-size:.88rem; border-bottom:3px solid transparent; }
    .mb-abas a.activo { color:var(--cor-primaria); font-weight:700; border-bottom-color:var(--cor-primaria); }
    html[data-tema="dark"] .mb-abas a.activo { color:#7fd68a; border-bottom-color:#7fd68a; }
    html[data-tema="dark"] .painel { background:var(--cartao); color:var(--texto); }
    html[data-tema="dark"] input, html[data-tema="dark"] select, html[data-tema="dark"] textarea { background:var(--fundo); color:var(--texto); border-color:var(--borda); }
    html[data-tema="dark"] th, html[data-tema="dark"] td { border-bottom-color:var(--borda); }
    html[data-tema="dark"] th, html[data-tema="dark"] label { color:var(--suave); }
    html[data-tema="dark"] button.secundario { background:transparent; color:var(--texto); }
    html[data-tema="dark"] #folha, html[data-tema="dark"] #editor-corpo, html[data-tema="dark"] .barra { background:#fff; color:#222; }
  `;

  function guardar(chave, valor) { try { localStorage.setItem(chave, valor); } catch (_) {} }
  function ler(chave) { try { return localStorage.getItem(chave); } catch (_) { return null; } }

  function aplicarTema(tema) {
    document.documentElement.dataset.tema = tema;
    guardar("alvirogest-tema", tema);
    const b = document.getElementById("mb-tema");
    if (b) b.textContent = tema === "dark" ? "☀️" : "🌙";
  }

  function abrirConta() {
    if (document.getElementById("mb-conta")) return;
    const d = document.createElement("div");
    d.id = "mb-conta";
    d.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.5);display:grid;place-items:center;z-index:50;padding:16px";
    d.innerHTML = `<form style="background:var(--cartao);color:var(--texto);border-radius:14px;padding:18px;width:100%;max-width:380px;font-family:system-ui">
      <h3 style="margin:0 0 4px">🔑 Alterar palavra-passe</h3><p style="margin:0 0 10px;font-size:.82rem;color:var(--suave)">Mínimo de 8 caracteres.</p>
      <input id="mb-p1" type="password" autocomplete="new-password" placeholder="Nova palavra-passe" minlength="8" required style="width:100%;padding:10px;margin-bottom:8px;border:1px solid #ccc;border-radius:8px;font-size:1rem;background:var(--fundo);color:var(--texto)">
      <input id="mb-p2" type="password" autocomplete="new-password" placeholder="Repita a nova palavra-passe" minlength="8" required style="width:100%;padding:10px;border:1px solid #ccc;border-radius:8px;font-size:1rem;background:var(--fundo);color:var(--texto)">
      <div id="mb-pmsg" style="min-height:1.2em;font-size:.85rem;margin:8px 0"></div>
      <div style="display:flex;gap:8px"><button type="button" id="mb-pc" style="flex:1;padding:10px;border:1px solid #999;border-radius:8px;background:none;color:inherit;cursor:pointer">Cancelar</button>
      <button id="mb-pok" style="flex:1;padding:10px;border:none;border-radius:8px;background:var(--cor-primaria);color:#fff;font-weight:600;cursor:pointer">Guardar</button></div></form>`;
    document.body.appendChild(d);
    const msg = (t, ok) => { const e = document.getElementById("mb-pmsg"); e.textContent = t; e.style.color = ok ? "#1b7a2e" : "#c62828"; };
    document.getElementById("mb-pc").onclick = () => d.remove();
    d.querySelector("form").onsubmit = async (ev) => {
      ev.preventDefault();
      const p1 = document.getElementById("mb-p1").value, p2 = document.getElementById("mb-p2").value;
      if (p1.length < 8) return msg("Use pelo menos 8 caracteres.");
      if (p1 !== p2) return msg("As palavras-passe não coincidem.");
      document.getElementById("mb-pok").disabled = true;
      try {
        const cli = window.supabase.createClient("https://qillinntbhoecurnuheq.supabase.co", "sb_publishable_Qm5jmqjTg9qAK7df5KRwSQ_44ilsouh");
        const { error } = await cli.auth.updateUser({ password: p1 });
        if (error) throw error;
        msg("Palavra-passe alterada.", true);
        setTimeout(() => d.remove(), 1500);
      } catch (e) {
        msg(/different|same/i.test(e.message || "") ? "A nova palavra-passe tem de ser diferente da actual." : "Não foi possível alterar: " + (e.message || "erro"));
        document.getElementById("mb-pok").disabled = false;
      }
    };
  }

  function montar({ papel, activo, nome, aoSair }) {
    if (!document.getElementById("mb-estilo")) {
      const estilo = document.createElement("style");
      estilo.id = "mb-estilo";
      estilo.textContent = CSS;
      document.head.appendChild(estilo);
    }

    const abas = ABAS.filter((a) => a.papeis.includes(papel));
    const topo = document.getElementById("topo");
    topo.innerHTML = `
      <div class="mb-topo">
        <div class="mb-marca"><img id="logo-farmacia" style="display:none" alt=""><strong id="titulo">AlviroGest</strong></div>
        <span id="mb-data"></span><span id="mb-hora"></span>
        <span class="mb-pilula" id="mb-estado">☁️ Online</span>
        <button class="mb-pilula" id="mb-tema" aria-label="Mudar tema">🌙</button>
        <button class="mb-pilula" id="mb-nome" title="Alterar palavra-passe"></button>
        <button class="mb-pilula" id="mb-sair">Sair</button>
      </div>
      <nav class="mb-abas">
        ${abas.map((a) => `<a href="${a.url}" class="${a.id === activo ? "activo" : ""}">${a.ico} ${a.nome}</a>`).join("")}
      </nav>`;

    document.getElementById("mb-nome").textContent = "👤 " + (nome || "") + " ▾";
    document.getElementById("mb-nome").addEventListener("click", abrirConta);
    document.getElementById("mb-sair").addEventListener("click", aoSair);
    document.getElementById("mb-tema").addEventListener("click", () => {
      aplicarTema(document.documentElement.dataset.tema === "dark" ? "claro" : "dark");
    });
    aplicarTema(ler("alvirogest-tema") === "dark" ? "dark" : "claro");

    const relogio = () => {
      const agora = new Date();
      document.getElementById("mb-data").textContent = agora.toLocaleDateString("pt-AO");
      document.getElementById("mb-hora").textContent = agora.toLocaleTimeString("pt-AO");
    };
    relogio();
    setInterval(relogio, 1000);

    const estado = () => {
      document.getElementById("mb-estado").textContent = navigator.onLine ? "☁️ Online" : "📴 Sem ligação";
    };
    estado();
    window.addEventListener("online", estado);
    window.addEventListener("offline", estado);

    const aba = topo.querySelector("a.activo");
    if (aba) aba.scrollIntoView({ inline: "center", block: "nearest" });
  }

  window.MenuAlviro = { montar };
})();
