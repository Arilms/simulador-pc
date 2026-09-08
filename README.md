# Simulador PC Chinês x PC Nacional

O site é um simulador e comparador de peças para montar um PC: peças importadas da China (a plataforma Xeon LGA2011-3, que é barata no AliExpress) contra peças que já estão à venda no Brasil. O cálculo do imposto de importação é automático e segue a regra em vigor (Medida Provisória 1.357/2026 e a portaria do Ministério da Fazenda que a regulamentou). A pessoa escolhe as peças que quer, vê o preço final com frete, imposto e o dólar do dia, e sai com uma lista organizada com os preços e os links das lojas.

Site no ar: https://parabolicasbrasil.com.br/simulador-pc/
Cópia no GitHub Pages: https://arilms.github.io/simulador-pc/

## Como o site nasceu

Na minha família, tios e primos vinham me perguntar sobre peça de PC, equipamento, o que comprar. Antes eu pegava link por link dos produtos, colocava tudo no carrinho de um site, somava e mandava o valor e os links para a pessoa. De tanto fazer isso, resolvi montar um site que já tem o que eu recomendo e que gera a lista orçamentária sozinho. A ideia era ser simples o bastante para qualquer pessoa da família usar sem me chamar. Comecei no início de 2026. Hoje quem usa são amigos, primos e tios, e como o link circula, é possível que gente de fora já esteja usando também.

## O que o site faz

- Calcula o imposto de importação por faixa: até US$ 50 só ICMS; acima de US$ 50, Imposto de Importação de 60% com desconto fixo de US$ 30 e ICMS "por dentro"; acima de US$ 3.000 avisa que saiu do regime simplificado.
- Busca a cotação do dólar do dia em duas fontes gratuitas. Se as duas falharem, usa um valor fixo e avisa na tela.
- Filtra a compatibilidade entre processador, placa-mãe e memória (AM4, AM5, LGA1700, LGA2011-3, DDR4/DDR5), lendo da planilha ou deduzindo pelo nome da peça.
- Lê as peças direto de uma planilha do Google Sheets. Eu atualizo a planilha e o site muda sozinho, sem mexer em código.
- Guarda o carrinho no navegador: a pessoa pode fechar a aba e voltar depois.
- Gera a lista orçamentária com link curto para compartilhar (`?lista=x1,a12`), exportação em PDF, CSV e TXT, e chaves para simular "sem frete" ou "sem imposto". Tirar o frete não é só subtrair, porque o imposto incide sobre produto mais frete, então o site recalcula do zero.
- Cuida de detalhes do hardware Xeon: módulo TPM certo para cada placa-mãe, aviso de que o Xeon não tem vídeo integrado.

## Como foi feito

O site foi feito com ajuda de IA. O código foi escrito na maior parte pelo Claude, a partir do que eu pedia e explicava. O Gemini eu usei para revisar ideias e sugerir o que podia melhorar. A parte do imposto foi assim: eu acompanho a política nacional e sabia da mudança na tributação das compras da China, então peguei o texto da norma alterada, mandei para o Gemini e montamos juntos a regra de cálculo.

Eu fui o testador do site, no celular e no PC. Como o código veio de IA, apareceram vários bugs. Todos que eu encontrei foram corrigidos. Em várias partes eu mesmo alterei o código pelo VS Code, principalmente ajustes pequenos, para economizar os créditos da IA; as mudanças maiores eu pedi ao Claude e revisei por cima.

## O que ainda não resolvi

Os preços das peças eu atualizo na mão, na planilha, num dia marcado. Queria que fosse automático, puxando das lojas, mas ainda não achei um jeito que funcione sem servidor e sem quebrar quando a loja muda a página. A cotação do dólar é a única coisa que já vem sozinha.

Outro ponto: a regra do imposto tende a mudar de novo (o Congresso aprovou a MP com autorização para baixar a alíquota acima de US$ 50 para 30%). As alíquotas ficam todas no topo do `app.js`, em `CONFIG`, justamente para eu trocar rápido quando isso acontecer.

## Estrutura

HTML, CSS e JavaScript puros, sem framework. A única biblioteca externa é o jsPDF, só para gerar o PDF.

| arquivo | função |
|---|---|
| `index.html` | páginas do PC Chinês e do PC Nacional e o simulador |
| `orcamento.html` | página da lista orçamentária |
| `app.js` | leitura da planilha, simulador, compatibilidade e cálculo de impostos |
| `estilo.css` | visual e responsividade |
| `LEIAME.md` | manual de operação: colunas da planilha, regras de cálculo e manutenção |

## Como rodar localmente

1. Clone o repositório.
2. Sirva a pasta com um servidor local (por exemplo `python -m http.server` e abra `http://localhost:8000`). Abrir o `index.html` direto do disco não funciona, porque o navegador bloqueia a leitura da planilha via `file://`.
3. O site lê a planilha configurada em `CONFIG.sheetId`, no topo do `app.js`. Para usar a sua, siga a seção 2 do `LEIAME.md`.

## Autor

José Arilmar Saldanha Fontenele Neto, estudante de Estatística na UFC.
[linkedin.com/in/arilmar](https://linkedin.com/in/arilmar)

*In English: a static web app that compares the cost of building a PC in Brazil from imported (China) vs. domestic parts, with live exchange rate, Brazilian import tax rules, compatibility filtering and shareable budget lists. Vanilla JS, Google Sheets as the data source. Built with AI assistance (Claude for code, Gemini for review), tested and maintained by me.*
