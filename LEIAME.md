# Comparador PC Xeon (China) x PC Atual (Brasil)

Site pronto para subir no seu servidor. Sao 6 arquivos:

- `index.html` ,  estrutura das paginas
- `orcamento.html` ,  pagina da lista orcamentaria (abre ao gerar o orcamento)
- `estilo.css` ,  visual e responsividade (Desktop e Mobile)
- `app.js` ,  leitura dos dados, simulador e calculo de impostos
- `dados.json` ,  dados de exemplo (funciona sem planilha nenhuma)

Suba todos na mesma pasta do servidor. Abre e ja funciona.

## IMPORTANTE ao subir uma atualizacao

No `index.html`, o CSS e o JS sao chamados com um numero de versao:

```html
<link rel="stylesheet" href="estilo.css?v=17">
<script src="app.js?v=17"></script>
```

**Toda vez que voce subir um `estilo.css` ou `app.js` novo, aumente esse numero** (v=4, v=5...)
nas duas linhas e suba o `index.html` junto. Sem isso, o navegador de quem ja visitou o site
continua usando a copia velha que guardou, e a atualizacao parece nao ter acontecido.

Para conferir se o navegador esta com a versao nova: abra o console (F12) e digite
`typeof iconeSVG`. Se responder `"function"`, e a versao nova. Se responder `"undefined"`,
ainda e a antiga (limpe o cache ou aumente o `?v=`).

---

## 1) Layout das colunas do Google Sheets

Crie uma planilha com **exatamente estas colunas na primeira linha** (nesta ordem, tudo minusculo):

| coluna | o que colocar | exemplo |
|---|---|---|
| `id` | numero unico **em toda a planilha**, nao so dentro da pagina. Se o `xeon` usa 1 a 20, o `atual` comeca em 21 | `1` |
| `pagina` | em qual aba a peca aparece: `xeon` ou `atual` | `xeon` |
| `categoria` | uma das: `Processador`, `Placa-mae`, `Placa de Video`, `Memoria RAM`, `SSD`, `Fonte`, `Cooler`, `Gabinete`, `Fan` (escreva exatamente assim, com maiuscula inicial e sem acento) | `Processador` |
| `nivel` | a chave do selo. Veja a tabela na secao **Selos (badges) das pecas** mais abaixo | `custo-beneficio` |
| `nome` | nome da peca | `Intel Xeon E5-2680 v4` |
| `preco` | numero, com **ponto** decimal (ex.: `42.5`) | `42` |
| `moeda` | `USD` para dolar (importado) ou `BRL` para real | `USD` |
| `origem` | `china` (importado, calcula imposto) ou `brasil` (nacional, imposto ja incluso) | `china` |
| `frete` | frete na mesma moeda; use `0` se nao souber | `0` |
| `loja` | nome da loja | `AliExpress` |
| `link_compra` | link completo do produto | `https://...` |
| `imagem` | link de uma foto (opcional; se vazio, mostra um icone) | `https://.../foto.jpg` |
| `comentarios` | frase curta de ajuda | `Roda bem jogos leves` |
| `recomendado` | **opcional.** `sim` nas pecas que entram na lista pronta de recomendacoes | `sim` |
| `plataforma` | **opcional.** soquete do processador e da placa-mae, para o filtro de compatibilidade: `AM4`, `AM5`, `LGA1700`, `LGA2011-3`... | `AM5` |
| `memoria` | **opcional.** tipo de memoria da placa-mae e do pente: `DDR4` ou `DDR5`. Sem ela, o site le do nome | `DDR4` |
| `video_integrado` | **opcional.** `nao` num processador que NAO tem video integrado. Sem ela, o site assume que os do PC Nacional tem | `nao` |

