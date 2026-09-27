const AuthFarmacia = (() => {
  const CHAVE_SESSAO = "alvarogest_contexto_farmacia";

  async function carregarContextoFarmacia(supabaseClient) {
    const emCache = sessionStorage.getItem(CHAVE_SESSAO);
    if (emCache) {
      return JSON.parse(emCache);
    }

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return null;

    const { data: perfil, error } = await supabaseClient
      .from("perfis_utilizador")
      .select("papel, farmacia:farmacias(id, nome, nif, logo_url, cor_primaria)")
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
      elementoTitulo.textContent = farmacia.nome || "AlviroGest";
    }
  }

  function limparContexto() {
    sessionStorage.removeItem(CHAVE_SESSAO);
  }

  return { carregarContextoFarmacia, aplicarMarca, limparContexto };
})();
