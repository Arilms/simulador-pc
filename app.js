/* =========================================================
   COMPARADOR PC XEON x ATUAL: LOGICA
   Vanilla JavaScript, sem dependencias externas.
   ========================================================= */

/* ---------------------------------------------------------
   1) CONFIGURACOES EDITAVEIS  (mexa aqui, e so aqui)
   --------------------------------------------------------- */
const CONFIG = {
  // Cambio: quanto vale 1 dolar em reais. Pode ser mudado ao vivo no simulador.
  cotacaoDolar: 5.50,

  // Regras de imposto (Ceara). Edite se a legislacao mudar.
  aliquotaII: 0.60,           // Imposto de Importacao federal (compras ACIMA de US$ 50)
  aliquotaICMSate50: 0.20,    // ICMS na faixa ABAIXO de US$ 50 (por dentro)
  aliquotaICMSacima50: 0.20,  // ICMS na faixa ACIMA de US$ 50 (por dentro)
  descontoII_USD: 30,         // Desconto fixo no II para compras acima de US$ 50
  limiteIsencaoUSD: 50,       // Faixa em que NAO ha imposto federal
  limiteRemessaConforme_USD: 3000, // Acima disso vira importacao formal (tributos variam)

  // Fonte de dados no Google Sheets. Deixe sheetId vazio ("") para usar o dados.json local.
  // A planilha precisa estar compartilhada como "qualquer pessoa com o link pode ver".
  sheetId: "1a_FYjSv0y8omFbtdUCV5DZrC8nw4vKt_Tp6Gj_PUHxA",
  sheetName: "Base de Dados - Simulador PC (Xeon x Atual)"  // nome exato da aba
};

/* ---------------------------------------------------------
   2) ESTADO DA APLICACAO
   --------------------------------------------------------- */
let TODAS_AS_PECAS = [];   // lista carregada da planilha ou do JSON
const carrinho = [];       // itens escolhidos pelo usuario

/* Ajustes de simulacao, um por posicao do carrinho e sempre no mesmo indice.
   Fica FORA das pecas de proposito: o carrinho guarda referencias diretas do
   catalogo, entao marcar a peca sujaria o catalogo inteiro e ligaria dois
   itens iguais adicionados duas vezes. */
const ajustesCarrinho = [];   // { semImposto: bool, semFrete: bool }

function ajusteDoItem(indice) {
  return ajustesCarrinho[indice] || { semImposto: false, semFrete: false };
}

const ORDEM_CATEGORIAS = [
  "Processador", "Placa-mae", "Placa de Video", "Memoria RAM", "SSD",
  "Fonte", "Cooler", "Gabinete", "Fan", "Modulo TPM"
];
/* Cada categoria aponta para um <symbol> do sprite SVG que fica no index.html.
   Trocar de desenho = mexer so no sprite, sem tocar aqui. */
const ICONES = {
  "Processador":     "ico-processador",
  "Placa-mae":       "ico-placa-mae",
  "Placa de Video":  "ico-placa-video",
  "Memoria RAM":     "ico-memoria",
  "SSD":             "ico-ssd",
  "Fonte":           "ico-fonte",
  "Cooler":          "ico-cooler",
  "Modulo TPM":      "ico-tpm",
  "Gabinete":        "ico-gabinete",
  "Fan":             "ico-fan"
};

/* Monta a tag do icone SVG. Se a categoria nao tiver desenho, cai no generico. */
function iconeSVG(categoria, classe) {
  const id = ICONES[categoria] || "ico-generico";
  return `<svg class="${classe}" aria-hidden="true" focusable="false"><use href="#${id}"></use></svg>`;
}

/* Como falamos da procedencia da peca.
   "Importado" dava a entender que a peca ja tinha entrado no pais; ela ainda
   esta na China e quem importa e o comprador. Dai a linguagem em tempo certo. */
const ROTULO_ORIGEM = {
  china:  { selo: "Vem da China",  frase: "Você importa: a peça sai da China" },
  brasil: { selo: "Já no Brasil",  frase: "Pronta entrega no Brasil" }
};

/* Dominio de cada loja, para buscar o logotipo.
   Se a loja nao estiver na lista, o dominio sai do proprio link de compra. */
const DOMINIO_LOJA = {
  "aliexpress":    "aliexpress.com",
  "kabum":         "kabum.com.br",
  "pichau":        "pichau.com.br",
  "terabyte":      "terabyteshop.com.br",
  "terabyteshop":  "terabyteshop.com.br",
  "amazon":        "amazon.com.br",
  "mercado livre": "mercadolivre.com.br",
  "magalu":        "magazineluiza.com.br",
  "magazine luiza":"magazineluiza.com.br",
  "shopee":        "shopee.com.br",
  "banggood":      "banggood.com",
  "temu":          "temu.com"
};

/* OPCIONAL: se um dia quiser guardar os logotipos no seu proprio servidor
   (nao depender de servico de fora), crie a pasta "logos/" e preencha aqui:
   const LOGO_LOCAL = { "kabum": "logos/kabum.svg", "pichau": "logos/pichau.svg" };
   O codigo abaixo ja da preferencia a este mapa quando ele tem a loja. */
const LOGO_LOCAL = {};

function dominioDaLoja(peca) {
  const nome = (peca.loja || "").trim().toLowerCase();
  if (DOMINIO_LOJA[nome]) return DOMINIO_LOJA[nome];
  try {
    return new URL(peca.link_compra).hostname.replace(/^www\./, "");
  } catch (e) {
    return "";
  }
}

/* Logotipo da loja. Ordem de tentativa:
   1) arquivo local (LOGO_LOCAL), 2) favicon do dominio, 3) inicial da loja. */
function logoDaLoja(peca) {
  const nome = peca.loja || "Loja";
  const chave = nome.trim().toLowerCase();
  const inicial = nome.trim().charAt(0).toUpperCase() || "?";
  const local = LOGO_LOCAL[chave];
  const dominio = dominioDaLoja(peca);

  if (!local && !dominio) {
    return `<span class="loja__inicial" aria-hidden="true">${inicial}</span>`;
  }
  const src = local || `https://www.google.com/s2/favicons?domain=${dominio}&sz=64`;
  return `<img class="loja__logo" src="${src}" alt="" width="20" height="20"
               loading="lazy" onerror="logoFalhou(this, '${inicial}')">`;
}

/* Se o logotipo nao carregar, troca por um circulo com a inicial da loja. */
function logoFalhou(img, inicial) {
  const bolha = document.createElement("span");
  bolha.className = "loja__inicial";
  bolha.setAttribute("aria-hidden", "true");
  bolha.textContent = inicial;
  img.replaceWith(bolha);
}
window.logoFalhou = logoFalhou;
/* ---------------------------------------------------------
   COTACAO DO DOLAR AUTOMATICA
   Duas fontes gratuitas e sem cadastro. Se a primeira falhar,
   tenta a segunda; se as duas falharem, fica o valor fixo do
   CONFIG e o visitante pode digitar na mao.
   --------------------------------------------------------- */
const FONTES_COTACAO = [
  {
    nome: "open.er-api.com",
    url: "https://open.er-api.com/v6/latest/USD",
    ler: d => ({ valor: d && d.rates && d.rates.BRL, quando: d && d.time_last_update_utc })
  },
  {
    nome: "currency-api (jsDelivr)",
    url: "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
    ler: d => ({ valor: d && d.usd && d.usd.brl, quando: d && d.date })
  }
];

// Guarda se a cotacao em uso veio da internet ou foi digitada.
let COTACAO_AUTOMATICA = false;
// Se o visitante mexer no campo, paramos de sobrescrever o valor dele.
let cotacaoMexidaPeloVisitante = false;

async function buscarCotacaoDolar() {
  // Cache de 1 hora, para nao bater na API a cada recarga da pagina.
  try {
    const salvo = JSON.parse(sessionStorage.getItem("cotacaoDolarCache") || "null");
    if (salvo && Date.now() - salvo.buscadoEm < 3600000) return salvo;
  } catch (e) { /* sessionStorage bloqueado: segue sem cache */ }

  for (const fonte of FONTES_COTACAO) {
    try {
      const resp = await fetch(fonte.url, { cache: "no-store" });
      if (!resp.ok) continue;
      const { valor, quando } = fonte.ler(await resp.json());
      const n = Number(valor);
      // Sanidade: se vier algo fora de R$ 1 a R$ 50, e resposta quebrada. Descarta.
      if (!isFinite(n) || n < 1 || n > 50) continue;
      const resultado = { valor: Number(n.toFixed(4)), quando: quando || "", fonte: fonte.nome, buscadoEm: Date.now() };
      try { sessionStorage.setItem("cotacaoDolarCache", JSON.stringify(resultado)); } catch (e) {}
      return resultado;
    } catch (e) { /* tenta a proxima fonte */ }
  }
  return null;
}

async function aplicarCotacaoAutomatica() {
  const campo = document.getElementById("inputCotacao");
  const aviso = document.getElementById("avisoCotacao");
  const resultado = await buscarCotacaoDolar();

  if (!resultado) {
    if (aviso) {
      aviso.textContent = "Não foi possível buscar a cotação agora. Está usando R$ " +
        CONFIG.cotacaoDolar.toFixed(2).replace(".", ",") + ". Você pode ajustar acima.";
      aviso.classList.add("carrinho__cotacao-aviso--falhou");
    }
    return;
  }
  if (cotacaoMexidaPeloVisitante) return; // respeita o valor digitado

  CONFIG.cotacaoDolar = resultado.valor;
  COTACAO_AUTOMATICA = true;
  if (campo) campo.value = resultado.valor.toFixed(2);
  if (aviso) {
    aviso.textContent = "Cotação de hoje, buscada automaticamente. " +
      "Em compra no cartão ainda entram o IOF e o spread do banco.";
    aviso.classList.remove("carrinho__cotacao-aviso--falhou");
  }
  montarPagina("xeon", "listaXeon");
  montarPagina("atual", "listaAtual");
  atualizarCarrinho();
}

/* =========================================================
   DICIONARIO DE SELOS (badges)
   -----------------------------------------------------
   A chave da esquerda e EXATAMENTE o que esta na coluna "nivel"
   da planilha. O objeto da direita diz o que aparece na tela.

   - texto: o titulo amigavel que o visitante le
   - cor:   nome do tema visual; vira a classe CSS "selo--<cor>".
            Varias chaves podem dividir a mesma cor.
   - tipo:  "nivel" (padrao, selo preenchido) ou "compat"
            (etiqueta vazada, para dizer com o que a peca casa)

   Para criar um selo novo: acrescente uma linha aqui e, se a cor
   for inedita, uma regra ".selo--<cor>" no estilo.css. Nada mais.
   ========================================================= */