> A ordem das linhas nao importa: o site agrupa sozinho por categoria, sempre nesta sequencia:
> Processador, Placa-mae, Placa de Video, Memoria RAM, SSD, Fonte, Cooler, Gabinete, Fan.
> Quem manda nessa ordem e a constante `ORDEM_CATEGORIAS`, no topo do `app.js`.
>
> **Logotipo da loja:** nao existe coluna para isso. O site descobre o logotipo sozinho a partir
> do dominio do `link_compra` (ou do mapa `DOMINIO_LOJA`, no `app.js`). Se nao achar, mostra um
> quadradinho com a inicial do nome da loja.
>
> **Cuidado 1 - id repetido:** o `id` tem de ser unico na planilha inteira. Se o `xeon` e o `atual`
> usarem `1` cada um, o simulador acha sempre o primeiro e adiciona a peca errada ao orcamento.
> O `app.js` agora identifica a peca por `pagina + id`, o que protege contra isso, mas manter os
> ids unicos evita confusao ao editar.
>
> **Cuidado 2 - celula "vazia" que nao esta vazia:** para limpar uma celula use **Delete**, nunca
> a barra de espaco. Espaco (e principalmente o espaco de largura zero, que as vezes vem de copiar
> e colar) e invisivel na planilha mas conta como conteudo, e criava etiqueta fantasma nos cards.
> O `app.js` agora limpa esses caracteres ao ler, mas e bom nao coloca-los.
>
> **Cuidado 3 - linha pela metade:** linha com a categoria preenchida e o `nome` em branco e
> ignorada. E de proposito: melhor a secao nao aparecer do que aparecer um card sem nome e R$ 0,00.
>
> **`frete`:** conta no total tanto na peca importada quanto na nacional. Na nacional, quando o
> frete e maior que zero, o card passa a mostrar "Chega por R$ X com o frete".
>
> **Icones das pecas:** sao desenhos em SVG que ficam no proprio `index.html`, no bloco
> `<svg class="sprite-icones">`. Para trocar um desenho, mexe so ali.

## 2) Como transformar a planilha em fonte de dados (gratis, sem cadastro)

O site ja sabe ler o Google Sheets direto, sem servico pago. Faca assim:

1. Na planilha, clique em **Arquivo -> Compartilhar -> Publicar na Web** e confirme (ou deixe o compartilhamento como "qualquer pessoa com o link pode ver").
2. Copie o **ID da planilha**. Ele fica na URL, entre `/d/` e `/edit`:
   `https://docs.google.com/spreadsheets/d/`**`ESSE_PEDACO_E_O_ID`**`/edit`
3. Abra o `app.js` e preencha no topo (ja vem preenchido com a sua planilha):

```js
const CONFIG = {
  ...
  sheetId: "1a_FYjSv0y8omFbtdUCV5DZrC8nw4vKt_Tp6Gj_PUHxA",
  sheetName: "Base de Dados - Simulador PC (Xeon x Atual)"   // nome exato da aba
};
```

Pronto. Toda vez que voce editar a planilha, o site atualiza sozinho ao recarregar.
Se `sheetId` ficar vazio, o site usa o `dados.json` (util para testar).

> Alternativa: servicos como **SheetDB** ou **Sheety** tambem transformam a planilha em API,
> mas exigem cadastro e tem limite no plano gratis. O metodo acima nao precisa de nada disso.

## 3) Ajustar cambio e impostos

Tudo fica no topo do `app.js`, em `CONFIG`:

```js
cotacaoDolar: 5.50,          // quanto vale 1 dolar (tambem da pra mudar ao vivo no simulador)
aliquotaII: 0.60,            // Imposto de Importacao federal (acima de US$ 50)
aliquotaICMSate50: 0.20,     // ICMS na faixa abaixo de US$ 50 (por dentro)
aliquotaICMSacima50: 0.20,   // ICMS na faixa acima de US$ 50 (por dentro)
descontoII_USD: 30,          // desconto fixo no II para compras acima de US$ 50
limiteIsencaoUSD: 50,        // faixa em que nao ha imposto federal
```

**Importante:** as aliquotas de importacao no Brasil mudam de tempos em tempos.
Confirme os valores atuais antes de usar o site como referencia de decisao.

