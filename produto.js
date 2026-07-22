/* ==================================================================
   SOURCE — produto.js
   Lógica exclusiva da página de Detalhe do Produto (produto.html).

   REGRA ARQUITETURAL: existe UMA ÚNICA página de produto. O que muda
   é o parâmetro `?id=` na URL — este arquivo lê esse id, procura o
   produto correspondente dentro do array PRODUTOS (que já vem do
   sale.js, carregado antes deste script) e monta a tela inteira a
   partir dele. Trocar de cor ou clicar num produto no catálogo só
   troca esse id na URL; a página em si é sempre a mesma.

   Depende de funções/dados já carregados pelo sale.js:
     PRODUTOS, formatarPreco, formatarParcelamento, criarIconeProduto,
     criarSeloLado, NOMES_LADO
================================================================== */

let galeriaAtual = [];
let indiceLightboxAtual = 0;
let tamanhoSelecionado = null;

/**
 * Lê o parâmetro ?id= da URL atual.
 */
function obterIdDaUrl() {
  const parametros = new URLSearchParams(window.location.search);
  return parametros.get('id');
}

function encontrarProdutoPorId(id) {
  return PRODUTOS.find((produto) => produto.id === id) || null;
}

/**
 * Todos os produtos que são a MESMA peça, só em cores diferentes
 * (compartilham o campo `modelagem`). É o que alimenta os swatches
 * de cor e permite navegar entre eles.
 */
function obterVariantesDaModelagem(produto) {
  return PRODUTOS.filter((item) => item.modelagem === produto.modelagem);
}

/* ------------------------------------------------------------------
   GALERIA (placeholder)
   Como ainda não temos fotos reais, cada "foto" é o mesmo ícone SVG
   do produto, em variações simples (espelhado, ampliado) só pra
   diferenciar visualmente as 4 células + o banner. Quando as fotos
   da campanha estiverem prontas, é só trocar o conteúdo de cada
   célula por uma tag <img src="...">.
------------------------------------------------------------------- */
function montarConteudoGaleria(produto) {
  const icone = criarIconeProduto(produto.tipo, produto.corPrincipal);
  return [
    { label: 'Frente', html: icone },
    { label: 'Costas', html: icone },
    { label: 'Detalhe da gola e estampa', html: icone },
    { label: 'Caimento', html: icone },
    { label: `Editorial — ${NOMES_LADO[produto.lado]}`, html: icone },
  ];
}

function criarCelulaGaleria(item, indice, classeExtra) {
  return `
    <button type="button" class="product-gallery__cell ${classeExtra || ''}" data-indice="${indice}" aria-label="Ver em tamanho grande: ${item.label}">
      <span class="product-gallery__cell-icon">${item.html}</span>
      <span class="product-gallery__cell-label">${item.label}</span>
    </button>
  `;
}

function criarBannerGaleria(item, indice) {
  return `
    <button type="button" class="product-gallery__banner" data-indice="${indice}" aria-label="Ver em tamanho grande: ${item.label}">
      <span class="product-gallery__banner-icon">${item.html}</span>
      <span class="product-gallery__banner-label">${item.label}</span>
    </button>
  `;
}

function criarGaleriaHtml(galeria) {
  return `
    <aside class="product-gallery" aria-label="Galeria de fotos do produto">
      <div class="product-gallery__grid">
        ${criarCelulaGaleria(galeria[0], 0, 'product-gallery__cell--frente')}
        ${criarCelulaGaleria(galeria[1], 1, 'product-gallery__cell--costas')}
        ${criarCelulaGaleria(galeria[2], 2, 'product-gallery__cell--detalhe')}
        ${criarCelulaGaleria(galeria[3], 3, '')}
      </div>
      ${criarBannerGaleria(galeria[4], 4)}
    </aside>
  `;
}