const BADGES = {
  // ---- Hardware geral: processador, placa-mae, GPU, RAM, SSD, fonte, cooler
  "entrada":         { texto: "Modelo de Entrada", cor: "entrada" },
  "custo-beneficio": { texto: "Custo-Benefício",   cor: "custo" },
  "alto-desempenho": { texto: "Alto Desempenho",   cor: "alto" },

  // ---- Gabinetes: o criterio e estetica/refrigeracao, nao potencia
  "gabinete-basico":  { texto: "Design Tradicional",            cor: "neutro" },
  "gabinete-airflow": { texto: "Máxima Refrigeração (Airflow)", cor: "ar" },
  "gabinete-aquario": { texto: "Estilo Aquário Panorâmico",     cor: "agua" },

  // ---- Fans
  "fan-led-fixo": { texto: "Conexão Direta (LED Fixo)",  cor: "neutro" },
  "fan-argb-hub": { texto: "Kit RGB Completo (Com Hub)", cor: "rgb" },
  "fan-premium":  { texto: "Refrigeração Premium",       cor: "premium" },

  // ---- Modulo TPM: aqui o "nivel" nao e qualidade, e compatibilidade.
  //      Por isso o tipo "compat", que muda o desenho do selo.
  "qiyida-h9s-machinist-mr9a": { texto: "Para Qiyida / MR9A", cor: "compat", tipo: "compat" },
  "machinist-v9s":             { texto: "Para Machinist V9S", cor: "compat", tipo: "compat" },

  // ---- Legado: linhas antigas da planilha que ainda usam "barata".
  //      Mantido de proposito para nada sumir da tela durante a migracao.
  "barata": { texto: "Modelo de Entrada", cor: "entrada" }
};

// Avisa uma vez por chave desconhecida. Ajuda a achar erro de digitacao na planilha.
const _chavesDeSeloDesconhecidas = new Set();

/* Transforma "gabinete-airflow" em "Gabinete Airflow", para a chave
   desconhecida ainda mostrar algo legivel em vez de sumir. */
function humanizarChave(chave) {
  return String(chave).replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim()
    .replace(/\b\p{L}/gu, c => c.toUpperCase());
}

/* Devolve a definicao do selo, ou um selo padrao se a chave nao existir. */
function definicaoDoSelo(chave) {
  const k = String(chave || "").trim().toLowerCase();
  if (!k) return null;
  if (BADGES[k]) return BADGES[k];

  if (!_chavesDeSeloDesconhecidas.has(k)) {
    _chavesDeSeloDesconhecidas.add(k);
    console.warn(`[selos] A chave "${k}" da coluna "nivel" nao esta no BADGES. ` +
                 `Mostrando um selo padrao. Confira a grafia na planilha.`);
  }
  return { texto: humanizarChave(k), cor: "neutro", desconhecido: true };
}

/* Monta o HTML do selo. Devolve "" quando a peca nao tem nivel. */
function montarSelo(chave, classeBase) {
  const def = definicaoDoSelo(chave);
  if (!def) return "";
  const tipo = def.tipo === "compat" ? " selo--tipo-compat" : "";
  return `<span class="${classeBase} selo selo--${def.cor}${tipo}">${def.texto}</span>`;
}

/* =========================================================
   MODULO TPM: venda casada com a placa-mae
   -----------------------------------------------------
   Regra de negocio: o TPM so existe no PC Chines (os processadores
   atuais ja trazem fTPM embutido) e so pode ser oferecido depois que
   o visitante escolheu a placa-mae, porque o encaixe e especifico.

   A tabela abaixo liga o NOME da placa a chave do TPM. Cada regra so
   vale se TODOS os termos aparecerem no nome, entao "MACHINIST MR9A PRO"
   e "Machinist mr9a" caem na mesma regra, e "MACHINIST V9S" nao e
   confundida com a MR9A. Para suportar uma placa nova, basta uma linha.
   ========================================================= */
/* =========================================================
   COMPATIBILIDADE PROCESSADOR x PLACA-MAE
   -----------------------------------------------------
   Nao basta separar "Intel" de "AMD": um Ryzen 5 5600 e AMD e uma
   B650M tambem e AMD, mas o 5600 e soquete AM4 e a B650M e AM5:
   nao encaixam de jeito nenhum. Entao a conta e feita por SOQUETE.

   Ha duas formas de dizer qual e o soquete de cada peca:

   (A) COLUNA "plataforma" NA PLANILHA (recomendado)
       Crie uma coluna chamada "plataforma" e escreva o soquete:
       AM4, AM5, LGA1700, LGA1851, LGA1200, LGA2011-3...
       E o jeito certo: voce escreve uma vez e nunca mais erra.

   (B) ADIVINHACAO PELO NOME (usada quando a coluna nao existe)
       As regras abaixo leem o nome da peca. Funcionam para os modelos
       comuns, mas nome fora do padrao nao e reconhecido. Nesse caso
       a peca NUNCA some da lista, so deixa de participar do filtro.
       Preferi errar mostrando demais a esconder a peca certa.
   ========================================================= */

const CATEGORIAS_PLATAFORMA = ["Processador", "Placa-mae"];

/* Chipsets de placa-mae. E o sinal mais confiavel que existe num nome. */
const CHIPSETS = {
  "AM4":       ["a320", "b350", "b450", "a520", "b550", "x370", "x470", "x570"],
  "AM5":       ["a620", "b650", "b840", "b850", "x670", "x870"],
  "LGA1200":   ["h410", "b460", "h510", "b560", "z490", "z590"],
  "LGA1700":   ["h610", "b660", "b760", "h770", "z690", "z790"],
  "LGA1851":   ["h810", "b860", "z890"],
  "LGA2011-3": ["x99"]
};

function normalizarPlataforma(texto) {
  const t = normalizarTexto(texto).replace(/[\s_]/g, "");
  if (!t) return null;
  if (t.includes("2011")) return "LGA2011-3";
  if (t === "am4" || t === "am5") return t.toUpperCase();
  const m = t.match(/lga?(\d{3,4})/);
  if (m) return "LGA" + m[1];
  if (/^\d{4}$/.test(t)) return "LGA" + t;
  return texto ? String(texto).trim().toUpperCase() : null;
}

/* Adivinha o soquete pelo nome da peca. Devolve null quando nao tem certeza. */
function plataformaPeloNome(peca) {
  const nome = normalizarTexto(peca.nome);

  // 1) chipset escrito no nome (placas-mae)
  for (const [plataforma, codigos] of Object.entries(CHIPSETS)) {
    if (codigos.some(c => nome.includes(c))) return plataforma;
  }

  // 2) soquete escrito no nome, em qualquer peca
  if (/\bam5\b/.test(nome)) return "AM5";
  if (/\bam4\b/.test(nome)) return "AM4";
  const lga = nome.match(/lga\s?(\d{3,4})/);
  if (lga) return "LGA" + lga[1];

  // 3) Xeon E5 v3/v4 e a plataforma X99
  if (nome.includes("xeon") && /e5-\d{4}\s?v[34]/.test(nome)) return "LGA2011-3";

  // 4) Ryzen: o primeiro digito do modelo diz a geracao.
  //    1000 a 5000 = AM4 | 7000, 8000 e 9000 = AM5. (Nao existe serie 6000 de desktop.)
  const ryzen = nome.match(/ryzen\s*[3579]?\s*(\d{4})/);
  if (ryzen) {
    const geracao = Number(ryzen[1][0]);
    if (geracao >= 1 && geracao <= 5) return "AM4";
    if (geracao >= 7 && geracao <= 9) return "AM5";
  }

  // 5) Intel Core Ultra = LGA1851
  if (/core\s*ultra/.test(nome)) return "LGA1851";

  // 6) Intel Core iN-XXXXX: os primeiros digitos sao a geracao
  const core = nome.match(/i[3579][\s-]*(\d{4,5})/);
  if (core) {
    const n = core[1];
    const ger = n.length === 5 ? Number(n.slice(0, 2)) : Number(n[0]);
    if (ger >= 12 && ger <= 14) return "LGA1700";
    if (ger === 10 || ger === 11) return "LGA1200";
    if (ger === 8 || ger === 9) return "LGA1151";
  }
  return null;
}

function plataformaDaPeca(peca) {
  if (!peca) return null;
  if (peca.plataforma) return normalizarPlataforma(peca.plataforma);
  return plataformaPeloNome(peca);
}

/* "AM5" -> "soquete AM5". So para a frase ficar legivel. */
function nomePlataforma(plataforma) {
  return plataforma ? `soquete ${plataforma}` : "";
}

/* A plataforma que o visitante ja travou nessa pagina, se travou.
   Vale tanto escolhendo o processador quanto escolhendo a placa antes:
   a primeira peca escolhida e que manda. */
function plataformaEscolhida(pagina) {
  for (const peca of carrinho) {
    if ((peca.pagina || "").toLowerCase() !== pagina) continue;
    if (!CATEGORIAS_PLATAFORMA.includes(peca.categoria)) continue;
    const plataforma = plataformaDaPeca(peca);
    if (plataforma) return { plataforma, peca };
  }
  return null;
}

/* Filtra as pecas de uma categoria pela plataforma travada.
   Peca de plataforma desconhecida passa sempre: melhor mostrar demais
   do que esconder a peca certa por causa de um nome fora do padrao. */
function filtrarPorPlataforma(pecas, travada, categoria) {
  if (!travada) return pecas;
  /* A categoria que travou a plataforma NAO se filtra a si mesma: senao,
     escolhido um processador AM4, os outros soquetes sumiam da lista de
     processadores e ficava impossivel trocar de ideia sem remover a peca. */
  if (categoria && travada.peca.categoria === categoria) return pecas;
  return pecas.filter(p => {
    const plat = plataformaDaPeca(p);
    return !plat || plat === travada.plataforma;
  });
}

/* Peca no carrinho que nao encaixa na plataforma travada (veio de um link
   antigo, ou o visitante trocou o processador depois). */
function conflitosDePlataforma(pagina) {
  const travada = plataformaEscolhida(pagina);
  if (!travada) return [];
  return carrinho.filter(p =>
    (p.pagina || "").toLowerCase() === pagina &&
    CATEGORIAS_PLATAFORMA.includes(p.categoria) &&
    p !== travada.peca &&
    plataformaDaPeca(p) &&
    plataformaDaPeca(p) !== travada.plataforma);
}

/* ---------------------------------------------------------
   TIPO DE MEMORIA (DDR4 x DDR5)
   -----------------------------------------------------
   Quem decide o tipo de memoria e a PLACA-MAE, nao o processador.
   Isso importa no LGA1700, que existe em versao DDR4 e em versao DDR5:
   o mesmo i5-12400 aceita as duas, dependendo da placa que voce comprar.

   Entao:
   - placa-mae ja escolhida -> a memoria segue o tipo dela (resposta exata)
   - so o processador escolhido -> olhamos as placas daquele soquete que
     existem no SEU catalogo e aceitamos os tipos que elas usam. Se voce so
     cadastrou placas LGA1700 DDR4, so aparece DDR4, sem precisar configurar
     nada. Cadastrou uma DDR5 depois, ela passa a aparecer sozinha.
   --------------------------------------------------------- */

const CATEGORIA_MEMORIA = "Memoria RAM";
const CATEGORIA_GPU = "Placa de Video";

/* Marcador de "vou usar o video integrado e pular a placa de video". */
const videoIntegrado = { xeon: false, atual: false };