## Cotacao do dolar automatica

O site busca sozinho a cotacao do dolar do dia e ja preenche o campo do simulador.
Nao precisa cadastro nem chave: sao duas fontes gratuitas, e se a primeira nao responder
ele tenta a segunda.

1. `https://open.er-api.com/v6/latest/USD`
2. `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json`

Se as duas falharem (visitante sem internet, por exemplo), o site usa o valor fixo de
`CONFIG.cotacaoDolar` e avisa na tela que da para ajustar a mao. **O site nunca para por
causa disso.** O resultado fica guardado por 1 hora, para nao consultar a API a cada recarga.

Se o visitante digitar um valor no campo, o automatico para de sobrescrever: manda quem digitou.

> **Atencao:** a cotacao buscada e a do mercado. Compra no cartao ainda soma IOF e o spread
> do banco, entao o custo real fica um pouco acima. O aviso embaixo do campo diz isso.
> As fontes sao servicos de terceiros e podem sair do ar ou passar a cobrar (foi o que aconteceu
> com a AwesomeAPI, que hoje responde "QuotaExceeded"). Se um dia as duas pararem, troque as
> URLs na constante `FONTES_COTACAO`, no topo do `app.js`.

## Frete na lista orcamentaria

A coluna `frete` da planilha aparece na lista: a tabela tem colunas separadas de **Peca** e
**Frete**, e os totais ganham a linha "Total de frete". Assim Peca + Frete + Imposto = Total,
e da para conferir a conta. Vale para a tela, o PDF, o CSV e o TXT.

Listas geradas antes desta versao continuam abrindo normalmente: sem o campo, o frete aparece
como `--`.

## Icone da aba (favicon)

As duas paginas declaram `logo.svg` como icone. Sem essa declaracao o navegador procura um
`favicon.ico` na raiz do dominio e acaba mostrando o icone do WordPress hospedado la.
Para um icone melhor no "adicionar a tela de inicio" do iPhone, coloque um
`apple-touch-icon.png` (180x180) na mesma pasta.

## Como o imposto e calculado (peca importada, origem = china)

- **Abaixo de US$ 50:** sem imposto federal. So ICMS de 20% "por dentro" -> `valor = (produto + frete) / 0.80`.
- **Acima de US$ 50 (Remessa Conforme):**
  1. Imposto Federal (II) = `(produto + frete) x 0,60`
  2. Desconto fixo de US$ 30 sobre o II (o II nunca fica negativo)
  3. ICMS "por dentro" = `(produto + frete + II ja descontado) / (1 - 0,20)`
  4. Valor final = produto + frete + II + ICMS
- **origem = brasil:** nenhum imposto de importacao (o preco de loja ja inclui os tributos).
- **Acima de US$ 3.000:** sai do regime simplificado (Remessa Conforme) e vira importacao formal,
  com tributos que variam por produto. O site calcula pela regra acima e mostra um aviso. Nenhuma
  peca comum de PC chega a esse valor.

## Selos (badges) das pecas

O texto e a cor de cada selo saem de um dicionario no `app.js` chamado `BADGES`.
A chave da esquerda e **exatamente** o que voce escreve na coluna `nivel` da planilha:

| chave na planilha | aparece na tela | usar em |
|---|---|---|
| `entrada` | Modelo de Entrada | hardware geral |
| `custo-beneficio` | Custo-Beneficio | hardware geral |
| `alto-desempenho` | Alto Desempenho | hardware geral |
| `gabinete-basico` | Design Tradicional | Gabinete |
| `gabinete-airflow` | Maxima Refrigeracao (Airflow) | Gabinete |
| `gabinete-aquario` | Estilo Aquario Panoramico | Gabinete |
| `fan-led-fixo` | Conexao Direta (LED Fixo) | Fan |
| `fan-argb-hub` | Kit RGB Completo (Com Hub) | Fan |
| `fan-premium` | Refrigeracao Premium | Fan |
| `qiyida-h9s-machinist-mr9a` | Para Qiyida / MR9A | Modulo TPM |
| `machinist-v9s` | Para Machinist V9S | Modulo TPM |

