// auth-farmacia.js
// Incluir em TODAS as páginas do AlvaroGest (login, app principal, etc.)
// depois do script do Supabase. Responsável por:
//   1. Descobrir a farmácia e o papel do utilizador autenticado.
//   2. Guardar esse contexto em sessão, para não repetir a consulta em
//      cada navegação dentro da mesma sessão do browser.
//   3. Aplicar a marca (cor primária, logótipo) da farmácia à página.

const AuthFarmacia = (() => {
  const CHAVE_SESSAO = "alvarogest_contexto_farmacia";

  // Vai à base de dados descobrir a que farmácia e com que papel o
  // utilizador autenticado pertence. Devolve null se não houver sessão ou
  // se o utilizador não estiver associado a nenhuma farmácia (não deveria
  // acontecer fora do fluxo de onboarding, mas mantemos a verificação).
  async function carregarContextoFarmacia(supabaseClient) {
    // Cache simples por sessão de browser, para não repetir o pedido em
    // cada página — só recarrega se ainda não tiver nada guardado.
    const emCache = sessionStorage.getItem(CHAVE_SESSAO);
    if (emCache) {
      return JSON.parse(emCache);
    }

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return null;

    const { data: perfil, error } = await supabaseClient
      .from("perfis_utilizador")
      .select("papel, farmacia:farmacias(id, nome, nif, razao_social, logo_url, cor_primaria)")
      .eq("user_id", user.id)
      .single();

    if (error || !perfil) return null;

    const contexto = {
      papel: perfil.papel,
      farmacia: perfil.farmacia,
    };

    sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(contexto));
    return contexto;
  }

  // Aplica a cor e o logótipo da farmácia à página actual.
  function aplicarMarca(farmacia) {
    if (!farmacia) return;

    if (farmacia.cor_primaria) {
      document.documentElement.style.setProperty("--cor-primaria", farmacia.cor_primaria);
    }

    const elementoLogo = document.getElementById("logo-farmacia");
    const elementoTitulo = document.getElementById("titulo");

    if (farmacia.logo_url && elementoLogo) {
      elementoLogo.src = farmacia.logo_url;
      elementoLogo.style.display = "block";
      if (elementoTitulo) elementoTitulo.style.display = "none";
    } else if (elementoTitulo) {
      elementoTitulo.textContent = farmacia.nome || "AlvaroGest";
    }
  }

  // Chamar isto no logout, para a próxima pessoa a usar o dispositivo não
  // herdar a marca/contexto da farmácia anterior.
  function limparContexto() {
    sessionStorage.removeItem(CHAVE_SESSAO);
  }

  return { carregarContextoFarmacia, aplicarMarca, limparContexto };
})();
