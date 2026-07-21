/* ==================================================================
   SOURCE — sale.js
   Lógica exclusiva da página de Catálogo/Sale.

   Fica separado do app.js de propósito: o app.js cuida do que é
   GLOBAL do site (tema, header, auth); este arquivo cuida só do
   catálogo. Assim, páginas que não são o catálogo (index, login)
   nem precisam carregar esse script.

   ARQUITETURA PENSANDO NO SUPABASE:
   O array PRODUTOS abaixo é um "mock" — dados fixos, escritos à mão,
   simulando o que viria do banco de dados. Quando o Supabase entrar,
   a ideia é substituir só a função obterProdutos() por uma consulta
   real (`await supabase.from('produtos').select('*')`), mantendo
   render/filtro/ordenação exatamente como estão.
================================================================== */

const PRODUTOS = [
  {
    id: 'p1',
    tipo: 'camiseta',
    colecao: 'Drop 1',
    nome: 'Camiseta Max Style',
    preco: 180.0,
    corPrincipal: '#111111',
    coresDisponiveis: ['#111111', '#1c3f8f', '#4a2e1d', '#f2ede2'],
    tamanhosDisponiveis: ['PP', 'M', 'G', 'GG'],
  },
  {
    id: 'p2',
    tipo: 'camiseta',
    colecao: 'Drop 1',
    nome: 'Camiseta Max Style',
    preco: 180.0,
    corPrincipal: '#1c3f8f',
    coresDisponiveis: ['#111111', '#1c3f8f', '#4a2e1d', '#f2ede2'],
    tamanhosDisponiveis: ['PP', 'M', 'G', 'GG'],
  },
  {
    id: 'p3',
    tipo: 'camiseta',
    colecao: 'Drop 1',
    nome: 'Camiseta Max Style',
    preco: 180.0,
    corPrincipal: '#4a2e1d',
    coresDisponiveis: ['#111111', '#1c3f8f', '#4a2e1d', '#f2ede2'],
    tamanhosDisponiveis: ['PP', 'M', 'G', 'GG'],
  },
  {
    id: 'p4',
    tipo: 'camiseta',
    colecao: 'Drop 1',
    nome: 'Camiseta Max Style',
    preco: 180.0,
    corPrincipal: '#f2ede2',
    coresDisponiveis: ['#111111', '#1c3f8f', '#4a2e1d', '#f2ede2'],
    tamanhosDisponiveis: ['PP', 'M', 'G', 'GG'],
  },
  {
    id: 'p5',
    tipo: 'moletom',
    colecao: 'Drop 1',
    nome: 'Moletom Oversized Street',
    preco: 320.0,
    corPrincipal: '#111111',
    coresDisponiveis: ['#111111'],
    tamanhosDisponiveis: ['PP', 'M', 'G', 'GG'],
  },
  {
    id: 'p6',
    tipo: 'calca',
    colecao: 'Drop 1',
    nome: 'Calça Cargo Street',
    preco: 280.0,
    corPrincipal: '#111111',
    coresDisponiveis: ['#111111'],
    tamanhosDisponiveis: ['PP', 'M', 'G', 'GG'],
  },
];

/* ------------------------------------------------------------------
   PARCELAMENTO
   Regra simples e fixa por enquanto (3x sem juros). Se um dia cada
   produto precisar de uma regra diferente, é só criar um campo
   "parcelas" no próprio objeto do produto e usar ele aqui no lugar
   da constante.
------------------------------------------------------------------- */
const NUMERO_PARCELAS = 3;

function formatarParcelamento(preco) {
  const valorParcela = preco / NUMERO_PARCELAS;
  return `ou ${NUMERO_PARCELAS}x de ${formatarPreco(valorParcela)} sem juros`;
}

/**
 * Simula a busca de produtos (troque pelo Supabase no futuro).
 */
function obterProdutos() {
  return PRODUTOS;
}