**Para criar um selo novo:** acrescente uma linha no `BADGES` e, se quiser uma cor
inedita, uma regra `.selo--<cor>` no `estilo.css`. Mais nada precisa mudar.

Se voce digitar uma chave que nao existe (`gabinete-airfloww`, por exemplo), a peca
**nao some**: aparece um selo cinza com o texto arrumado e o console do navegador (F12)
avisa qual chave nao foi reconhecida. Serve para achar erro de digitacao.

A chave antiga `barata` continua funcionando e mostra "Modelo de Entrada", entao nada
quebra se sobrar alguma linha antiga na planilha.

## Compatibilidade Processador x Placa-mae

Ao escolher um processador, a secao de placas-mae passa a mostrar **so as que encaixam** , 
e vale nos dois sentidos: escolhendo a placa primeiro, os processadores e que sao filtrados.
Quem escolher primeiro e que manda; para ver tudo de novo, e so tirar a peca do simulador.

### Por que soquete, e nao marca

Separar "Intel" de "AMD" nao resolve. Um **Ryzen 5 5600** e AMD e uma **B650M** tambem e AMD,
mas o 5600 e soquete **AM4** e a B650M e **AM5**: nao encaixam de jeito nenhum. Por isso a
conta e feita por soquete.

### Como o site descobre o soquete

**(A) Coluna `plataforma` na planilha (recomendado)**
Crie uma coluna chamada `plataforma` e escreva o soquete de cada processador e placa-mae:
`AM4`, `AM5`, `LGA1700`, `LGA1851`, `LGA1200`, `LGA2011-3`. Escreveu uma vez, nunca mais erra.
Deixe vazio nas outras categorias.

**(B) Adivinhacao pelo nome (funciona sem a coluna)**
Sem a coluna, o site le o nome da peca. Reconhece:

- chipset da placa: `B550`, `A620`, `B650`, `B760`, `Z890`, `X99`...
- soquete escrito no nome: `AM4`, `AM5`, `LGA1700`...
- Ryzen pela geracao: modelos `1000` a `5000` = AM4; `7000`, `8000` e `9000` = AM5
- Intel Core pela geracao: `12xxx` a `14xxx` = LGA1700; `10xxx`/`11xxx` = LGA1200; Core Ultra = LGA1851
- Xeon E5 v3/v4 = LGA2011-3

> **Peca que o site nao reconhece nunca some da lista** ,  ela so deixa de participar do filtro.
> Preferi mostrar demais a esconder a peca certa por causa de um nome fora do padrao.
> Se uma peca sua tem nome fora do padrao, preencha a coluna `plataforma` para ela.

Se as duas pecas do carrinho nao encaixarem (por um link antigo, por exemplo), aparece um
alerta no simulador dizendo qual e o soquete de cada uma.

## Memoria: DDR4 x DDR5

A memoria tambem entra no filtro, mas com uma regra a mais: **quem manda no tipo de
memoria e a placa-mae, nao o processador**. O mesmo i5-12400 aceita DDR4 ou DDR5,
depende da placa LGA1700 que voce comprar.

Entao o site funciona assim:

1. **Placa-mae ja escolhida** -> a memoria segue o tipo dela (resposta exata).
2. **So o processador escolhido** -> o site olha as placas DAQUELE soquete que existem no
   SEU catalogo e aceita os tipos que elas usam. Se voce so cadastrou placas LGA1700 DDR4,
   so aparece DDR4, sem precisar configurar nada. No dia em que cadastrar uma LGA1700 DDR5,
   ela passa a aparecer sozinha.

O tipo sai da coluna `memoria` da planilha, ou do proprio nome (`16GB DDR4 3200MHz`).

## Trocar de processador limpa o que nao serve mais

