// Service worker simples do AlviroGest.
// Guarda em cache a "casca" da app (HTML/CSS/JS próprios), para abrir mais
// rápido e continuar a abrir mesmo com má ligação. Os dados em si (vendas,
// produtos, etc.) continuam sempre a vir do Supabase em tempo real — isto
// não torna o AlviroGest offline-first, só evita uma tela em branco.

const CACHE = "alvirogest-v1";

const FICHEIROS_ESSENCIAIS = [
  "login.html",
  "app.html",
  "produtos.html",
  "funcionarios.html",
  "configuracoes.html",
  "fecho-caixa.html",
  "balanco.html",
  "financas.html",
  "painel.html",
  "auth-farmacia.js",
  "vendus-integration.js",
  "menu.js",
  "manifest.json",
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FICHEIROS_ESSENCIAIS).catch(() => {
      // Se algum ficheiro da lista não existir neste repositório, não
      // bloqueia a instalação do resto — só esse ficheiro fica sem cache.
    })),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (evento) => {
  const url = new URL(evento.request.url);

  // Nunca mexer em pedidos ao Supabase — esses têm de ir sempre à rede,
  // para os dados estarem sempre actualizados.
  if (url.hostname.endsWith("supabase.co")) return;

  // Só trata pedidos GET de ficheiros deste mesmo site.
  if (evento.request.method !== "GET" || url.origin !== location.origin) return;

  evento.respondWith(
    caches.match(evento.request).then((resposta) =>
      resposta ||
      fetch(evento.request)
        .then((respostaRede) => {
          const copia = respostaRede.clone();
          caches.open(CACHE).then((cache) => cache.put(evento.request, copia));
          return respostaRede;
        })
        .catch(() => caches.match("login.html")),
    ),
  );
});
