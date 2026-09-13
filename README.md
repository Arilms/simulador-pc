🇧🇷 [Para ler em Português, clique aqui.](#-versão-em-português)  
🇺🇸 [For the English version, click here.](#-english-version)

---

## 🇧🇷 Versão em Português

# Simulador PC Chinês x PC Nacional

O site é um simulador e comparador de peças para montar um PC: peças importadas da China (a plataforma Xeon LGA2011-3, que é barata no AliExpress) contra peças que já estão à venda no Brasil. O cálculo do imposto de importação é automático e segue a regra em vigor (Medida Provisória 1.357/2026 e a portaria do Ministério da Fazenda que a regulamentou). A pessoa escolhe as peças que quer, vê o preço final com frete, imposto e o dólar do dia, e sai com uma lista organizada com os preços e os links das lojas.

**Site no ar:** https://parabolicasbrasil.com.br/simulador-pc/  
**Cópia no GitHub Pages:** https://arilms.github.io/simulador-pc/

### Como o site nasceu

Na minha família, tios e primos vinham me perguntar sobre peça de PC, equipamento, o que comprar. Antes eu pegava link por link dos produtos, colocava tudo no carrinho de um site, somava e mandava o valor e os links para a pessoa. De tanto fazer isso, resolvi montar um site que já tem o que eu recomendo e que gera a lista orçamentária sozinho. A ideia era ser simples o bastante para qualquer pessoa da família usar sem me chamar. Comecei no início de 2026. Hoje quem usa são amigos, primos e tios, e como o link circula, é possível que gente de fora já esteja usando também.

### O que o site faz

- Calcula o imposto de importação por faixa: até US$ 50 só ICMS; acima de US$ 50, Imposto de Importação de 60% com desconto fixo de US$ 30 e ICMS "por dentro"; acima de US$ 3.000 avisa que saiu do regime simplificado.
- Busca a cotação do dólar do dia em duas fontes gratuitas. Se as duas falharem, usa um valor fixo e avisa na tela.
- Filtra a compatibilidade entre processador, placa-mãe e memória (AM4, AM5, LGA1700, LGA2011-3, DDR4/DDR5), lendo da planilha ou deduzindo pelo nome da peça.
- Lê as peças direto de uma planilha do Google Sheets. Eu atualizo a planilha e o site muda sozinho, sem mexer em código.
- Guarda o carrinho no navegador: a pessoa pode fechar a aba e voltar depois.
- Gera a lista orçamentária com link curto para compartilhar (`?lista=x1,a12`), exportação em PDF, CSV e TXT, e chaves para simular "sem frete" ou "sem imposto". Tirar o frete não é só subtrair, porque o imposto incide sobre produto mais frete, então o site recalcula do zero.
- Cuida de detalhes do hardware Xeon: módulo TPM certo para cada placa-mãe, aviso de que o Xeon não tem vídeo integrado.

### Como foi feito

Eu sou o dono do projeto: a ideia, a escolha das peças recomendadas, o que o site precisava fazer e como ele deveria funcionar para a família usar sem ajuda. A regra do imposto veio de eu acompanhar a política nacional: quando a tributação das compras da China mudou, peguei o texto da norma e transformei em regra de cálculo para o site.

Usei IA como ferramenta de desenvolvimento. O Claude escreveu o código a partir das minhas especificações e o Gemini serviu para revisar ideias e apontar melhorias. Eu conduzi o processo: testei tudo no celular e no PC, encontrei e mandei corrigir os bugs, fiz ajustes diretamente no VS Code e mantenho o site desde então, atualizando a base de peças e adaptando a regra do imposto quando a lei muda.

### O que ainda não resolvi

Os preços das peças eu atualizo na mão, na planilha, num dia marcado. Queria que fosse automático, puxando das lojas, mas ainda não achei um jeito que funcione sem servidor e sem quebrar quando a loja muda a página. A cotação do dólar é a única coisa que já vem sozinha.

Outro ponto: a regra do imposto tende a mudar de novo (o Congresso aprovou a MP com autorização para baixar a alíquota acima de US$ 50 para 30%). As alíquotas ficam todas no topo do `app.js`, em `CONFIG`, justamente para eu trocar rápido quando isso acontecer.

### Estrutura

HTML, CSS e JavaScript puros, sem framework. A única biblioteca externa é o jsPDF, só para gerar o PDF.

| arquivo | função |
|---|---|
| `index.html` | páginas do PC Chinês e do PC Nacional e o simulador |
| `orcamento.html` | página da lista orçamentária |
| `app.js` | leitura da planilha, simulador, compatibilidade e cálculo de impostos |
| `estilo.css` | visual e responsividade |
| `LEIAME.md` | manual de operação: colunas da planilha, regras de cálculo e manutenção |

### Como rodar localmente

1. Clone o repositório.
2. Sirva a pasta com um servidor local (por exemplo `python -m http.server` e abra `http://localhost:8000`). Abrir o `index.html` direto do disco não funciona, porque o navegador bloqueia a leitura da planilha via `file://`.
3. O site lê a planilha configurada em `CONFIG.sheetId`, no topo do `app.js`. Para usar a sua, siga a seção 2 do `LEIAME.md`.

### Autor

José Arilmar Saldanha Fontenele Neto, estudante de Estatística na UFC.  
[linkedin.com/in/arilmar](https://linkedin.com/in/arilmar)

---

## 🇺🇸 English Version

# Chinese PC vs. Domestic PC Simulator

This site is a PC building simulator and parts comparator: imported parts from China (the Xeon LGA2011-3 platform, which is cheap on AliExpress) against parts already sold in Brazil. The import tax calculation is automatic and follows the rule currently in force (Provisional Measure 1.357/2026 and the Ministry of Finance ordinance that regulates it). The user picks the parts, sees the final price with shipping, tax and the day's exchange rate, and gets an organized list with prices and store links.

**Live site:** https://parabolicasbrasil.com.br/simulador-pc/  
**GitHub Pages mirror:** https://arilms.github.io/simulador-pc/

### Background

In my family, uncles and cousins kept asking me about PC parts and what to buy. I used to collect product links one by one, add everything to a store's cart, sum it up and send the total and the links back. After doing this many times, I decided to build a site with my recommendations that generates the budget list by itself. The goal was to be simple enough for anyone in the family to use without calling me. I started in early 2026. Today it is used by friends and family, and since the link gets shared around, people outside the family may be using it too.

### Features

- Computes import tax by tier: up to US$ 50 only ICMS (state tax); above US$ 50, 60% import tax with a flat US$ 30 discount and grossed-up ICMS; above US$ 3,000 it warns that the purchase leaves the simplified regime.
- Fetches the daily USD exchange rate from two free sources. If both fail, it falls back to a fixed value and shows a warning.
- Filters compatibility between CPU, motherboard and RAM (AM4, AM5, LGA1700, LGA2011-3, DDR4/DDR5), from spreadsheet fields or by inferring from the part name.
- Reads parts straight from a Google Sheets spreadsheet. I update the sheet and the site changes by itself, no code involved.
- Saves the cart in the browser: the user can close the tab and come back later.
- Generates a budget list with a short shareable link (`?lista=x1,a12`), export to PDF, CSV and TXT, and toggles to simulate "no shipping" or "no tax". Removing shipping is not a plain subtraction, because tax applies to product plus shipping, so the site recalculates from scratch.
- Handles Xeon hardware details: the right TPM module for each motherboard, and a warning that Xeon CPUs have no integrated graphics.

### How it was built

I own the project: the idea, the curated part recommendations, what the site needed to do and how it should work so my family could use it without help. The tax rule came from following national politics: when taxation on purchases from China changed, I took the text of the regulation and turned it into the site's calculation rule.

I used AI as a development tool. Claude wrote the code from my specifications and Gemini was used to review ideas and suggest improvements. I drove the process: tested everything on mobile and desktop, found the bugs and had them fixed, made adjustments directly in VS Code, and have maintained the site since, updating the parts database and adapting the tax rule when the law changes.

### What I have not solved yet

Part prices are updated by hand, in the spreadsheet, on a set day. I would like it to be automatic, pulling from the stores, but I have not found a way that works without a server and without breaking whenever a store changes its page. The exchange rate is the only thing that already updates on its own.

Another point: the tax rule is likely to change again (Congress approved the Provisional Measure with authorization to lower the rate above US$ 50 to 30%). All rates live at the top of `app.js`, in `CONFIG`, precisely so I can swap them quickly when that happens.

### Structure

Plain HTML, CSS and JavaScript, no framework. The only external library is jsPDF, used just to generate the PDF.

| file | role |
|---|---|
| `index.html` | Chinese PC and Domestic PC pages and the simulator |
| `orcamento.html` | budget list page |
| `app.js` | spreadsheet loading, simulator, compatibility and tax math |
| `estilo.css` | styling and responsiveness |
| `LEIAME.md` | operation manual (Portuguese): spreadsheet columns, calculation rules and maintenance |

### Running locally

1. Clone the repository.
2. Serve the folder with a local server (for example `python -m http.server` and open `http://localhost:8000`). Opening `index.html` straight from disk does not work, because the browser blocks reading the spreadsheet via `file://`.
3. The site reads the spreadsheet set in `CONFIG.sheetId`, at the top of `app.js`. To use your own, follow section 2 of `LEIAME.md`.

### Author

José Arilmar Saldanha Fontenele Neto, Statistics undergraduate at the Federal University of Ceará (UFC).  
[linkedin.com/in/arilmar](https://linkedin.com/in/arilmar)