A lista de processadores nunca e filtrada por ela mesma: com um AM4 escolhido, os AM5 e os
Intel continuam a vista, para dar pra trocar de ideia. Ao trocar por um de outro soquete,
a placa-mae e a memoria que ficaram incompativeis **saem do simulador sozinhas**, com um
aviso amarelo dizendo quais foram e por que.

Escolher outro processador tambem substitui o anterior, em vez de somar os dois: e uma peca
por categoria.

## Placa de video opcional (video integrado)

Na secao de placa de video do PC Nacional ha o botao **"Usar o video integrado do
processador (pular esta etapa)"**. Quem clica fecha o orcamento sem GPU nenhuma, e a placa
que estivesse escolhida sai da lista.

> **Esse botao NUNCA aparece no PC Chines.** O Xeon E5 e peca de servidor e **nao tem video
> integrado** ,  sem placa de video dedicada, aquele PC nao da imagem nenhuma. Deixar a opcao
> la seria empurrar o visitante para um computador que nao liga na tela.
>
> **Se voce cadastrar um processador nacional sem video integrado** (um Ryzen 5600 ou 5700X,
> por exemplo), preencha a coluna `video_integrado` com `nao` nessa linha. A etapa volta a
> ser obrigatoria automaticamente quando ele for escolhido.

## Desligar o preco de um item inteiro

Alem das chaves de frete e imposto, cada peca tem uma chave ao lado do nome que **desliga o
preco dela inteiro**. Serve para responder "quanto fica sem a placa de video?" ou "e se eu
deixar o SSD para depois?" sem tirar a peca da lista.

Funciona no recibo do simulador e na propria lista orcamentaria, com o total refeito na hora.
Na lista orcamentaria essa chave fica na **primeira coluna, chamada "Incluir"** (no celular vira
a primeira linha do bloco de cada peca, escrito "Incluir no total").
Com o item desligado, as chaves de frete e imposto dele somem (nao teriam efeito) e o valor
cheio fica riscado do lado, para voce nao esquecer quanto ele custava.

O estado viaja no link compartilhavel (letra `d` no codigo da peca) e sai marcado no PDF,
no CSV e no TXT.

## Modulo TPM (venda casada com a placa-mae)

> **Padrao de pinagem:** Qiyida H9S e Machinist MR9A PRO usam o modulo padrao **MSI**;
> Machinist V9S usa o padrao **ASUS**. E por isso que o site so mostra o modulo certo
> depois que a placa e escolhida.

O `Modulo TPM` e uma categoria como as outras na planilha, mas com duas regras a mais:

1. **So aparece no PC Chines.** Processador atual ja tem fTPM embutido, entao a secao nem
   e desenhada na aba do PC Nacional.
2. **So aparece depois da placa-mae.** Enquanto o visitante nao escolher a placa, a secao
   mostra um aviso explicando o porque. Escolhida a placa, aparecem **somente** os modulos
   que encaixam nela.

A ligacao entre placa e modulo fica na tabela `TPM_POR_PLACA`, no `app.js`:

```js
const TPM_POR_PLACA = [
  { termos: ["qiyida", "h9s"],     chave: "qiyida-h9s-machinist-mr9a" },
  { termos: ["machinist", "mr9a"], chave: "qiyida-h9s-machinist-mr9a" },
  { termos: ["machinist", "v9s"],  chave: "machinist-v9s" }
];
```

A regra vale quando **todos** os termos aparecem no nome da placa, sem depender de acento
nem de maiuscula. Por isso "MACHINIST MR9A PRO X99" casa com a segunda linha e nao e
confundida com a V9S. **Para suportar uma placa nova, basta acrescentar uma linha aqui.**

No simulador, quem montou um Xeon com placa compativel recebe o modulo como sugestao de
compra, com botao de adicionar. E se a placa for trocada depois de o modulo entrar na lista,
aparece um alerta avisando que os dois nao casam mais.

