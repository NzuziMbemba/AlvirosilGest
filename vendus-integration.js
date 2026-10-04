const VendusIntegration = (() => {
  // Nome próprio para o AlviroGest: o FarmaGest está no mesmo endereço (github.io)
  // e usava "farmagest_facturas_pendentes", o que misturava as duas filas.
  const FILA_CONTINGENCIA = "alvirogest_facturas_pendentes";

  async function chamarFuncaoEmissao(vendaId) {
    const { data, error } = await supabaseClient.functions.invoke(
      "emitir-factura-vendus",
      { body: { venda_id: vendaId } },
    );

    if (error) {
      throw new Error(`Falha a contactar a função de emissão: ${error.message}`);
    }
    return data;
  }

  async function emitirFactura(vendaId) {
    if (!navigator.onLine) {
      adicionarAFilaContingencia(vendaId);
      return { contingencia: true, motivo: "sem_rede" };
    }

    try {
      const resultado = await chamarFuncaoEmissao(vendaId);

      if (resultado.contingencia) {
        adicionarAFilaContingencia(vendaId);
        return { contingencia: true, motivo: "vendus_indisponivel", detalhe: resultado.detalhe };
      }

      return { contingencia: false, ...resultado.factura };
    } catch (erro) {
      console.error("[VendusIntegration] Erro ao emitir factura:", erro);
      adicionarAFilaContingencia(vendaId);
      return { contingencia: true, motivo: "erro_inesperado", detalhe: String(erro) };
    }
  }

  function lerFila() {
    try {
      return JSON.parse(localStorage.getItem(FILA_CONTINGENCIA) || "[]");
    } catch {
      return [];
    }
  }

  function gravarFila(fila) {
    localStorage.setItem(FILA_CONTINGENCIA, JSON.stringify(fila));
  }

  function adicionarAFilaContingencia(vendaId) {
    const fila = lerFila();
    if (!fila.includes(vendaId)) {
      fila.push(vendaId);
      gravarFila(fila);
    }
  }

  async function processarFilaContingencia() {
    const fila = lerFila();
    if (fila.length === 0) return { processadas: 0, restantes: 0 };

    const aindaPendentes = [];
    let processadas = 0;

    for (const vendaId of fila) {
      try {
        const resultado = await chamarFuncaoEmissao(vendaId);
        if (resultado.contingencia) {
          aindaPendentes.push(vendaId);
        } else {
          processadas++;
        }
      } catch {
        aindaPendentes.push(vendaId);
      }
    }

    gravarFila(aindaPendentes);
    return { processadas, restantes: aindaPendentes.length };
  }

  function numeroPendentes() {
    return lerFila().length;
  }

  window.addEventListener("online", () => {
    processarFilaContingencia().then(({ processadas, restantes }) => {
      if (processadas > 0) {
        console.log(`[VendusIntegration] ${processadas} factura(s) emitida(s) após reconexão. ${restantes} ainda pendente(s).`);
      }
    });
  });

  return {
    emitirFactura,
    processarFilaContingencia,
    numeroPendentes,
  };
})();
