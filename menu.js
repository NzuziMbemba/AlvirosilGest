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
        <span class="mb-pilula" id="mb-nome"></span>
        <button class="mb-pilula" id="mb-sair">Sair</button>
      </div>
      <nav class="mb-abas">
        ${abas.map((a) => `<a href="${a.url}" class="${a.id === activo ? "activo" : ""}">${a.ico} ${a.nome}</a>`).join("")}
      </nav>`;

    document.getElementById("mb-nome").textContent = "👤 " + (nome || "");
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