> Se a placa nao estiver na tabela, o site nao chuta: avisa que nao ha modulo cadastrado e
> recomenda conferir o conector TPM no manual. Preferi isso a oferecer um modulo que pode
> nao encaixar.

## Janela de detalhe da peca

Clicando em qualquer card (ou na lupa que aparece sobre a foto), abre uma janela com a
**imagem inteira da peca a esquerda** e, a direita, categoria, nome, loja, a descricao da
coluna `comentarios`, o preco e os mesmos dois botoes do card. Em peca importada, a janela
mostra tambem a conta aberta: valor da peca, impostos estimados e custo final.

Fecha no X, clicando fora, ou com a tecla Esc. No celular, imagem em cima e informacao embaixo.

**Dica sobre a coluna `imagem`:** a janela mostra a foto no tamanho real dela, sem cortar.
Se o link for de uma miniatura pequena (o AliExpress costuma dar links terminados em
`_220x220q75.jpg`), a foto vai aparecer pequena ou meio borrada. Quando puder, use o link da
imagem em tamanho cheio - normalmente e a mesma URL sem o pedaco `_220x220q75`.

## Ligar e desligar frete e imposto (simulacao)

No recibo do simulador e na lista orcamentaria, cada peca mostra quatro linhas:
**Peca**, **Frete**, **Imposto** e **Valor final**. O frete aparece sempre, mesmo quando
esta zerado na planilha.

Nas linhas de Frete e Imposto ha uma chavinha. Desligando, o valor fica riscado, o total
e refeito na hora e um aviso amarelo avisa que aquilo virou **simulacao**, nao o valor a
ser cobrado. O botao "Voltar tudo" religa todas de uma vez.

Serve para responder "quanto desse preco e imposto?" sem calculadora.

> **Detalhe importante da conta:** desligar o frete nao e simplesmente subtrair o frete.
> O imposto de importacao incide sobre produto + frete, entao ao tirar o frete o imposto
> tambem cai. Exemplo real: peca de R$ 231,00 com frete de R$ 66,00 paga R$ 74,25 de
> imposto; sem o frete, o imposto vira R$ 57,75. O site recalcula do zero, nao subtrai.

O estado das chaves viaja do simulador para a lista orcamentaria, e de la para o PDF, o
CSV e o TXT ,  todos saem com o aviso de simulacao quando alguma parcela esta desligada.

## Lista pronta das minhas recomendacoes

No fim do guia do PC Chines ha o botao **"Lista orcamentaria das minhas recomendacoes"**.
Ele abre a `orcamento.html` numa aba nova ja com a montagem que voce indica, com os precos
e impostos **calculados na hora** (com a cotacao do dia, nao com valores congelados).

Nao mexe no simulador do visitante: se ele ja tinha pecas escolhidas, elas continuam la.

### Como manter essa lista

Ha duas formas. A primeira e melhor, porque voce nunca mais precisa mexer em codigo:

**(A) Coluna `recomendado` na planilha (recomendado)**
Crie uma coluna chamada `recomendado` e escreva `sim` nas pecas que entram na lista
(tambem valem `s`, `x`, `1`). Trocou a peca indicada na planilha, a lista muda sozinha.
Quando essa coluna existir e tiver ao menos um `sim`, ela manda ,  a lista de nomes do
`app.js` passa a ser ignorada.

**(B) Lista de nomes no `app.js` (o que esta valendo agora)**
Fica na constante `RECOMENDACOES`, no topo do arquivo. Os nomes tem de bater com a coluna
`nome` da planilha. Se voce renomear a peca la, renomeie aqui tambem.

> **Atencao:** se um nome nao for encontrado, a peca **nao entra na conta** e a pagina do
> orcamento mostra um aviso amarelo dizendo qual peca faltou. O console (F12) tambem avisa.
> Isso e de proposito: pior do que a lista faltar uma peca e o visitante nao perceber que
> faltou e montar um PC sem cooler.
>
> Se nenhuma peca for encontrada (planilha fora do ar, por exemplo), o botao simplesmente
> nao aparece, em vez de dar erro no clique.

