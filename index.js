/* ==================================================================
   SOURCE — index.js
   Lógica exclusiva da Home (index.html).

   REGRA ARQUITETURAL: o Hero (foto dupla, escolha de lado) só existe
   nesta página — por isso toda a lógica dele mora aqui agora, e não
   mais no app.js. O app.js continua cuidando só do que é
   VERDADEIRAMENTE global (tema salvo, carrinho, sessão, auth).
   aplicarModoGlobal() e salvarTemaEscolhido() continuam vindo do
   app.js (carregado antes deste script) — a escolha feita aqui no
   Hero ainda precisa "viajar" pelo site inteiro.

   Depende de funções/dados já carregados por scripts anteriores:
     - app.js  → aplicarModoGlobal, salvarTemaEscolhido, MODOS
     - sale.js → PRODUTOS, formatarPreco, formatarParcelamento,
                 criarIconeProduto, criarSeloLado, criarCardProduto
================================================================== */

const CONTEUDO_HERO = {
  quebrada: {
    pretitle: 'Edição especial — coleção Drop 1',
    headline: 'Onde a rua encontra o fino',
    sub: 'Peças que carregam a textura da cidade e a assinatura da rua.',
    cta: 'Explorar coleção',
  },
  realeza: {
    pretitle: 'Edição especial — coleção Drop 1',
    headline: 'Onde a rua encontra o fino',
    sub: 'Alfaiataria minimalista com precisão de corte e silêncio proposital.',
    cta: 'Explorar coleção',
  },
};

const heroEl = document.getElementById('hero');
let ladoEscolhidoNoHero = null; // null enquanto o Hero está em duality

/* ------------------------------------------------------------------
   TEXTO E ESTADO DO HERO
------------------------------------------------------------------- */
function atualizarTextoHero(lado) {
  const conteudo = CONTEUDO_HERO[lado];
  document.getElementById('hero-pretitle').textContent = conteudo.pretitle;
  document.getElementById('hero-headline').textContent = conteudo.headline;
  document.getElementById('hero-sub').textContent = conteudo.sub;

  const botaoCta = document.getElementById('hero-cta');
  botaoCta.textContent = conteudo.cta;
  botaoCta.hidden = false;
}

function escolherLadoHero(lado) {
  ladoEscolhidoNoHero = lado;

  heroEl.classList.remove('hero--quebrada', 'hero--realeza');
  heroEl.classList.add(lado === 'quebrada' ? 'hero--quebrada' : 'hero--realeza');
  heroEl.classList.add('hero--escolhido');

  atualizarTextoHero(lado);

  const modoGlobal = lado === 'quebrada' ? MODOS.QUEBRADA : MODOS.REALEZA;
  aplicarModoGlobal(modoGlobal);
  salvarTemaEscolhido(modoGlobal); // essa escolha "viaja" com o cliente pelo site
}

function configurarZonasDoHero() {
  document.querySelectorAll('.hero__zone').forEach((zona) => {
    zona.addEventListener('click', () => {
      escolherLadoHero(zona.dataset.mode);
    });
  });
}

/**
 * O botão "Explorar coleção" só fica visível depois que o cliente
 * escolhe um lado — nesse ponto, ladoEscolhidoNoHero já está definido,
 * então o guard clause aqui é só uma segurança extra.
 */
function configurarCtaHero() {
  const botaoCta = document.getElementById('hero-cta');
  if (!botaoCta) return;

  botaoCta.addEventListener('click', () => {
    if (!ladoEscolhidoNoHero) return;
    window.location.href = `sale.html?lado=${ladoEscolhidoNoHero}`;
  });
}

/* ------------------------------------------------------------------
   DROP DE LANÇAMENTO (produto em destaque)
   Reaproveita criarIconeProduto (de sale.js) pra montar frente/costas
   do mesmo jeito que produto.js faz na galeria — placeholder até
   termos fotos reais da campanha.
------------------------------------------------------------------- */
const ID_PRODUTO_DESTAQUE = 'p1';

function renderizarDropDestaque() {
  const container = document.getElementById('featured-drop-container');
  if (!container) return; // guard clause: página sem essa seção

  const produto = PRODUTOS.find((item) => item.id === ID_PRODUTO_DESTAQUE);
  if (!produto) return; // produto de destaque não existe mais no catálogo

  const icone = criarIconeProduto(produto.tipo, produto.corPrincipal);

  container.innerHTML = `
    <div class="featured-drop__card">
      <div class="featured-drop__imagem">
        <span class="featured-drop__label">Frente</span>
        ${icone}
      </div>
      <div class="featured-drop__imagem">
        <span class="featured-drop__label">Costas</span>
        ${icone}
      </div>
    </div>
    <div class="featured-drop__info">
      ${criarSeloLado(produto.lado)}
      <p class="featured-drop__titulo">${produto.colecao} — ${produto.nome}</p>
      <p class="featured-drop__preco">${formatarPreco(produto.preco)} · ${formatarParcelamento(produto.preco)}</p>
    </div>
  `;

  const botaoCta = document.getElementById('featured-drop-cta');
  if (botaoCta) botaoCta.href = `produto.html?id=${produto.id}`;
}

/* ------------------------------------------------------------------
   VITRINE DE PRODUTOS (recorte curado do catálogo)
   Reaproveita criarCardProduto (sale.js) — mesmo card usado em
   sale.html, garantindo consistência visual entre home e catálogo.
------------------------------------------------------------------- */
const IDS_VITRINE_HOME = ['p1', 'p3', 'p5', 'p7'];

function renderizarVitrineHome() {
  const grid = document.getElementById('home-showcase-grid');
  if (!grid) return; // guard clause: página sem essa seção

  const produtosVitrine = IDS_VITRINE_HOME
    .map((id) => PRODUTOS.find((produto) => produto.id === id))
    .filter(Boolean);

  grid.innerHTML = produtosVitrine.map(criarCardProduto).join('');
  configurarBotoesFavoritar(); // mesma função de sale.js — o card é o mesmo
}

/* ------------------------------------------------------------------
   INICIALIZAÇÃO
------------------------------------------------------------------- */
function iniciarPaginaHome() {
  if (!heroEl) return; // esta página não é a home

  configurarZonasDoHero();
  configurarCtaHero();
  renderizarDropDestaque();
  renderizarVitrineHome();
}

document.addEventListener('DOMContentLoaded', iniciarPaginaHome);