/* A etapa da placa de video so pode ser pulada se o processador tiver video
   integrado. ATENCAO: o Xeon E5 NAO TEM. E peca de servidor, e o video vinha
   de um chip da propria placa de servidor. Sem placa de video dedicada, um PC
   com Xeon nao da imagem nenhuma. Por isso a opcao nunca aparece la.

   No PC Nacional o padrao e ter (os processadores cadastrados tem), mas da
   para dizer o contrario numa peca especifica: coluna "video_integrado" com
   "nao" (util para um Ryzen 5600 ou 5700X, que nao tem video). */
function temVideoIntegrado(pagina) {
  if (pagina !== "atual") return false;

  const cpu = carrinho.find(p =>
    (p.pagina || "").toLowerCase() === pagina && p.categoria === "Processador");
  if (!cpu) return true; // ninguem escolheu ainda: oferece, o catalogo e todo iGPU

  const marcado = normalizarTexto(cpu.video_integrado || cpu.videoIntegrado || "");
  if (["nao", "n", "0", "false", "sem"].includes(marcado)) return false;
  return true;
}

function alternarVideoIntegrado(pagina) {
  videoIntegrado[pagina] = !videoIntegrado[pagina];

  // Ao dizer que vai de video integrado, a GPU escolhida sai do simulador.
  if (videoIntegrado[pagina]) {
    for (let i = carrinho.length - 1; i >= 0; i--) {
      if ((carrinho[i].pagina || "").toLowerCase() === pagina &&
          carrinho[i].categoria === CATEGORIA_GPU) {
        carrinho.splice(i, 1);
        ajustesCarrinho.splice(i, 1);
      }
    }
  }
  atualizarCarrinho();
}

/* Reserva, usada so quando nao ha placa cadastrada para o soquete. */
const MEMORIA_PADRAO = {
  "AM4": ["DDR4"], "AM5": ["DDR5"],
  "LGA1200": ["DDR4"], "LGA1151": ["DDR4"],
  "LGA1700": ["DDR4", "DDR5"], "LGA1851": ["DDR5"],
  "LGA2011-3": ["DDR4"]
};

/* Le a coluna "memoria" da planilha, ou acha DDR4/DDR5 no nome. */
function tipoMemoria(peca) {
  if (!peca) return null;
  const daColuna = normalizarTexto(peca.memoria || peca.ddr || "");
  const alvo = daColuna || normalizarTexto(peca.nome);
  const m = alvo.match(/ddr\s?([345])/);
  return m ? "DDR" + m[1] : null;
}

/* Tipos de memoria aceitos, dado o que ja esta no simulador. */
function memoriasAceitas(pagina) {
  const placa = carrinho.find(p =>
    (p.pagina || "").toLowerCase() === pagina && p.categoria === "Placa-mae");

  // 1) A placa escolhida manda.
  const daPlaca = tipoMemoria(placa);
  if (daPlaca) return { tipos: [daPlaca], motivo: placa };

  const travada = plataformaEscolhida(pagina);
  if (!travada) return null;

  // 2) Sem placa: os tipos das placas do catalogo com aquele soquete.
  const doCatalogo = [...new Set(TODAS_AS_PECAS
    .filter(p => p.categoria === "Placa-mae" && plataformaDaPeca(p) === travada.plataforma)
    .map(tipoMemoria).filter(Boolean))];

  const tipos = doCatalogo.length ? doCatalogo : (MEMORIA_PADRAO[travada.plataforma] || []);
  return tipos.length ? { tipos, motivo: travada.peca } : null;
}

/* Memoria de tipo desconhecido passa sempre, como no filtro de soquete. */
function filtrarMemorias(pecas, aceitas) {
  if (!aceitas) return pecas;
  return pecas.filter(p => {
    const t = tipoMemoria(p);
    return !t || aceitas.tipos.includes(t);
  });
}

const CATEGORIA_TPM = "Modulo TPM";

/* =========================================================
   LISTA ORCAMENTARIA DAS RECOMENDACOES
   -----------------------------------------------------
   E a montagem que voce indica no guia, ja pronta, para o visitante
   abrir com um clique em vez de ir catando peca por peca.

   Ha DUAS formas de manter essa lista. A primeira e melhor:

   (A) COLUNA NA PLANILHA (recomendado)
       Crie uma coluna chamada "recomendado" e escreva "sim" (ou "x", "1")
       nas pecas que entram. Assim voce nunca mais mexe neste arquivo:
       trocou de peca na planilha, a lista muda sozinha.

   (B) LISTA DE NOMES AQUI EMBAIXO (usada quando a coluna nao existe)
       Os nomes tem de bater com a coluna "nome" da planilha. Se voce
       renomear a peca la, lembre de renomear aqui tambem.
   ========================================================= */
const RECOMENDACOES = {
  xeon: [
    "Intel Xeon E5-2650 v4",
    "Placa-mãe X99 MACHINIST V9S",
    "SOYO AMD Radeon RX 580 8GB",
    "8GB DDR4 ECC REG 2400MHz",
    "Kingston 500GB NVMe M.2 Leitura: 5000 MB/s e Gravação: 3000 MB/s",
    "Fonte Gamemax 600w 80 Plus White Pfc Ativo Preta",
    "Aircooler Redragon Tyr (CC-9104B)",
    "Gabinete Gamer Liketec Pinos (Frontal Madeira)",
    "Kit 3 Ventoinhas Rise Mode X Led Rainbow (Branco)",
    "Módulo TPM 2.0 ASUS (14 Pinos)"
  ],
  // Para criar a lista do PC Nacional, basta preencher aqui do mesmo jeito
  // (ou marcar "sim" na coluna "recomendado" da planilha).
  atual: []
};

/* A coluna "recomendado" esta preenchida para esta pagina? */
function temColunaRecomendado(pagina) {
  return TODAS_AS_PECAS.some(p =>
    (p.pagina || "").toLowerCase() === pagina && ehSim(p.recomendado));
}

function ehSim(valor) {
  const v = normalizarTexto(valor).trim();
  return ["sim", "s", "x", "1", "true", "verdadeiro"].includes(v);
}

/* Acha a peca pelo nome. Primeiro tenta o nome exato (ignorando acento e
   caixa); se nao achar, aceita que um contenha o outro. Assim uma diferenca
   boba tipo "8GB DDR4 ECC REG 2400MHz (servidor)" ainda casa. */
function acharPecaPorNome(nome, pagina) {
  const alvo = normalizarTexto(nome);
  const daPagina = TODAS_AS_PECAS.filter(p => (p.pagina || "").toLowerCase() === pagina);

  const exata = daPagina.find(p => normalizarTexto(p.nome) === alvo);
  if (exata) return exata;

  return daPagina.find(p => {
    const n = normalizarTexto(p.nome);
    return n.includes(alvo) || alvo.includes(n);
  }) || null;
}

/* As pecas recomendadas de uma pagina, ja na ordem das categorias.
   Devolve tambem o que nao foi encontrado, para voce conseguir corrigir. */
function pecasRecomendadas(pagina) {
  let achadas, faltando = [];

  if (temColunaRecomendado(pagina)) {
    // (A) planilha manda
    achadas = TODAS_AS_PECAS.filter(p =>
      (p.pagina || "").toLowerCase() === pagina && ehSim(p.recomendado));
  } else {
    // (B) lista de nomes deste arquivo
    achadas = [];
    (RECOMENDACOES[pagina] || []).forEach(nome => {
      const peca = acharPecaPorNome(nome, pagina);
      if (peca) achadas.push(peca); else faltando.push(nome);
    });
  }

  // Mesma ordem das secoes do site, para a lista sair na sequencia de montagem.
  achadas.sort((a, b) =>
    ORDEM_CATEGORIAS.indexOf(a.categoria) - ORDEM_CATEGORIAS.indexOf(b.categoria));

  return { achadas, faltando };
}

/* Abre a lista orcamentaria ja montada com as recomendacoes.
   Nao mexe no que o visitante montou: o simulador dele fica intacto. */
/* Esconde o botao da lista pronta quando nao ha o que mostrar, por exemplo
   se a planilha nao carregou. Melhor o botao nao existir do que existir e
   dar erro quando o visitante clica. */
function atualizarBotoesRecomendacao() {
  document.querySelectorAll("[data-lista-recomendada]").forEach(botao => {
    const bloco = botao.closest(".guia__rodape") || botao;
    const { achadas } = pecasRecomendadas(botao.dataset.listaRecomendada);
    bloco.hidden = achadas.length === 0;
  });
}

function abrirListaRecomendada(pagina) {
  const { achadas, faltando } = pecasRecomendadas(pagina);

  if (faltando.length) {
    console.warn(`[recomendacoes] Nao encontrei na planilha: ${faltando.join(" | ")}. ` +
                 `Confira se o nome esta igual na coluna "nome".`);
  }
  if (achadas.length === 0) {
    console.error("[recomendacoes] Nenhuma peca recomendada foi encontrada para a pagina " + pagina);
    alert("Não consegui montar a lista de recomendações agora. Tente recarregar a página.");
    return;
  }

  // Recomendacao nao tem frete/imposto desligado: vai a conta cheia.
  const semAjustes = achadas.map(() => ({ semImposto: false, semFrete: false }));
  const pacote = montarPacoteOrcamento(achadas, semAjustes);
  pacote.tipo = "recomendacoes";
  // Se alguma peca da recomendacao nao esta mais na planilha, o visitante
  // PRECISA saber: senao ele monta um PC faltando peca sem perceber.
  pacote.faltando = faltando;
  pacote.tituloLista = pagina === "xeon"
    ? "Minhas recomendações para o PC Chinês"
    : "Minhas recomendações para o PC Nacional";
  pacote.link = montarLinkRecomendacoes(pagina);

  sessionStorage.setItem("orcamentoPC", JSON.stringify(pacote));
  window.open("orcamento.html", "_blank");
}

const TPM_POR_PLACA = [
  { termos: ["qiyida", "h9s"],     chave: "qiyida-h9s-machinist-mr9a" },
  { termos: ["machinist", "mr9a"], chave: "qiyida-h9s-machinist-mr9a" },
  { termos: ["machinist", "v9s"],  chave: "machinist-v9s" }
];