/* ------------------------------------------------------------------
   COLUNA DE INFORMAÇÕES
------------------------------------------------------------------- */
function criarBlocoInfoHtml(produto) {
  const variantes = obterVariantesDaModelagem(produto);

  const swatchesHtml = variantes.length > 1
    ? `
      <div class="product-info__group">
        <p class="product-info__label">Cor</p>
        <div class="product-swatches">
          ${variantes.map((variante) => `
            <button
              type="button"
              class="product-swatch ${variante.id === produto.id ? 'is-selected' : ''}"
              style="background-color: ${variante.corPrincipal};"
              data-id="${variante.id}"
              aria-pressed="${variante.id === produto.id}"
              aria-label="Ver na cor de ${variante.nome}"
            ></button>
          `).join('')}
        </div>
      </div>`
    : '';

  const tamanhosHtml = produto.tamanhosDisponiveis
    .map((tamanho) => `<button type="button" class="product-size-btn" data-tamanho="${tamanho}">${tamanho}</button>`)
    .join('');

  const destaquesHtml = produto.destaques.map((item) => `<li>${item}</li>`).join('');

  return `
    <section class="product-info" aria-label="Informações e compra">
      <p class="product-info__eyebrow">${produto.colecao}</p>
      <h1 class="product-info__title">${produto.colecao} — ${produto.nome}</h1>

      ${criarSeloLado(produto.lado)}

      <div class="product-info__price-block">
        <p class="product-info__price">${formatarPreco(produto.preco)}</p>
        <p class="product-info__installment">${formatarParcelamento(produto.preco)}</p>
      </div>

      ${swatchesHtml}

      <div class="product-info__group">
        <p class="product-info__label">Tamanho</p>
        <div class="product-sizes" id="product-sizes">${tamanhosHtml}</div>
      </div>

      <div class="product-info__actions">
        <button type="button" class="btn-pill product-info__add-btn" id="btn-adicionar-carrinho">
          Adicionar ao carrinho
        </button>
        <button type="button" class="btn-outline product-info__fav-btn" id="btn-favoritar" aria-pressed="false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path d="M12 21s-7-4.35-9.5-8.5C.7 8.9 2.2 5 6 5c2 0 3.3 1 4 2.2C10.7 6 12 5 14 5c3.8 0 5.3 3.9 3.5 7.5C19 16.65 12 21 12 21z"></path>
          </svg>
          Salvar nos Favoritos
        </button>
      </div>

      <div class="product-info__shipping">
        <p class="product-info__label">Calcular frete e prazo</p>
        <form class="product-shipping-form" id="shipping-form">
          <input
            type="text"
            id="shipping-cep"
            class="auth-input product-shipping-form__input"
            placeholder="00000-000"
            maxlength="9"
            inputmode="numeric"
            aria-label="Seu CEP"
          >
          <button type="submit" class="btn-outline">Calcular</button>
        </form>
        <div class="product-shipping-result" id="shipping-result" hidden></div>
      </div>

      <div class="product-info__details">
        <details open>
          <summary>Descrição</summary>
          <p>${produto.descricao}</p>
        </details>
        <details>
          <summary>Destaques de Design</summary>
          <ul>${destaquesHtml}</ul>
        </details>
        <details>
          <summary>Especificações Técnicas</summary>
          <ul>
            <li><strong>Tecido:</strong> ${produto.especificacoes.tecido}</li>
            <li><strong>Composição:</strong> ${produto.especificacoes.composicao}</li>
            <li><strong>Caimento:</strong> ${produto.especificacoes.caimento}</li>
          </ul>
        </details>
      </div>
    </section>
  `;
}

/* ------------------------------------------------------------------
   RENDERIZAÇÃO PRINCIPAL
------------------------------------------------------------------- */
function renderizarProdutoNaoEncontrado() {
  const container = document.getElementById('product-detail-container');
  if (!container) return;

  container.innerHTML = `
    <div class="product-not-found">
      <p class="product-not-found__title">Produto não encontrado.</p>
      <p class="product-not-found__text">O link que você acessou pode estar incorreto ou o produto não existe mais.</p>
      <a href="sale.html" class="btn-pill">Voltar para o Sale</a>
    </div>
  `;
}

function renderizarPaginaProduto(produto) {
  const container = document.getElementById('product-detail-container');
  if (!container) return;

  galeriaAtual = montarConteudoGaleria(produto);

  container.innerHTML = `
    <div class="product-detail">
      ${criarGaleriaHtml(galeriaAtual)}
      ${criarBlocoInfoHtml(produto)}
    </div>
  `;

  configurarEventosDaPagina(produto);
}

