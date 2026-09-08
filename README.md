# Simulador PC Chinês × PC Nacional

Comparador de custo real para montar um PC no Brasil: peças importadas da China (plataforma Xeon LGA2011-3, com cálculo automático de imposto de importação) versus peças nacionais. O visitante monta a configuração, vê o custo final já com frete, imposto e câmbio do dia, e gera uma lista orçamentária compartilhável.

**Site no ar:** https://parabolicasbrasil.com.br/simulador-pc/
**Versão no GitHub Pages:** https://arilms.github.io/simulador-pc/

> *English summary:* a static web app that compares the total cost of building a PC in Brazil from imported (China) vs. domestic parts, with live exchange rates, Brazilian import-tax rules, socket/memory compatibility filtering, and shareable budget lists. Vanilla JS, no dependencies, Google Sheets as the data source.

## O que o simulador faz

- **Cálculo de imposto de importação** conforme o regime Remessa Conforme: faixa isenta abaixo de US$ 50, Imposto de Importação de 60% com desconto fixo de US$ 30 acima disso, ICMS "por dentro", e alerta quando o valor sai do regime simplificado.
- **Cotação do dólar automática**, com duas fontes gratuitas e fallback para valor fixo; o site nunca para por falha de API.
- **Filtro de compatibilidade** processador × placa-mãe × memória, por soquete (AM4, AM5, LGA1700, LGA2011-3...) e tipo de memória (DDR4/DDR5), lendo da planilha ou inferindo pelo nome da peça.
- **Base de dados em Google Sheets**, lida direto pelo navegador: editar a planilha atualiza o site, sem backend.
- **Carrinho persistente** (`localStorage`): o visitante pode fechar a aba e voltar; só os códigos das peças são guardados, e os preços são recalculados na volta.
- **Lista orçamentária** com link curto compartilhável (`?lista=x1,x27f,a12i`), exportação em PDF, CSV e TXT, e chaves para simular "sem frete" ou "sem imposto" com recálculo correto (o imposto incide sobre produto + frete, então não basta subtrair).
- **Regras de negócio específicas do hardware Xeon**: módulo TPM casado com a placa-mãe, ausência de vídeo integrado, selos de categoria.

## Tecnologias

HTML, CSS e JavaScript puros, sem framework nem build. Uma biblioteca externa (jsPDF via cdnjs) só para o PDF, com fallback para a impressão do navegador.

| arquivo | função |
|---|---|
| `index.html` | estrutura das páginas e sprite de ícones SVG |
| `orcamento.html` | página da lista orçamentária |
| `app.js` | leitura dos dados, simulador, compatibilidade e cálculo de impostos |
| `estilo.css` | visual e responsividade |
| `LEIAME.md` | manual de operação: colunas da planilha, regras de cálculo e manutenção |

## Como rodar localmente

1. Clone o repositório.
2. Sirva a pasta com um servidor local (por exemplo `python -m http.server` e abra `http://localhost:8000`). Abrir o `index.html` direto do disco não funciona porque o navegador bloqueia a leitura da planilha via `file://`.
3. O site lê a planilha pública configurada em `CONFIG.sheetId` (topo do `app.js`). Para usar a sua, siga a seção 2 do `LEIAME.md`.

## Sobre o desenvolvimento

O projeto nasceu de uma necessidade real: [uma ou duas frases sobre por que você quis comparar PC Xeon importado com PC nacional — para quem, em que contexto].

Foi desenvolvido com apoio de assistentes de IA (Claude e Gemini) usados como par de programação. Minha parte foi [ajuste conforme a realidade: concepção e regras de negócio, levantamento das regras de imposto e da compatibilidade de hardware, montagem e manutenção da base de dados, testes e correção de bugs em produção]. A experiência de conduzir um projeto inteiro com LLMs — especificar, revisar o código gerado, encontrar erros e iterar — foi tão parte do aprendizado quanto o resultado.

## Autor

José Arilmar Saldanha Fontenele Neto — estudante de Estatística (UFC)
[linkedin.com/in/arilmar](https://linkedin.com/in/arilmar)