/* Tira acento e caixa, para a comparacao nao depender de como foi digitado. */
function normalizarTexto(texto) {
  return String(texto || "").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/* A placa-mae do PC Chines que ja esta no simulador (ou null). */
function placaMaeEscolhida() {
  return carrinho.find(p =>
    (p.pagina || "").toLowerCase() === "xeon" && p.categoria === "Placa-mae") || null;
}

/* Qual chave de TPM essa placa pede. */
function chaveTPMdaPlaca(placa) {
  if (!placa) return null;
  const nome = normalizarTexto(placa.nome);
  const regra = TPM_POR_PLACA.find(r => r.termos.every(t => nome.includes(t)));
  return regra ? regra.chave : null;
}

/* Os modulos TPM cadastrados que servem nessa chave. */
function tpmsCompativeis(chave) {
  if (!chave) return [];
  return TODAS_AS_PECAS.filter(p =>
    p.categoria === CATEGORIA_TPM &&
    (p.pagina || "").toLowerCase() === "xeon" &&
    normalizarTexto(p.nivel) === chave);
}

function tpmNoCarrinho() {
  return carrinho.find(p => p.categoria === CATEGORIA_TPM) || null;
}

/* Estado do TPM em uma unica funcao, para a tela e o carrinho lerem o mesmo.
   Evita a regra ficar espalhada e sair de sincronia. */
function estadoTPM() {
  const placa = placaMaeEscolhida();
  const chave = chaveTPMdaPlaca(placa);
  const noCarrinho = tpmNoCarrinho();
  const compativeis = tpmsCompativeis(chave);
  const casaComAPlaca = !noCarrinho || (chave && normalizarTexto(noCarrinho.nivel) === chave);
  return { placa, chave, compativeis, noCarrinho, casaComAPlaca };
}

/* Nome da categoria como o visitante le, com acento.
   ATENCAO: a chave da esquerda tem de continuar EXATAMENTE igual a coluna
   "categoria" da planilha (sem acento). Quem muda e so o texto da direita,
   que aparece na tela. Nao acentue as chaves, senao a peca deixa de casar. */
const NOME_CATEGORIA = {
  "Placa-mae":      "Placa-mãe",
  "Memoria RAM":    "Memória RAM",
  "Placa de Video": "Placa de vídeo",
  "Modulo TPM":     "Módulo TPM"
};

function nomeCategoria(categoria) {
  return NOME_CATEGORIA[categoria] || categoria || "";
}

/* ---------------------------------------------------------
   3) CARREGAMENTO DOS DADOS (Google Sheets ou dados.json)
   --------------------------------------------------------- */
async function carregarDados() {
  if (CONFIG.sheetId) {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${CONFIG.sheetId}` +
                  `/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(CONFIG.sheetName)}`;
      const resp = await fetch(url);
      const texto = await resp.text();
      // O Google embrulha a resposta em "google.visualization...(...)". Removemos o embrulho:
      const json = JSON.parse(texto.substring(texto.indexOf("{"), texto.lastIndexOf("}") + 1));
      return normalizarPecas(converterPlanilha(json));
    } catch (erro) {
      console.warn("Não foi possível ler o Google Sheets. Usando dados.json.", erro);
    }
  }
  // Plano B: arquivo local dados.json
  const resp = await fetch("dados.json");
  return normalizarPecas(await resp.json());
}

/* Limpa o conteudo de uma celula.
   Planilha e cheia de armadilha invisivel: espaco no fim, espaco de largura
   zero (U+200B, que sobra quando a gente "apaga" com espaco em vez de Delete)
   e BOM. Nada disso aparece na tela, mas quebra comparacao de texto: um nivel
   com espaco invisivel deixa de ser vazio e vira uma etiqueta fantasma no card. */
function limparCelula(valor) {
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "number") return valor;
  return String(valor).replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
}

/* Chave unica de cada peca: pagina + id.
   Assim, mesmo que a planilha repita o id 1 no xeon e no atual, o simulador
   nunca troca uma peca pela outra. */
function chaveDaPeca(peca) {
  return `${(peca.pagina || "").toLowerCase()}::${peca.id}`;
}

/* Passa toda a lista pela limpeza e descarta linha sem nome (comecada e
   nao terminada na planilha), que senao viraria um card vazio de R$ 0,00. */
function normalizarPecas(lista) {
  return (Array.isArray(lista) ? lista : [])
    .map(item => {
      const limpo = {};
      Object.keys(item).forEach(k => { limpo[k] = limparCelula(item[k]); });
      return limpo;
    })
    .filter(item => String(item.nome || "").length > 0);
}

// Converte a resposta do Google Sheets (gviz) em uma lista de objetos simples.
function converterPlanilha(json) {
  const colunas = json.table.cols.map(c => (c.label || "").trim().toLowerCase());
  return json.table.rows
    .map(linha => {
      const obj = {};
      linha.c.forEach((celula, i) => {
        const chave = colunas[i];
        if (!chave) return;
        obj[chave] = celula ? celula.v : "";
      });
      return obj;
    });
}

/* ---------------------------------------------------------
   4) CALCULO DE IMPOSTOS (por item)
   Retorna sempre valores em REAIS: { base, impostos, total }
   --------------------------------------------------------- */
function calcularImposto(peca) {
  const moeda = (peca.moeda || "BRL").toUpperCase();
  const origem = (peca.origem || "brasil").toLowerCase();
  const preco = Number(peca.preco) || 0;
  const frete = Number(peca.frete) || 0;

  // Peca nacional (Brasil): imposto ja embutido no preco de varejo.
  // O frete, quando preenchido na planilha, entra no total (antes era ignorado).
  if (origem !== "china") {
    const produto = moeda === "USD" ? preco * CONFIG.cotacaoDolar : preco;
    const freteNacional = moeda === "USD" ? frete * CONFIG.cotacaoDolar : frete;
    const baseBRL = produto + freteNacional;
    return { base: baseBRL, impostos: 0, total: baseBRL,
             produtoBRL: produto, freteBRL: freteNacional, foraRemessa: false };
  }

  // Peca importada (AliExpress). Preco vem em dolar.
  const precoUSD = moeda === "USD" ? preco : preco / CONFIG.cotacaoDolar;
  const produtoBRL = precoUSD * CONFIG.cotacaoDolar;
  const freteBRL = moeda === "USD" ? frete * CONFIG.cotacaoDolar : frete;

  // Acima de US$ 3.000 sai do regime simplificado (Remessa Conforme) e vira
  // importacao formal, com tributos que variam por produto. Sinalizamos isso.
  const foraRemessa = precoUSD > CONFIG.limiteRemessaConforme_USD;

  if (precoUSD < CONFIG.limiteIsencaoUSD) {
    // ABAIXO de US$ 50: sem imposto federal. So ICMS "por dentro".
    // (frete costuma ser 0 nesses itens; se houver, entra na base do ICMS)
    const fatorICMS = 1 - CONFIG.aliquotaICMSate50; // ex.: 0,80 para ICMS de 20%
    const base = produtoBRL + freteBRL;
    const total = base / fatorICMS;
    return { base, impostos: total - base, total, foraRemessa: false, produtoBRL, freteBRL };
  } else {
    // ACIMA de US$ 50 (Remessa Conforme, ate US$ 3.000):
    // 1) Imposto Federal (II) = (Produto + Frete) x 60%
    // 2) Desconto fixo de US$ 30 sobre o II (nunca deixa o II negativo)
    // 3) ICMS "por dentro" = (Produto + Frete + II ja descontado) / (1 - ICMS)
    // 4) Valor final = Produto + Frete + II + ICMS
    const fatorICMS = 1 - CONFIG.aliquotaICMSacima50; // ex.: 0,80 para ICMS de 20%
    const baseSemImposto = produtoBRL + freteBRL;
    const iiBruto = baseSemImposto * CONFIG.aliquotaII;
    const descontoBRL = CONFIG.descontoII_USD * CONFIG.cotacaoDolar;
    const ii = Math.max(0, iiBruto - descontoBRL);
    const baseComII = baseSemImposto + ii;
    const total = baseComII / fatorICMS;
    return { base: baseSemImposto, impostos: total - baseSemImposto, total, foraRemessa, produtoBRL, freteBRL };
  }
}

/* ---------------------------------------------------------
   5) FORMATACAO
   --------------------------------------------------------- */
const reais = n => "R$ " + Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dolar = n => "US$ " + Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ---------------------------------------------------------
   6) RENDERIZACAO DAS PECAS
   --------------------------------------------------------- */
/* Miolo da secao do TPM. Fica separado porque muda toda vez que o
   visitante mexe na placa-mae, sem precisar redesenhar a pagina toda. */
function miolodaSecaoTPM() {
  const { placa, chave, compativeis } = estadoTPM();

  if (!placa) {
    return `<p class="dependencia">
      <strong>Escolha primeiro a placa-mãe.</strong>
      O módulo TPM encaixa num conector específico, então ele só aparece depois que
      você escolher a placa, assim não tem risco de comprar um que não serve.
    </p>`;
  }
  if (!chave) {
    return `<p class="dependencia">
      A placa <strong>${placa.nome}</strong> não tem módulo TPM cadastrado por aqui.
      Antes de comprar qualquer um, confira no manual dela qual é o conector TPM
      (o número de pinos muda de placa para placa).
    </p>`;
  }
  if (compativeis.length === 0) {
    return `<p class="dependencia">
      Ainda não há módulo cadastrado para a <strong>${placa.nome}</strong>.
    </p>`;
  }
  return `
    <p class="dependencia dependencia--ok">
      Mostrando só o que encaixa na sua <strong>${placa.nome}</strong>.
    </p>
    <div class="grade-pecas">${compativeis.map(criarCard).join("")}</div>`;
}

function secaoTPM() {
  return `
    <section class="categoria" id="secaoTPM">
      <h3 class="categoria__cabeca">
        ${iconeSVG(CATEGORIA_TPM, "categoria__icone")}${nomeCategoria(CATEGORIA_TPM)}
      </h3>
      <div id="miolodaSecaoTPM">${miolodaSecaoTPM()}</div>
    </section>`;
}

/* Redesenha so o miolo do TPM. Chamado quando o carrinho muda. */
function atualizarSecaoTPM() {
  const alvo = document.getElementById("miolodaSecaoTPM");
  if (alvo) alvo.innerHTML = miolodaSecaoTPM();
}

/* Secao da placa de video. Como os processadores tem video integrado, ela
   pode ser pulada: o botao troca entre "vou usar integrado" e "quero escolher". */
function secaoGPU(pagina, pecasDaPagina) {
  const podePular = temVideoIntegrado(pagina);
  // Se a pessoa tinha pulado e depois escolheu um processador sem video
  // integrado, a etapa volta a ser obrigatoria sozinha.
  if (!podePular) videoIntegrado[pagina] = false;

  const pulou = videoIntegrado[pagina];
  const doGrupo = pecasDaPagina.filter(p => p.categoria === CATEGORIA_GPU);
  const cabeca = `<h3 class="categoria__cabeca">
      ${iconeSVG(CATEGORIA_GPU, "categoria__icone")}${nomeCategoria(CATEGORIA_GPU)}
      ${podePular ? `<span class="categoria__opcional">opcional</span>` : ""}
    </h3>`;

  if (!podePular) {
    return `<section class="categoria">
      ${cabeca}
      <div class="grade-pecas">${doGrupo.map(criarCard).join("")}</div>
    </section>`;
  }

  const botao = `<button class="pular-etapa${pulou ? " pular-etapa--ativo" : ""}"
      data-video-integrado="${pagina}" role="switch" aria-checked="${pulou}">
      <span class="alternar${pulou ? "" : " alternar--off"}"><span class="alternar__bola"></span></span>
      <span>Usar o vídeo integrado do processador${pulou ? "" : " (pular esta etapa)"}</span>
    </button>`;

  if (pulou) {
    return `<section class="categoria">
      ${cabeca}
      <p class="dependencia dependencia--ok">
        <strong>Etapa pulada.</strong> Seu processador já tem vídeo integrado, então o PC
        liga e funciona sem placa dedicada, e dá para jogar coisas leves e usar no dia a dia.
        Você pode acrescentar uma placa depois, sem trocar mais nada.
      </p>
      ${botao}
    </section>`;
  }

  return `<section class="categoria">
    ${cabeca}
    ${botao}
    <div class="grade-pecas">${doGrupo.map(criarCard).join("")}</div>
  </section>`;
}

function montarPagina(pagina, elementoId) {
  const container = document.getElementById(elementoId);
  const pecasDaPagina = TODAS_AS_PECAS.filter(p => (p.pagina || "").toLowerCase() === pagina);

  if (pecasDaPagina.length === 0) {
    container.innerHTML = `<p class="carregando">Nenhuma peça cadastrada para esta página.</p>`;
    return;
  }

  // O que o visitante ja travou: processador OU placa-mae, o que vier primeiro.
  const travada = plataformaEscolhida(pagina);
  const aceitas = memoriasAceitas(pagina);

  const html = ORDEM_CATEGORIAS
    .filter(cat => {
      // O Modulo TPM so aparece no PC Chines: processador atual ja tem fTPM.
      if (cat === CATEGORIA_TPM && pagina !== "xeon") return false;
      return pecasDaPagina.some(p => p.categoria === cat);
    })
    .map(cat => {
      if (cat === CATEGORIA_TPM) return secaoTPM();

      // Placa de video: etapa opcional quando o processador tem video integrado.
      if (cat === CATEGORIA_GPU) return secaoGPU(pagina, pecasDaPagina);

      const doGrupo = pecasDaPagina.filter(p => p.categoria === cat);
      const filtra = CATEGORIAS_PLATAFORMA.includes(cat);
      const filtraMemoria = cat === CATEGORIA_MEMORIA;

      let mostrados = doGrupo;
      if (filtra) mostrados = filtrarPorPlataforma(doGrupo, travada, cat);
      if (filtraMemoria) mostrados = filtrarMemorias(doGrupo, aceitas);
      const escondidos = doGrupo.length - mostrados.length;

      let aviso = "";
      if (filtra && travada && escondidos > 0) {
        aviso = `<p class="dependencia dependencia--ok">
          Mostrando só o que encaixa no seu <strong>${travada.peca.nome}</strong>
          (${nomePlataforma(travada.plataforma)}).
          ${escondidos} ${escondidos === 1 ? "opção de outro soquete está oculta" : "opções de outros soquetes estão ocultas"}
          Tire a peça do simulador para ver todas de novo.
        </p>`;
      }
      if (filtraMemoria && aceitas && escondidos > 0) {
        aviso = `<p class="dependencia dependencia--ok">
          Seu <strong>${aceitas.motivo.nome}</strong> usa memória
          <strong>${aceitas.tipos.join(" ou ")}</strong>.
          ${escondidos} ${escondidos === 1 ? "opção de outro tipo está oculta" : "opções de outros tipos estão ocultas"}
          DDR4 e DDR5 não entram no mesmo slot.
        </p>`;
      }
      if (filtraMemoria && aceitas && mostrados.length === 0) {
        return `
        <section class="categoria">
          <h3 class="categoria__cabeca">
            ${iconeSVG(cat, "categoria__icone")}${nomeCategoria(cat)}
          </h3>
          <p class="dependencia">
            Nenhuma memória <strong>${aceitas.tipos.join(" ou ")}</strong> cadastrada para
            combinar com o seu <strong>${aceitas.motivo.nome}</strong>.
          </p>
        </section>`;
      }
      if (filtra && travada && mostrados.length === 0) {
        return `
        <section class="categoria">
          <h3 class="categoria__cabeca">
            ${iconeSVG(cat, "categoria__icone")}${nomeCategoria(cat)}
          </h3>
          <p class="dependencia">
            Nenhuma opção de <strong>${nomePlataforma(travada.plataforma)}</strong> cadastrada
            para combinar com o seu <strong>${travada.peca.nome}</strong>.
            As outras que existem aqui são de soquete diferente e não encaixariam.
          </p>
        </section>`;
      }

      return `
        <section class="categoria">
          <h3 class="categoria__cabeca">
            ${iconeSVG(cat, "categoria__icone")}${nomeCategoria(cat)}
          </h3>
          ${aviso}
          <div class="grade-pecas">${mostrados.map(criarCard).join("")}</div>
        </section>`;
    }).join("");

  container.innerHTML = html;
}

/* Escapa texto que vai dentro de atributo HTML (aria-label, title, alt).
   Sem isso, um nome de peca com aspas quebraria a tag. */
function escaparAtributo(texto) {
  return String(texto || "")
    .replace(/&/g, "&amp;").replace(/"/g, "&quot;")
    .replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ---------------------------------------------------------
   JANELA DE DETALHE DA PECA
   Imagem grande a esquerda; nome, loja, descricao, preco e
   botoes a direita. No celular, um em cima do outro.
   --------------------------------------------------------- */
function montarDetalhe(peca) {
  const c = calcularImposto(peca);
  const moeda = (peca.moeda || "BRL").toUpperCase();
  const origem = (peca.origem || "brasil").toLowerCase();
  const nivel = (peca.nivel || "").toLowerCase();
  const rotulo = ROTULO_ORIGEM[origem] || ROTULO_ORIGEM.brasil;
  const importada = origem === "china";

  const seloNivel = montarSelo(nivel, "peca__nivel");
  const seloOrigem = `<span class="peca__origem peca__origem--${origem}"
      style="position:static" title="${escaparAtributo(rotulo.frase)}">${rotulo.selo}</span>`;

  // Imagem inteira, sem corte. Se nao houver (ou falhar), mostra o icone da categoria.
  const iconeGrande = iconeSVG(peca.categoria, "detalhe__placeholder-icone");
  const figura = peca.imagem
    ? `<img src="${escaparAtributo(peca.imagem)}" alt="${escaparAtributo(peca.nome)}"
           onerror="this.style.display='none';this.nextElementSibling.style.display='grid';">
       <span style="display:none" aria-hidden="true">${iconeGrande}</span>`
    : `<span aria-hidden="true">${iconeGrande}</span>`;

  let precoValor, precoFrase, conta = "", aviso = "";
  if (importada) {
    precoValor = moeda === "USD" ? dolar(peca.preco) : reais(peca.preco);
    precoFrase = `Chega por <strong>${reais(c.total)}</strong> somando os impostos`;
    conta = `
      <div class="detalhe__conta">
        <div class="detalhe__conta-linha"><span>Peça</span><span>${reais(c.produtoBRL)}</span></div>
        ${c.freteBRL > 0 ? `<div class="detalhe__conta-linha"><span>Frete</span><span>${reais(c.freteBRL)}</span></div>` : ""}
        <div class="detalhe__conta-linha"><span>Impostos estimados</span><span>${reais(c.impostos)}</span></div>
        <div class="detalhe__conta-linha detalhe__conta-linha--total"><span>Custo até sua casa</span><span>${reais(c.total)}</span></div>
      </div>`;
    if (c.foraRemessa) {
      aviso = `<p class="detalhe__aviso">Acima de US$ ${CONFIG.limiteRemessaConforme_USD}
        a compra sai do regime simplificado e vira importação formal, com tributos que variam
        por produto. O valor acima é só uma estimativa pela regra simplificada.</p>`;
    }
  } else {
    precoValor = reais(peca.preco);
    precoFrase = c.freteBRL > 0
      ? `Chega por <strong>${reais(c.total)}</strong> com o frete`
      : "Preço final: impostos já inclusos";
    if (c.freteBRL > 0) {
      conta = `
      <div class="detalhe__conta">
        <div class="detalhe__conta-linha"><span>Peça</span><span>${reais(c.produtoBRL)}</span></div>
        <div class="detalhe__conta-linha"><span>Frete</span><span>${reais(c.freteBRL)}</span></div>
        <div class="detalhe__conta-linha detalhe__conta-linha--total"><span>Custo até sua casa</span><span>${reais(c.total)}</span></div>
      </div>`;
    }
  }

  const comentario = peca.comentarios
    ? `<p class="detalhe__comentario">${peca.comentarios}</p>` : "";

  return `
    <div class="detalhe__figura">
      ${figura}
      <div class="detalhe__selos">${seloNivel}${seloOrigem}</div>
    </div>
    <div class="detalhe__info">
      <span class="detalhe__categoria">
        ${iconeSVG(peca.categoria, "detalhe__categoria-icone")}${nomeCategoria(peca.categoria)}
      </span>
      <h3 class="detalhe__nome" id="detalheNome">${peca.nome}</h3>
      <p class="detalhe__loja">${logoDaLoja(peca)}<span>${peca.loja || "Loja"}</span></p>
      ${comentario}
      <div class="detalhe__preco">
        <div class="detalhe__preco-valor">${precoValor}</div>
        <div class="detalhe__preco-frase">${precoFrase}</div>
        ${conta}
      </div>
      ${aviso}
      <div class="detalhe__acoes">
        <button class="peca__adicionar" data-chave="${chaveDaPeca(peca)}">Adicionar ao simulador</button>
        <a class="peca__link" href="${peca.link_compra || '#'}" target="_blank" rel="noopener"
           title="Abre a página original do produto em ${escaparAtributo(peca.loja || "loja")}, numa aba nova">
          <svg class="peca__link-icone" aria-hidden="true" focusable="false"><use href="#ico-link-externo"></use></svg>
          <span>Link original do produto</span>
        </a>
      </div>
    </div>`;
}

// Guarda quem estava com o foco, para devolver ao fechar (acessibilidade).
let focoAntesDoDetalhe = null;

function abrirDetalhe(chave) {
  const peca = TODAS_AS_PECAS.find(p => chaveDaPeca(p) === chave);
  if (!peca) return;

  focoAntesDoDetalhe = document.activeElement;
  document.getElementById("detalheGrade").innerHTML = montarDetalhe(peca);

  const janela = document.getElementById("detalhe");
  janela.hidden = false;
  document.body.classList.add("sem-rolagem");
  requestAnimationFrame(() => janela.classList.add("visivel"));
  document.getElementById("detalheFechar").focus();
}

function fecharDetalhe() {
  const janela = document.getElementById("detalhe");
  if (janela.hidden) return;
  janela.classList.remove("visivel");
  document.body.classList.remove("sem-rolagem");
  setTimeout(() => {
    janela.hidden = true;
    document.getElementById("detalheGrade").innerHTML = "";
  }, 200);
  if (focoAntesDoDetalhe && focoAntesDoDetalhe.focus) focoAntesDoDetalhe.focus();
}

function detalheEstaAberto() {
  return !document.getElementById("detalhe").hidden;
}

function criarCard(peca) {
  const { total } = calcularImposto(peca);
  const moeda = (peca.moeda || "BRL").toUpperCase();
  const origem = (peca.origem || "brasil").toLowerCase();
  const nivel = (peca.nivel || "").toLowerCase();
  const icone = iconeSVG(peca.categoria, "peca__placeholder-icone");
  const rotulo = ROTULO_ORIGEM[origem] || ROTULO_ORIGEM.brasil;

  const seloNivel = montarSelo(nivel, "peca__nivel");

  const seloOrigem = `<span class="peca__origem peca__origem--${origem}" title="${rotulo.frase}">${rotulo.selo}</span>`;

  // Preco: quando a peca vem da China, o valor de cima e o preco da loja
  // (em dolar) e a linha de baixo mostra quanto ela custa aqui, com imposto.
  let precoPrincipal, precoSecundario;
  if (origem === "china") {
    precoPrincipal = moeda === "USD" ? dolar(peca.preco) : reais(peca.preco);
    precoSecundario = `Chega por <strong>${reais(total)}</strong> somando os impostos`;
  } else {
    precoPrincipal = reais(peca.preco);
    // Se a planilha trouxer frete, ele conta no total: a frase precisa dizer isso,
    // senao "preco final" viraria mentira por R$ 42.
    const freteNacional = Number(peca.frete) || 0;
    precoSecundario = freteNacional > 0
      ? `Chega por <strong>${reais(total)}</strong> com o frete`
      : "Preço final: impostos já inclusos";
  }

  const figura = peca.imagem
    ? `<img src="${peca.imagem}" alt="${peca.nome}" loading="lazy"
           onerror="this.style.display='none';this.parentElement.querySelector('.peca__placeholder').style.display='grid';">
       <span class="peca__placeholder" style="display:none" aria-hidden="true">${icone}</span>`
    : `<span class="peca__placeholder" aria-hidden="true">${icone}</span>`;

  const comentario = peca.comentarios
    ? `<p class="peca__comentario">${peca.comentarios}</p>` : "";

  return `
    <article class="peca" data-chave="${chaveDaPeca(peca)}">
      <div class="peca__figura">
        ${figura}
        <button class="peca__ampliar" data-ampliar="${chaveDaPeca(peca)}"
                aria-label="Ver detalhes de ${escaparAtributo(peca.nome)}">
          <svg class="peca__ampliar-icone" aria-hidden="true" focusable="false"><use href="#ico-ampliar"></use></svg>
        </button>
        <div class="peca__selos">${seloNivel}${seloOrigem}</div>
      </div>
      <div class="peca__corpo">
        <h4 class="peca__nome">${peca.nome}</h4>
        <p class="peca__loja">${logoDaLoja(peca)}<span>${peca.loja || "Loja"}</span></p>
        ${comentario}
        <div class="peca__preco">
          <div class="peca__preco-valor">${precoPrincipal}</div>
          <div class="peca__preco-secundario">${precoSecundario}</div>
        </div>
        <div class="peca__acoes">
          <button class="peca__adicionar" data-chave="${chaveDaPeca(peca)}">Adicionar ao simulador</button>
          <a class="peca__link" href="${peca.link_compra || '#'}" target="_blank" rel="noopener"
             title="Abre a página original do produto em ${peca.loja || "loja"}, numa aba nova">
            <svg class="peca__link-icone" aria-hidden="true" focusable="false"><use href="#ico-link-externo"></use></svg>
            <span>Link original do produto</span>
          </a>
        </div>
      </div>
    </article>`;
}

/* ---------------------------------------------------------
   7) SIMULADOR (CARRINHO)
   --------------------------------------------------------- */
/* Guarda o que foi retirado automaticamente, para o aviso na tela. */
let removidosPorIncompatibilidade = [];

/* Ao trocar o processador (ou a placa) por um de outro soquete, o que estava
   escolhido antes deixa de servir. Em vez de deixar a pessoa levar peca que
   nao encaixa, tiramos do simulador e avisamos. */
function limparIncompativeis(nova) {
  if (!CATEGORIAS_PLATAFORMA.includes(nova.categoria)) return;
  const pagina = (nova.pagina || "").toLowerCase();
  const plataforma = plataformaDaPeca(nova);
  if (!plataforma) return;

  const memoriaNova = nova.categoria === "Placa-mae" ? tipoMemoria(nova) : null;

  for (let i = carrinho.length - 1; i >= 0; i--) {
    const p = carrinho[i];
    if ((p.pagina || "").toLowerCase() !== pagina) continue;

    let conflita = false;

    // outra peca de plataforma, de soquete diferente
    if (CATEGORIAS_PLATAFORMA.includes(p.categoria)) {
      const outra = plataformaDaPeca(p);
      conflita = !!outra && outra !== plataforma;
    }

    // memoria que nao serve mais
    if (p.categoria === CATEGORIA_MEMORIA) {
      const t = tipoMemoria(p);
      if (t) {
        if (memoriaNova) conflita = t !== memoriaNova;
        else {
          const permitidos = MEMORIA_PADRAO[plataforma] || [];
          conflita = permitidos.length > 0 && !permitidos.includes(t);
        }
      }
    }

    if (conflita) {
      removidosPorIncompatibilidade.push(p.nome);
      carrinho.splice(i, 1);
      ajustesCarrinho.splice(i, 1);
    }
  }
}

function adicionarAoCarrinho(chave) {
  const peca = TODAS_AS_PECAS.find(p => chaveDaPeca(p) === chave);
  if (!peca) return;
  // Uma peca por categoria: escolher outro processador substitui o anterior.
  const mesmaCategoria = carrinho.findIndex(p =>
    p.categoria === peca.categoria && (p.pagina || "") === (peca.pagina || ""));
  if (mesmaCategoria >= 0) {
    carrinho.splice(mesmaCategoria, 1);
    ajustesCarrinho.splice(mesmaCategoria, 1);
  }

  removidosPorIncompatibilidade = [];
  limparIncompativeis(peca);

  carrinho.push(peca);
  ajustesCarrinho.push({ semImposto: false, semFrete: false, semItem: false });
  atualizarCarrinho();

  // Feedback visual no botao. Pode existir mais de um botao da mesma peca
  // ao mesmo tempo (o do card e o da janela de detalhe), por isso o "All".
  const botoes = document.querySelectorAll(`.peca__adicionar[data-chave="${chave}"]`);
  botoes.forEach(botao => {
    botao.textContent = "Adicionado ✓";
    botao.classList.add("adicionado");
    setTimeout(() => {
      botao.textContent = "Adicionar ao simulador";
      botao.classList.remove("adicionado");
    }, 1200);
  });
}

function removerDoCarrinho(indice) {
  carrinho.splice(indice, 1);
  ajustesCarrinho.splice(indice, 1);
  atualizarCarrinho();
}

/* Liga/desliga imposto ou frete de UM item, so para o visitante ver o quanto
   aquela parcela pesa. Nao muda nada do que sera cobrado de verdade. */
function alternarAjuste(indice, campo) {
  if (!ajustesCarrinho[indice]) ajustesCarrinho[indice] = { semImposto: false, semFrete: false };
  ajustesCarrinho[indice][campo] = !ajustesCarrinho[indice][campo];
  atualizarCarrinho();
}

function restaurarAjustes() {
  ajustesCarrinho.forEach(a => { a.semImposto = false; a.semFrete = false; a.semItem = false; });
  atualizarCarrinho();
}

/* Calculo da peca considerando os ajustes.
   Tirar o frete nao e so subtrair: o imposto de importacao incide sobre
   produto + frete, entao o valor precisa ser recalculado do zero com frete 0. */
function calcularComAjuste(peca, ajuste) {
  const base = calcularImposto(peca);

  // Item desligado: some do total, mas continua na lista para a pessoa ver
  // quanto ele pesava. Guardamos os valores cheios para mostrar riscado.
  if (ajuste.semItem) {
    return {
      base: 0, impostos: 0, total: 0, produtoBRL: 0, freteBRL: 0, foraRemessa: false,
      freteCheio: base.freteBRL, impostoCheio: base.impostos, impostoSemFrete: base.impostos,
      produtoCheio: base.produtoBRL, totalCheio: base.total
    };
  }

  const semFrete = calcularImposto({ ...peca, frete: 0 });
  const usado = ajuste.semFrete ? semFrete : base;
  const calc = ajuste.semImposto
    ? { ...usado, impostos: 0, total: usado.base }
    : usado;

  return {
    ...calc,
    // valores "cheios", para a tela mostrar o que foi desligado
    freteCheio: base.freteBRL,
    impostoCheio: base.impostos,
    impostoSemFrete: semFrete.impostos,
    produtoCheio: base.produtoBRL,
    totalCheio: base.total
  };
}

/* Uma linha do recibo que pode ser ligada/desligada.
   Quando desligada, o valor aparece riscado: o visitante continua vendo
   quanto era, e nao so que sumiu. O frete e sempre mostrado, mesmo zerado. */
function linhaAjustavel({ rotulo, indice, campo, desligado, valorAtivo, mostrarBotao }) {
  const botao = mostrarBotao
    ? `<button class="alternar${desligado ? " alternar--off" : ""}"
               data-alternar="${campo}" data-indice="${indice}"
               role="switch" aria-checked="${!desligado}"
               title="${desligado ? `Voltar a somar ${rotulo.toLowerCase()}` : `Ver quanto fica sem ${rotulo.toLowerCase()}`}">
         <span class="alternar__bola"></span>
       </button>`
    : "";
  const valor = desligado
    ? `<s class="mono valor-desligado">${reais(valorAtivo)}</s> <span class="mono">${reais(0)}</span>`
    : `<span class="mono">${reais(valorAtivo)}</span>`;
  return `<div class="item-carrinho__linha${desligado ? " item-carrinho__linha--off" : ""}">
            <span class="item-carrinho__rotulo">${rotulo}${botao}</span>
            <span>${valor}</span>
          </div>`;
}

function atualizarCarrinho() {
  const lista = document.getElementById("carrinhoItens");
  let subtotal = 0, impostos = 0, total = 0, frete = 0;

  if (carrinho.length === 0) {
    lista.innerHTML = `<p class="carrinho__vazio">Nenhuma peça adicionada ainda.<br>Escolha peças nas abas do PC Chinês ou do PC Nacional.</p>`;
  } else {
    lista.innerHTML = carrinho.map((peca, i) => {
      const ajuste = ajusteDoItem(i);
      const calc = calcularComAjuste(peca, ajuste);
      subtotal += calc.produtoBRL; frete += (calc.freteBRL || 0);
      impostos += calc.impostos; total += calc.total;

      const org = (peca.origem || "brasil").toLowerCase();
      const tag = (ROTULO_ORIGEM[org] || ROTULO_ORIGEM.brasil).selo;

      // So faz sentido oferecer o botao de imposto quando ha imposto para tirar.
      const podeMexerNoImposto = calc.impostoCheio > 0 && !ajuste.semItem;

      return `
        <div class="item-carrinho${ajuste.semItem ? " item-carrinho--off" : ""}">
          <div class="item-carrinho__topo">
            <button class="alternar alternar--item${ajuste.semItem ? " alternar--off" : ""}"
                    data-alternar="semItem" data-indice="${i}"
                    role="switch" aria-checked="${!ajuste.semItem}"
                    title="${ajuste.semItem ? "Voltar a somar esta peça" : "Ver o total sem esta peça"}">
              <span class="alternar__bola"></span>
            </button>
            <div class="item-carrinho__id">
              <div class="item-carrinho__nome">${peca.nome}</div>
              <div class="item-carrinho__tag">${nomeCategoria(peca.categoria)} · ${tag}</div>
            </div>
            <button class="item-carrinho__remover" data-indice="${i}" aria-label="Remover">&times;</button>
          </div>

          <div class="item-carrinho__linha">
            <span>Peça</span>
            <span>${ajuste.semItem
              ? `<s class="mono valor-desligado">${reais(calc.produtoCheio)}</s> <span class="mono">${reais(0)}</span>`
              : `<span class="mono">${reais(calc.produtoBRL)}</span>`}</span>
          </div>

          ${linhaAjustavel({
            rotulo: "Frete", indice: i, campo: "semFrete", desligado: ajuste.semFrete,
            // A linha do frete aparece sempre, mesmo zerada. A chave, so quando
            // ha frete de verdade: desligar zero nao faria nada.
            valorAtivo: calc.freteCheio, mostrarBotao: calc.freteCheio > 0 && !ajuste.semItem
          })}

          ${linhaAjustavel({
            rotulo: "Imposto", indice: i, campo: "semImposto", desligado: ajuste.semImposto,
            valorAtivo: ajuste.semFrete ? calc.impostoSemFrete : calc.impostoCheio,
            mostrarBotao: podeMexerNoImposto
          })}

          <div class="item-carrinho__linha item-carrinho__final">
            <span>Valor final</span>
            <span>${ajuste.semItem
              ? `<s class="mono valor-desligado">${reais(calc.totalCheio)}</s> <span class="mono">${reais(0)}</span>`
              : `<span class="mono">${reais(calc.total)}</span>`}</span>
          </div>
        </div>`;
    }).join("");
  }

  // Aviso do que saiu sozinho, avisos de incompatibilidade e sugestao do TPM.
  lista.insertAdjacentHTML("afterbegin", blocoRemovidos());
  lista.insertAdjacentHTML("beforeend", blocoPlataformaNoCarrinho());
  lista.insertAdjacentHTML("beforeend", blocoTPMnoCarrinho());

  document.getElementById("resumoSubtotal").textContent = reais(subtotal);
  document.getElementById("resumoFrete").textContent = reais(frete);
  document.getElementById("resumoImpostos").textContent = reais(impostos);
  document.getElementById("resumoTotal").textContent = reais(total);

  // Se alguma parcela foi desligada, o valor deixa de ser o que sera cobrado.
  const mexidos = ajustesCarrinho.filter(a => a.semImposto || a.semFrete || a.semItem).length;
  const avisoSim = document.getElementById("avisoSimulacao");
  if (avisoSim) {
    avisoSim.hidden = mexidos === 0;
    if (mexidos > 0) {
      avisoSim.innerHTML = `<strong>Simulação:</strong> você desligou itens, frete ou imposto em
        ${mexidos} ${mexidos === 1 ? "item" : "itens"}. Serve para ver o peso de cada parcela.
        <strong>Não é o valor que será cobrado</strong>.
        <button class="alternar-restaurar" id="restaurarAjustes">Voltar tudo</button>`;
    }
  }

  document.getElementById("contadorCarrinho").textContent = carrinho.length;
  document.getElementById("contadorFlutuante").textContent = carrinho.length;

  const botaoGerar = document.getElementById("gerarOrcamento");
  if (botaoGerar) botaoGerar.disabled = carrinho.length === 0;

  // As vitrines dependem do que esta no carrinho (plataforma travada e
  // modulo TPM compativel), entao sao refeitas junto.
  montarPagina("xeon", "listaXeon");
  montarPagina("atual", "listaAtual");
}

/* Aviso do que o site tirou sozinho por nao encaixar mais. Some ao proximo
   clique: e um recado do momento, nao um alerta permanente. */
function blocoRemovidos() {
  if (removidosPorIncompatibilidade.length === 0) return "";
  const nomes = removidosPorIncompatibilidade;
  const html = `<div class="addon addon--removido">
    <strong>${nomes.length === 1 ? "Uma peça foi retirada" : "Algumas peças foram retiradas"}</strong>
    porque não encaixa no que você acabou de escolher:
    <em>${nomes.join("</em>, <em>")}</em>.
    Escolha ${nomes.length === 1 ? "outra" : "outras"} na lista, agora só aparece o que serve.
  </div>`;
  removidosPorIncompatibilidade = [];
  return html;
}

/* Avisa quando o processador e a placa-mae escolhidos nao encaixam.
   Nao acontece escolhendo pelo site (o filtro impede), mas pode acontecer
   com um link antigo ou se a peca foi trocada na planilha depois. */
function blocoPlataformaNoCarrinho() {
  return ["xeon", "atual"].map(pagina => {
    const conflitos = conflitosDePlataforma(pagina);
    if (conflitos.length === 0) return "";
    const travada = plataformaEscolhida(pagina);
    return conflitos.map(p => `<div class="addon addon--alerta">
      <strong>Essas duas peças não encaixam.</strong>
      O <em>${travada.peca.nome}</em> é ${nomePlataforma(travada.plataforma)} e o
      <em>${p.nome}</em> é ${nomePlataforma(plataformaDaPeca(p))}.
      Troque uma das duas antes de comprar.
    </div>`).join("");
  }).join("");
}

/* O que aparece no carrinho a respeito do TPM:
   - aviso, se o TPM que esta la nao casa mais com a placa escolhida
   - sugestao de add-on, se montou Xeon com placa compativel e ainda nao levou */
function blocoTPMnoCarrinho() {
  const { placa, chave, compativeis, noCarrinho, casaComAPlaca } = estadoTPM();

  if (noCarrinho && !casaComAPlaca) {
    const oQueTem = placa
      ? `a placa escolhida agora é a <strong>${placa.nome}</strong>`
      : `não há placa-mãe no simulador`;
    return `<div class="addon addon--alerta">
      <strong>Confira o módulo TPM.</strong>
      O módulo na lista é o <em>${noCarrinho.nome}</em>, mas ${oQueTem}.
      Remova o módulo e escolha o que casa com a placa atual.
    </div>`;
  }

  if (noCarrinho || !placa || !chave || compativeis.length === 0) return "";

  const sugerido = compativeis[0];
  const calc = calcularImposto(sugerido);
  return `<div class="addon">
    <div class="addon__selo">Sugestão para o seu Xeon</div>
    <div class="addon__nome">${sugerido.nome}</div>
    <p class="addon__texto">
      Sua <strong>${placa.nome}</strong> aceita este módulo TPM. Processador Xeon não
      tem TPM embutido, e o Windows 11 pede TPM 2.0, por isso ele entra como item à parte.
    </p>
    <div class="addon__rodape">
      <span class="addon__preco mono">${reais(calc.total)}</span>
      <button class="addon__botao" data-chave="${chaveDaPeca(sugerido)}">Adicionar</button>
    </div>
  </div>`;
}

/* ---------------------------------------------------------
   Gera a lista orcamentaria e abre em nova pagina
   --------------------------------------------------------- */
/* =========================================================
   LINK COMPARTILHAVEL
   -----------------------------------------------------
   O link NAO carrega a lista inteira dentro dele: guarda so a
   referencia das pecas (pagina + id). Assim ele fica curto o bastante
   para mandar no WhatsApp. Algo como:

     https://.../simulador-pc/?lista=x1,x27f,a12i

   Cada peca vira uma letra de pagina ("x" = PC Chines, "a" = PC Nacional)
   mais o id da planilha. As letras no fim marcam o que foi desligado:
   "f" = sem frete, "i" = sem imposto.

   Ha tambem a forma curta ?rec=xeon, que abre a lista de recomendacoes
   sempre atualizada: se voce trocar a peca indicada na planilha, quem
   tiver o link ve a nova.

   Consequencia importante: os precos sao os de HOJE, nao os do dia em que
   o link foi criado. Para uma lista de compras isso e o certo, mas quem
   abre precisa saber, por isso a pagina mostra a data em que foi aberta.
   ========================================================= */

function codigoDaPeca(peca, ajuste) {
  const letra = (peca.pagina || "").toLowerCase() === "xeon" ? "x" : "a";
  let codigo = letra + peca.id;
  if (ajuste && ajuste.semFrete) codigo += "f";
  if (ajuste && ajuste.semImposto) codigo += "i";
  if (ajuste && ajuste.semItem) codigo += "d";
  return codigo;
}

/* Endereco da pasta do site, sem o nome do arquivo. */
function pastaDoSite() {
  return location.origin + location.pathname.replace(/[^/]*$/, "");
}

function montarLinkLista(pecas, ajustes) {
  const codigos = pecas.map((p, i) => codigoDaPeca(p, ajustes[i])).join(",");
  return pastaDoSite() + "?lista=" + codigos;
}

function montarLinkRecomendacoes(pagina) {
  return pastaDoSite() + "?rec=" + pagina;
}

/* Le "x27fi" e devolve a peca + o que estava desligado. */
function lerCodigoDaPeca(codigo) {
  const m = String(codigo).trim().match(/^([xa])(\d+)([fid]*)$/i);
  if (!m) return null;
  const pagina = m[1].toLowerCase() === "x" ? "xeon" : "atual";
  const id = m[2];
  const flags = m[3].toLowerCase();

  const peca = TODAS_AS_PECAS.find(p =>
    (p.pagina || "").toLowerCase() === pagina && String(p.id) === id);
  if (!peca) return { faltando: `${pagina} #${id}` };

  return { peca, ajuste: { semFrete: flags.includes("f"), semImposto: flags.includes("i"),
                           semItem: flags.includes("d") } };
}

/* Se a pessoa chegou por um link compartilhado, monta a lista e manda
   direto para a pagina do orcamento. Devolve true quando isso acontece. */
/* Marcado quando a pessoa chegou por um link que nao deu para abrir. */
let linkNaoAbriu = false;

/* Aviso no alto da home explicando que o link recebido nao funcionou.
   Sem isso a pessoa clica no link, cai na home e nao entende o que houve. */
function avisarLinkQuebrado() {
  if (!linkNaoAbriu) return;
  const heroi = document.querySelector(".heroi");
  if (!heroi) return;
  const aviso = document.createElement("div");
  aviso.className = "aviso-link";
  aviso.innerHTML = `<strong>Essa lista não está mais disponível.</strong>
    As peças do link podem ter saído do catálogo. Monte a sua montagem aqui embaixo,
    leva menos de um minuto.`;
  heroi.insertAdjacentElement("afterend", aviso);
}

async function abrirListaDoLink() {
  const params = new URLSearchParams(location.search);
  const rec = params.get("rec");
  const lista = params.get("lista");
  if (!rec && !lista) return false;

  /* ESPERA a cotacao antes de calcular. Sem isso, quem abre o link recebido
     faz a conta com o dolar fixo do CONFIG (o padrao), e nao com o do dia:
     a lista chegava com valores diferentes dos que o autor viu. */
  const cotacao = await buscarCotacaoDolar();
  if (cotacao) { CONFIG.cotacaoDolar = cotacao.valor; COTACAO_AUTOMATICA = true; }

  let pecas = [], ajustes = [], faltando = [], titulo = "", tipo = "";

  if (rec) {
    const pagina = rec.toLowerCase() === "atual" ? "atual" : "xeon";
    const r = pecasRecomendadas(pagina);
    pecas = r.achadas;
    ajustes = pecas.map(() => ({ semFrete: false, semImposto: false }));
    faltando = r.faltando;
    tipo = "recomendacoes";
    titulo = pagina === "xeon"
      ? "Minhas recomendações para o PC Chinês"
      : "Minhas recomendações para o PC Nacional";
  } else {
    lista.split(",").forEach(codigo => {
      if (!codigo.trim()) return;
      const lido = lerCodigoDaPeca(codigo);
      if (!lido) return;                       // codigo com erro de digitacao: ignora
      if (lido.faltando) { faltando.push(lido.faltando); return; }
      pecas.push(lido.peca);
      ajustes.push(lido.ajuste);
    });
    tipo = "compartilhada";
    titulo = "Lista compartilhada";
  }

  if (pecas.length === 0) {
    // Nao adianta escrever na lista de pecas: montarPagina() roda depois e
    // apagaria o recado. Marca a falha e o aviso e mostrado no fim do iniciar().
    console.error("[link] Nenhuma peça do link foi encontrada na planilha.");
    linkNaoAbriu = true;
    return false;
  }

  const pacote = montarPacoteOrcamento(pecas, ajustes);
  pacote.tipo = tipo;
  pacote.tituloLista = titulo;
  pacote.faltando = faltando;
  pacote.link = rec ? montarLinkRecomendacoes(rec) : montarLinkLista(pecas, ajustes);

  sessionStorage.setItem("orcamentoPC", JSON.stringify(pacote));
  // replace (e nao href) para o botao Voltar do navegador nao ficar em loop
  location.replace("orcamento.html");
  return true;
}

/* Monta o pacote que a pagina do orcamento le.
   Fica separado porque duas coisas usam o mesmo formato: o simulador do
   visitante e a lista pronta de recomendacoes. Assim a conta e uma so. */
function montarPacoteOrcamento(pecas, ajustes) {
  let subtotal = 0, impostos = 0, total = 0;
  const itens = pecas.map((peca, i) => {
    const ajuste = ajustes[i] || { semImposto: false, semFrete: false, semItem: false };
    const c = calcularComAjuste(peca, ajuste);
    subtotal += c.produtoBRL; impostos += c.impostos; total += c.total;
    return {
      nome: peca.nome,
      categoria: nomeCategoria(peca.categoria),
      pagina: peca.pagina,
      loja: peca.loja || "",
      link_compra: peca.link_compra || "",
      origem: (peca.origem || "brasil").toLowerCase(),
      base: c.base,
      produto: c.produtoBRL,
      // "frete" e "imposto" sao os valores CHEIOS; "semFrete"/"semImposto" dizem
      // se estao ligados. Com isso a lista orcamentaria consegue ligar e desligar
      // sozinha, sem precisar repetir a conta de imposto la dentro.
      frete: c.freteCheio,
      imposto: c.impostoCheio,
      impostoSemFrete: c.impostoSemFrete,
      semFrete: !!ajuste.semFrete,
      semImposto: !!ajuste.semImposto,
      semItem: !!ajuste.semItem,
      produtoCheio: c.produtoCheio,
      totalCheio: c.totalCheio,
      impostos: c.impostos,
      total: c.total,
      foraRemessa: !!c.foraRemessa
    };
  });

  const totalFrete = itens.reduce((s, i) => s + (i.semFrete ? 0 : Number(i.frete) || 0), 0);

  return {
    geradoEm: new Date().toISOString(),
    cotacaoDolar: CONFIG.cotacaoDolar,
    cotacaoAutomatica: COTACAO_AUTOMATICA,
    itens,
    subtotal,
    frete: totalFrete,
    impostos,
    total
  };
}

function gerarOrcamento() {
  if (carrinho.length === 0) return;
  const ajustes = carrinho.map((_, i) => ajusteDoItem(i));
  const pacote = montarPacoteOrcamento(carrinho, ajustes);
  pacote.link = montarLinkLista(carrinho, ajustes);

  // Guarda os dados para a pagina do orcamento ler (mesmo servidor/origem)
  sessionStorage.setItem("orcamentoPC", JSON.stringify(pacote));
  window.open("orcamento.html", "_blank");
}

/* ---------------------------------------------------------
   Copiar a chave Pix do autor
   --------------------------------------------------------- */
function copiarPix(botao) {
  const chave = "66d54436-3ad8-4db0-afbd-2bed7214d16b";
  const feedback = () => {
    if (!botao) return;
    const original = botao.textContent;
    botao.textContent = "Copiado!";
    botao.disabled = true;
    setTimeout(() => { botao.textContent = original; botao.disabled = false; }, 1600);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(chave).then(feedback).catch(() => copiaManual(chave, feedback));
  } else {
    copiaManual(chave, feedback);
  }
}
function copiaManual(texto, aoConcluir) {
  const ta = document.createElement("textarea");
  ta.value = texto; ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.focus(); ta.select();
  try { document.execCommand("copy"); aoConcluir(); }
  catch { alert("Chave Pix: " + texto); }
  document.body.removeChild(ta);
}

function abrirCarrinho() {
  document.getElementById("carrinho").classList.add("aberto");
  document.getElementById("carrinho").setAttribute("aria-hidden", "false");
  const fundo = document.getElementById("fundoEscuro");
  fundo.hidden = false;
  requestAnimationFrame(() => fundo.classList.add("visivel"));
}
function fecharCarrinho() {
  document.getElementById("carrinho").classList.remove("aberto");
  document.getElementById("carrinho").setAttribute("aria-hidden", "true");
  const fundo = document.getElementById("fundoEscuro");
  fundo.classList.remove("visivel");
  setTimeout(() => { fundo.hidden = true; }, 250);
}

/* ---------------------------------------------------------
   8) NAVEGACAO ENTRE ABAS
   --------------------------------------------------------- */
function trocarAba(aba) {
  document.querySelectorAll(".aba").forEach(s => s.classList.add("oculta"));
  document.getElementById("aba-" + aba)?.classList.remove("oculta");

  document.querySelectorAll(".navegacao__botao").forEach(b => {
    b.classList.toggle("ativo", b.dataset.aba === aba);
  });

  // Fecha o menu mobile e sobe a pagina
  document.querySelector(".navegacao")?.classList.remove("aberto");
  document.getElementById("menuHamburguer")?.setAttribute("aria-expanded", "false");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------------------------------------------------------
   9) INICIALIZACAO E EVENTOS
   --------------------------------------------------------- */
async function iniciar() {
  // Ajusta o valor inicial do input de cotacao
  document.getElementById("inputCotacao").value = CONFIG.cotacaoDolar.toFixed(2);

  try {
    TODAS_AS_PECAS = await carregarDados();
  } catch (erro) {
    console.error("Erro ao carregar os dados:", erro);
    TODAS_AS_PECAS = [];
  }

  // Veio de um link compartilhado? Entao nem monta a home: vai direto pra lista.
  if (await abrirListaDoLink()) return;

  montarPagina("xeon", "listaXeon");
  montarPagina("atual", "listaAtual");
  atualizarCarrinho();
  atualizarBotoesRecomendacao();
  avisarLinkQuebrado();

  // Nao travamos a tela esperando a internet: a pagina abre com o valor do
  // CONFIG e, quando a cotacao chega, os precos sao recalculados.
  aplicarCotacaoAutomatica();
}

document.addEventListener("DOMContentLoaded", () => {
  iniciar();

  // Navegacao (funciona para qualquer elemento com data-aba)
  document.body.addEventListener("click", (e) => {
    const alvoAba = e.target.closest("[data-aba]");
    if (alvoAba) { e.preventDefault(); trocarAba(alvoAba.dataset.aba); return; }

    const chaveAlternar = e.target.closest(".alternar");
    if (chaveAlternar) {
      alternarAjuste(Number(chaveAlternar.dataset.indice), chaveAlternar.dataset.alternar);
      return;
    }
    if (e.target.closest("#restaurarAjustes")) { restaurarAjustes(); return; }

    const botaoIntegrado = e.target.closest("[data-video-integrado]");
    if (botaoIntegrado) { alternarVideoIntegrado(botaoIntegrado.dataset.videoIntegrado); return; }

    const botaoRecomendado = e.target.closest("[data-lista-recomendada]");
    if (botaoRecomendado) {
      abrirListaRecomendada(botaoRecomendado.dataset.listaRecomendada);
      return;
    }

    const botaoAddon = e.target.closest(".addon__botao");
    if (botaoAddon) { adicionarAoCarrinho(botaoAddon.dataset.chave); return; }

    const botaoAdd = e.target.closest(".peca__adicionar");
    if (botaoAdd) { adicionarAoCarrinho(botaoAdd.dataset.chave); return; }

    const botaoRemove = e.target.closest(".item-carrinho__remover");
    if (botaoRemove) { removerDoCarrinho(Number(botaoRemove.dataset.indice)); return; }

    // O link da loja tem trabalho proprio (abrir nova aba): nao abre a janela.
    if (e.target.closest(".peca__link")) return;

    // Clique em qualquer outro ponto do card abre o detalhe da peca.
    const card = e.target.closest(".peca");
    if (card && card.dataset.chave) { abrirDetalhe(card.dataset.chave); return; }
  });

  // Abrir / fechar simulador
  document.getElementById("abrirCarrinho").addEventListener("click", abrirCarrinho);
  document.getElementById("carrinhoFlutuante").addEventListener("click", abrirCarrinho);
  document.getElementById("fecharCarrinho").addEventListener("click", fecharCarrinho);
  document.getElementById("fundoEscuro").addEventListener("click", fecharCarrinho);

  // Janela de detalhe: fecha no X e clicando fora da caixa
  document.getElementById("detalheFechar").addEventListener("click", fecharDetalhe);
  document.getElementById("detalheFundo").addEventListener("click", fecharDetalhe);

  // Esc fecha primeiro a janela de detalhe; se nao houver, fecha o carrinho.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (detalheEstaAberto()) fecharDetalhe(); else fecharCarrinho();
  });

  // Limpar carrinho
  document.getElementById("limparCarrinho").addEventListener("click", () => {
    carrinho.length = 0; ajustesCarrinho.length = 0; atualizarCarrinho();
  });

  // Gerar lista orcamentaria
  document.getElementById("gerarOrcamento").addEventListener("click", gerarOrcamento);

  // Menu hamburguer (mobile)
  document.getElementById("menuHamburguer").addEventListener("click", (e) => {
    const nav = document.querySelector(".navegacao");
    const aberto = nav.classList.toggle("aberto");
    e.currentTarget.setAttribute("aria-expanded", aberto ? "true" : "false");
  });

  // Cotacao do dolar ao vivo -> recalcula tudo
  document.getElementById("inputCotacao").addEventListener("input", (e) => {
    cotacaoMexidaPeloVisitante = true;
    COTACAO_AUTOMATICA = false;
    const aviso = document.getElementById("avisoCotacao");
    if (aviso) aviso.textContent = "Você está usando um valor digitado.";
    const valor = parseFloat(e.target.value);
    if (!isNaN(valor) && valor > 0) {
      CONFIG.cotacaoDolar = valor;
      montarPagina("xeon", "listaXeon");
      montarPagina("atual", "listaAtual");
      atualizarCarrinho();
    }
  });
});