/* ------------------------------------------------------------------
   EVENTOS DA PÁGINA (tamanho, cor, carrinho, favoritos, frete, galeria)
------------------------------------------------------------------- */
function configurarEventosDaPagina(produto) {
  // Troca de cor: navega pra mesma página com outro ?id=
  document.querySelectorAll('.product-swatch').forEach((swatch) => {
    swatch.addEventListener('click', () => {
      window.location.href = `produto.html?id=${swatch.dataset.id}`;
    });
  });

  // Seleção de tamanho
  document.querySelectorAll('.product-size-btn').forEach((botao) => {
    botao.addEventListener('click', () => {
      document.querySelectorAll('.product-size-btn').forEach((b) => b.classList.remove('is-selected'));
      botao.classList.add('is-selected');
      tamanhoSelecionado = botao.dataset.tamanho;
    });
  });

  // Adicionar ao carrinho (fictício por enquanto — o carrinho reativo
  // de verdade, com persistência entre páginas, é a próxima etapa
  // planejada do projeto)
  const botaoCarrinho = document.getElementById('btn-adicionar-carrinho');
  if (botaoCarrinho) {
    botaoCarrinho.addEventListener('click', () => {
      if (!tamanhoSelecionado) {
        alert('Selecione um tamanho antes de adicionar ao carrinho.');
        return;
      }
      alert(`Adicionado ao carrinho: ${produto.nome} (tamanho ${tamanhoSelecionado})`);

      const contador = document.getElementById('cart-count');
      if (contador) {
        contador.textContent = String(Number(contador.textContent) + 1);
      }
    });
  }

  // Favoritar (visual só por enquanto, sem persistência ainda)
  const botaoFavoritar = document.getElementById('btn-favoritar');
  if (botaoFavoritar) {
    botaoFavoritar.addEventListener('click', () => {
      const jaFavoritado = botaoFavoritar.getAttribute('aria-pressed') === 'true';
      botaoFavoritar.setAttribute('aria-pressed', String(!jaFavoritado));
      botaoFavoritar.classList.toggle('is-selected', !jaFavoritado);
    });
  }

  // Cálculo de frete (simulado — sem integração com Correios/API ainda)
  const formularioFrete = document.getElementById('shipping-form');
  if (formularioFrete) {
    formularioFrete.addEventListener('submit', (evento) => {
      evento.preventDefault();

      const cep = document.getElementById('shipping-cep').value.trim();
      const cepValido = /^\d{5}-?\d{3}$/.test(cep);
      const resultado = document.getElementById('shipping-result');

      if (!cepValido) {
        alert('Digite um CEP válido, no formato 00000-000.');
        return;
      }

      resultado.hidden = false;
      resultado.innerHTML = `
        <div class="product-shipping-option">
          <span>PAC</span>
          <span>${formatarPreco(19.9)} · até 7 dias úteis</span>
        </div>
        <div class="product-shipping-option">
          <span>SEDEX</span>
          <span>${formatarPreco(34.9)} · até 2 dias úteis</span>
        </div>
      `;
    });
  }

  // Galeria: abre o lightbox na foto clicada
  document.querySelectorAll('.product-gallery__cell, .product-gallery__banner').forEach((celula) => {
    celula.addEventListener('click', () => {
      abrirLightbox(Number(celula.dataset.indice));
    });
  });
}

/* ------------------------------------------------------------------
   LIGHTBOX (modal de zoom, compartilhado por toda a galeria)
------------------------------------------------------------------- */
function atualizarConteudoLightbox() {
  const item = galeriaAtual[indiceLightboxAtual];
  const palco = document.getElementById('lightbox-stage');
  if (!palco || !item) return;

  palco.innerHTML = `
    <div class="lightbox__imagem">${item.html}</div>
    <p class="lightbox__legenda">${item.label} — ${indiceLightboxAtual + 1} de ${galeriaAtual.length}</p>
  `;
}

function abrirLightbox(indice) {
  indiceLightboxAtual = indice;
  atualizarConteudoLightbox();

  const lightbox = document.getElementById('lightbox');
  if (lightbox) lightbox.hidden = false;
}

function fecharLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (lightbox) lightbox.hidden = true;
}

function irParaProximaFoto() {
  indiceLightboxAtual = (indiceLightboxAtual + 1) % galeriaAtual.length;
  atualizarConteudoLightbox();
}

function irParaFotoAnterior() {
  indiceLightboxAtual = (indiceLightboxAtual - 1 + galeriaAtual.length) % galeriaAtual.length;
  atualizarConteudoLightbox();
}

function configurarLightboxGlobal() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  document.getElementById('lightbox-close').addEventListener('click', fecharLightbox);
  document.getElementById('lightbox-next').addEventListener('click', irParaProximaFoto);
  document.getElementById('lightbox-prev').addEventListener('click', irParaFotoAnterior);

  // Clicar no fundo escuro (fora da imagem) também fecha
  lightbox.addEventListener('click', (evento) => {
    if (evento.target === lightbox) fecharLightbox();
  });

  // Navegação por teclado: Esc fecha, setas trocam de foto
  document.addEventListener('keydown', (evento) => {
    if (lightbox.hidden) return;
    if (evento.key === 'Escape') fecharLightbox();
    if (evento.key === 'ArrowRight') irParaProximaFoto();
    if (evento.key === 'ArrowLeft') irParaFotoAnterior();
  });
}

/* ------------------------------------------------------------------
   INICIALIZAÇÃO
------------------------------------------------------------------- */
function iniciarPaginaDeProduto() {
  const container = document.getElementById('product-detail-container');
  if (!container) return; // esta página não é o produto.html

  const id = obterIdDaUrl();
  const produto = id ? encontrarProdutoPorId(id) : null;

  if (!produto) {
    renderizarProdutoNaoEncontrado();
    return;
  }

  renderizarPaginaProduto(produto);
  configurarLightboxGlobal();
}

document.addEventListener('DOMContentLoaded', iniciarPaginaDeProduto);