### Lista do PC Nacional

O botão já existe no fim do guia do PC Nacional, mas **só aparece quando houver peças marcadas**
na coluna `recomendado` das linhas de `pagina = atual`. Enquanto não houver nenhuma, o bloco fica
escondido em vez de abrir uma lista vazia.
## Link compartilhavel da lista

Toda lista orcamentaria tem um botao **"Copiar link desta lista"**. O link e curto o
bastante para mandar no WhatsApp ,  algo como:

```
https://parabolicasbrasil.com.br/simulador-pc/?lista=x1,x27f,a12i
```

Ha duas formas de link:

| forma | o que faz |
|---|---|
| `?lista=x1,x27f,a12i` | uma montagem especifica. `x` = PC Chines, `a` = PC Nacional, o numero e o `id` da planilha. As letras no fim marcam o que foi desligado: `f` = sem frete, `i` = sem imposto |
| `?rec=xeon` | a sua lista de recomendacoes, **sempre atualizada**. Trocou a peca indicada na planilha, quem tiver o link ja ve a nova. Bom para fixar em rede social ou na descricao de um video |

Quem abre o link cai direto na lista orcamentaria, sem passar pela home.

Na pagina da lista ha quatro botoes para isso:

- **Copiar link** ,  copia so o endereco, para colar onde quiser.
- **Compartilhar link** ,  abre a tela de compartilhar do celular (WhatsApp, Telegram, Notas).
  So aparece em aparelho que tem esse recurso; no computador comum ele nao e mostrado e o
  Copiar link cobre a mesma necessidade.
- **Copiar lista** / **Compartilhar lista** ,  mandam a lista inteira em texto. Desde esta
  versao o texto **termina com o link**, entao quem recebe consegue abrir a versao
  interativa com os precos atualizados.

> **Por que o link e curto:** ele nao carrega a lista inteira dentro dele, so a referencia
> das pecas (pagina + id). Embutir tudo daria uma URL de mais de 1.100 caracteres, que o
> WhatsApp quebra e parece link de golpe.
>
> **A troca que isso implica:** os precos sao os de HOJE, nao os do dia em que o link foi
> criado. Para lista de compras isso e o certo (preco velho nao serve para comprar), mas
> lembre que o valor total pode mudar entre voce mandar e a pessoa abrir ,  o dolar muda todo dia.
>
> **Se uma peca sair da planilha:** ela nao entra na conta e a pagina mostra um aviso amarelo
> dizendo qual faltou. Se nenhuma peca do link for encontrada, a pessoa cai na home com um
> recado explicando, em vez de ver uma lista vazia.
>
> **Depende do `id`:** o link aponta para o `id` da planilha. Se voce **reaproveitar um id**
> para outra peca, os links antigos passam a mostrar a peca nova. Nunca reuse id de peca
> apagada ,  sempre siga com o proximo numero.

## Lista orcamentaria

Depois de montar a simulacao, o botao **"Gerar lista orcamentaria"** (no rodape do simulador) abre a
pagina `orcamento.html` numa aba nova, com as pecas escolhidas, os links de compra e os totais.
De la da para **copiar a lista** (para colar em qualquer app), **compartilhar** pela tela nativa do
celular (WhatsApp, Notas, etc.), e **baixar em PDF, CSV (abre no Excel/Sheets) e TXT**, alem de imprimir.
O botao Compartilhar so aparece em aparelhos que suportam o recurso (praticamente todo celular); no
computador sem suporte, ele simplesmente nao e mostrado e o Copiar cobre a mesma necessidade.
O PDF usa uma biblioteca carregada da internet (cdnjs); se ela nao carregar, o botao cai na impressao
do navegador (opcao "Salvar como PDF"), entao nunca fica sem saida.

> Observacao: os botoes Copiar e Compartilhar precisam de HTTPS para funcionar (padrao dos navegadores).
> Como seu servidor ja serve em https, isso nao e problema.