function formatarPreco(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/* ------------------------------------------------------------------
   ÍCONES DE PRODUTO (placeholder)
   Enquanto não temos fotos reais, cada peça vira um ícone simples em
   SVG, colorido com a cor do produto — assim os cards já diferenciam
   visualmente uma peça preta de uma azul, por exemplo. Quando as
   fotos da campanha estiverem prontas, troque estes SVGs por
   <img src="..."> dentro de .product-card__image-wrapper.
------------------------------------------------------------------- */
function criarIconeProduto(tipo, cor) {
  const icones = {
    camiseta: `
      <svg viewBox="0 0 64 64" fill="${cor}" aria-hidden="true">
        <path d="M22 4 L8 15 L15 26 L22 21 V60 H42 V21 L49 26 L56 15 L42 4 L36 10 H28 Z" />
      </svg>`,
    moletom: `
      <svg viewBox="0 0 64 64" fill="${cor}" aria-hidden="true">
        <path d="M20 6 L6 17 L13 28 L20 23 V58 H27 V44 H37 V58 H44 V23 L51 28 L58 17 L44 6 L37 12 H27 Z" />
        <circle cx="32" cy="9" r="4" fill="none" stroke="${cor}" stroke-width="2" />
      </svg>`,
    calca: `
      <svg viewBox="0 0 64 64" fill="${cor}" aria-hidden="true">
        <path d="M17 4 H47 L49 60 H37 L33 26 L29 60 H17 Z" />
      </svg>`,
  };
  return icones[tipo] || icones.camiseta;
}

/**
 * Monta o HTML de um único card de produto.
 */
function criarCardProduto(produto) {
  const tamanhos = produto.tamanhosDisponiveis
    .map((tamanho) => `<span class="product-card__size">${tamanho}</span>`)
    .join('');

  return `
    <article class="product-card">
      <div class="product-card__image-wrapper" role="img" aria-label="${produto.nome}">
        ${criarIconeProduto(produto.tipo, produto.corPrincipal)}
      </div>
      <div class="product-card__info">
        <p class="product-card__title">${produto.colecao} — ${produto.nome}</p>
        <p class="product-card__price">${formatarPreco(produto.preco)}</p>
        <p class="product-card__installment">${formatarParcelamento(produto.preco)}</p>
        <div class="product-card__sizes" aria-label="Tamanhos disponíveis">${tamanhos}</div>
      </div>
    </article>
  `;
}

/**
 * Renderiza a lista de produtos dentro do .product-grid e atualiza
 * o contador de itens da barra de filtros.
 */
function renderizarProdutos(lista) {
  const grid = document.getElementById('product-grid');
  if (!grid) return; // esta página não tem catálogo

  grid.innerHTML = lista.map(criarCardProduto).join('');

  const contador = document.getElementById('catalog-count');
  if (contador) {
    contador.textContent = `${lista.length} produto${lista.length !== 1 ? 's' : ''}`;
  }
}

/**
 * Aplica o filtro de categoria + a ordenação escolhida, e renderiza
 * o resultado. Sempre parte da lista completa (PRODUTOS), nunca da
 * lista já filtrada — assim os filtros não se acumulam por engano.
 */
function aplicarFiltrosEOrdenacao() {
  const filtroCategoria = document.getElementById('catalog-filter-categoria');
  const ordenacao = document.getElementById('catalog-sort');

  let lista = obterProdutos();

  const categoriaEscolhida = filtroCategoria ? filtroCategoria.value : 'todos';
  if (categoriaEscolhida !== 'todos') {
    lista = lista.filter((produto) => produto.tipo === categoriaEscolhida);
  }

  const criterioOrdenacao = ordenacao ? ordenacao.value : 'relevancia';
  if (criterioOrdenacao === 'menor-preco') {
    lista = [...lista].sort((a, b) => a.preco - b.preco);
  } else if (criterioOrdenacao === 'maior-preco') {
    lista = [...lista].sort((a, b) => b.preco - a.preco);
  }

  renderizarProdutos(lista);
}

function configurarCatalogo() {
  const grid = document.getElementById('product-grid');
  if (!grid) return; // esta página não é o catálogo

  aplicarFiltrosEOrdenacao(); // renderização inicial

  const filtroCategoria = document.getElementById('catalog-filter-categoria');
  const ordenacao = document.getElementById('catalog-sort');

  if (filtroCategoria) filtroCategoria.addEventListener('change', aplicarFiltrosEOrdenacao);
  if (ordenacao) ordenacao.addEventListener('change', aplicarFiltrosEOrdenacao);
}

document.addEventListener('DOMContentLoaded', configurarCatalogo);
