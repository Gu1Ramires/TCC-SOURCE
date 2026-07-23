/* ==================================================================
   SOURCE — carrinho.js
   Lógica exclusiva da página de Carrinho/Checkout (carrinho.html).

   Depende de funções/dados já carregados por scripts anteriores:
     - app.js  → obterCarrinho, salvarCarrinho, adicionarItemAoCarrinho
     - sale.js → PRODUTOS, formatarPreco, formatarParcelamento,
                 criarIconeProduto, criarSeloLado, NOMES_LADO

   REGRA ARQUITETURAL: assim como produto.js, este arquivo nunca
   decide cor/fonte — só monta HTML e liga classes. O style.css
   traduz tudo visualmente.
================================================================== */

/* ------------------------------------------------------------------
   CUPONS (mock)
   Igual ao mock de PRODUTOS em sale.js: hoje é um objeto fixo,
   amanhã vira uma consulta ao Supabase (tabela "cupons"), sem
   precisar reescrever a lógica de aplicação/cálculo abaixo.
------------------------------------------------------------------- */
const CUPONS_VALIDOS = {
  SOURCE10: 0.10,
  BEMVINDO15: 0.15,
};

const VALOR_FRETE_PADRAO = 9.9;
const PRAZO_FRETE_DIAS = '5 a 8 dias úteis';

let cupomAplicado = null; // string do código, ou null
let freteCalculado = false; // só entra no total depois do CEP calculado

/* ------------------------------------------------------------------
   LEITURA DO CARRINHO + DADOS DO PRODUTO
   O carrinho salvo no LocalStorage só guarda { produtoId, tamanho,
   quantidade } — aqui cruzamos com o array PRODUTOS (de sale.js)
   pra ter nome, preço, cor, etc. Produtos removidos do catálogo
   simplesmente somem da lista (filter), sem quebrar a tela.
------------------------------------------------------------------- */
function obterItensCarrinhoComDados() {
  const carrinho = obterCarrinho();

  return carrinho
    .map((item) => {
      const produto = PRODUTOS.find((p) => p.id === item.produtoId);
      if (!produto) return null;
      return { ...item, produto };
    })
    .filter(Boolean);
}

function calcularSubtotal(itens) {
  return itens.reduce((total, item) => total + item.produto.preco * item.quantidade, 0);
}

function calcularDesconto(subtotal) {
  if (!cupomAplicado) return 0;
  const percentual = CUPONS_VALIDOS[cupomAplicado] || 0;
  return subtotal * percentual;
}

function calcularFrete() {
  return freteCalculado ? VALOR_FRETE_PADRAO : 0;
}


/* ------------------------------------------------------------------
   RENDERIZAÇÃO — LINHA DE PRODUTO
------------------------------------------------------------------- */
function criarLinhaProdutoHtml(item, indice) {
  const { produto, tamanho, quantidade } = item;
  const valorTotalItem = produto.preco * quantidade;

  return `
    <div class="cart-item" data-indice="${indice}">
      <div class="cart-item__produto">
        <div class="cart-item__thumb" style="background-color:${produto.corPrincipal}22;">
          ${criarIconeProduto(produto.tipo, produto.corPrincipal)}
        </div>
        <div class="cart-item__info">
          <p class="cart-item__nome">${produto.colecao} - ${produto.nome}</p>
          <p class="cart-item__meta">Tamanho: ${tamanho}</p>
          <p class="cart-item__meta">Estilo: SOURCE · ${NOMES_LADO[produto.lado]}</p>
        </div>
      </div>

      <div class="cart-item__quantidade">
        <div class="cart-qty">
          <button type="button" class="cart-qty__btn" data-acao="diminuir" data-indice="${indice}" aria-label="Diminuir quantidade">−</button>
          <span class="cart-qty__valor">${quantidade}</span>
          <button type="button" class="cart-qty__btn" data-acao="aumentar" data-indice="${indice}" aria-label="Aumentar quantidade">+</button>
        </div>
      </div>

      <div class="cart-item__valor">
        <p class="cart-item__preco">${formatarPreco(valorTotalItem)}</p>
        <p class="cart-item__parcelamento">${formatarParcelamento(valorTotalItem)}</p>
      </div>

      <button type="button" class="cart-item__lixeira-btn" data-indice="${indice}" aria-label="Remover ${produto.nome} do carrinho">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
          <path d="M10 11v6"></path>
          <path d="M14 11v6"></path>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
        </svg>
      </button>
    </div>
  `;
}

/* ------------------------------------------------------------------
   RENDERIZAÇÃO — RESUMO DO PEDIDO
------------------------------------------------------------------- */
function criarResumoHtml(itens) {
  const subtotal = calcularSubtotal(itens);
  const desconto = calcularDesconto(subtotal);
  const frete = calcularFrete();
  const total = subtotal - desconto + frete;

  return `
    <aside class="cart-resumo">
      <p class="cart-resumo__titulo">Resumo</p>

      <div class="cart-resumo__linha">
        <span>Valor dos produtos</span>
        <span>${formatarPreco(subtotal)}</span>
      </div>

      <div class="cart-resumo__linha">
        <span>Desconto${cupomAplicado ? ` (${cupomAplicado})` : ''}</span>
        <span class="cart-resumo__desconto">${desconto > 0 ? '-' + formatarPreco(desconto) : formatarPreco(0)}</span>
      </div>

      <div class="cart-resumo__linha">
        <span>Frete</span>
        <span>${freteCalculado ? formatarPreco(frete) : 'A calcular'}</span>
      </div>

      <div class="cart-resumo__linha cart-resumo__linha--total">
        <span>Total da Compra</span>
        <span>${formatarPreco(total)}</span>
      </div>
      <p class="cart-resumo__parcelamento">${formatarParcelamento(total)}</p>

      <button type="button" class="btn-pill cart-resumo__continuar" id="btn-continuar">Continuar</button>
    </aside>
  `;
}

/* ------------------------------------------------------------------
   RENDERIZAÇÃO PRINCIPAL
------------------------------------------------------------------- */
function renderizarCarrinho() {
  const container = document.getElementById('cart-container');
  const itens = obterItensCarrinhoComDados();

  const stepperHtml = `
    <nav class="cart-stepper" aria-label="Etapas da compra">
      <div class="cart-stepper__etapa cart-stepper__etapa--ativa">
        <span class="cart-stepper__numero">1</span> Carrinho
      </div>
      <div class="cart-stepper__etapa">
        <span class="cart-stepper__numero">2</span> Identificação
      </div>
      <div class="cart-stepper__etapa">
        <span class="cart-stepper__numero">3</span> Pagamento
      </div>
    </nav>
  `;

  if (itens.length === 0) {
    container.innerHTML = `
      <div class="cart-card">
        ${stepperHtml}
        <div class="cart-empty">
          <p class="cart-empty__title">Seu carrinho está vazio</p>
          <p class="cart-empty__text">Explore a coleção e encontre a peça certa pro seu lado — Quebrada ou Realeza.</p>
          <a href="index.html" class="btn-pill cart-empty__btn">Voltar para a loja</a>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="cart-card">
      ${stepperHtml}

      <p class="cart-alert">
        Os produtos no carrinho não estão reservados. Finalize seu pedido antes que o estoque acabe.
      </p>

      <div class="cart-table" id="cart-table">
        <div class="cart-table__cabecalho">
          <span>Produtos</span>
          <span>Quantidade</span>
          <span>Valor Total</span>
        </div>
        <div class="cart-table__corpo" id="cart-table-body">
          ${itens.map((item, indice) => criarLinhaProdutoHtml(item, indice)).join('')}
        </div>
      </div>

      <div class="cart-bottom-grid">
        <div class="cart-shipping">
          <p class="cart-bottom-grid__label">Prazo de entrega</p>
          <form class="cart-shipping-form" id="shipping-form">
            <input
              type="text"
              id="shipping-cep"
              class="cart-input"
              placeholder="00000-000"
              maxlength="9"
              inputmode="numeric"
              aria-label="Seu CEP"
            >
            <button type="submit" class="btn-outline">Calcular</button>
          </form>
          <p class="cart-shipping__resultado" id="shipping-result" hidden></p>
        </div>

        <div class="cart-coupon">
          <p class="cart-bottom-grid__label">Cupom de Desconto</p>
          <form class="cart-coupon-form" id="coupon-form">
            <input
              type="text"
              id="coupon-code"
              class="cart-input"
              placeholder="Digite seu Cupom"
              aria-label="Código do cupom"
            >
            <button type="submit" class="btn-outline">Aplicar</button>
          </form>
          <p class="cart-coupon__resultado" id="coupon-result" hidden></p>
        </div>

        <div id="cart-resumo-container"></div>
      </div>

    </div>
  `;

  document.getElementById('cart-resumo-container').outerHTML = criarResumoHtml(itens);

  configurarEventosDoCarrinho();
}

/* ------------------------------------------------------------------
   EVENTOS (quantidade, remoção, frete, cupom, continuar)
------------------------------------------------------------------- */
function configurarEventosDoCarrinho() {
  // Quantidade: + e -
  document.querySelectorAll('.cart-qty__btn').forEach((botao) => {
    botao.addEventListener('click', () => {
      const carrinho = obterCarrinho();
      const indice = Number(botao.dataset.indice);
      const item = carrinho[indice];
      if (!item) return;

      if (botao.dataset.acao === 'aumentar') {
        item.quantidade += 1;
      } else if (item.quantidade > 1) {
        item.quantidade -= 1;
      } else {
        return; // não deixa ir abaixo de 1 pelo botão — remoção é o botão "Remover"
      }

      salvarCarrinho(carrinho);
      renderizarCarrinho();
    });
  });

 // Remover item
  document.querySelectorAll('.cart-item__lixeira-btn').forEach((botao) => {
    botao.addEventListener('click', () => {
      const carrinho = obterCarrinho();
      const indice = Number(botao.dataset.indice);
      carrinho.splice(indice, 1);
      salvarCarrinho(carrinho);
      renderizarCarrinho();
    });
  });

  // Cálculo de frete (simulado — mesma lógica de produto.js)
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

      freteCalculado = true;
      resultado.hidden = false;
      resultado.textContent = `Entrega estimada em ${PRAZO_FRETE_DIAS} — ${formatarPreco(VALOR_FRETE_PADRAO)}`;

      // Recalcula só o resumo, sem perder o que já foi digitado nos inputs
      const itens = obterItensCarrinhoComDados();
      document.querySelector('.cart-resumo').outerHTML = criarResumoHtml(itens);
      configurarEventoContinuar();
    });
  }

  // Aplicação de cupom
  const formularioCupom = document.getElementById('coupon-form');
  if (formularioCupom) {
    formularioCupom.addEventListener('submit', (evento) => {
      evento.preventDefault();

      const codigo = document.getElementById('coupon-code').value.trim().toUpperCase();
      const resultado = document.getElementById('coupon-result');

      if (!CUPONS_VALIDOS[codigo]) {
        resultado.hidden = false;
        resultado.textContent = 'Cupom inválido ou expirado.';
        cupomAplicado = null;
      } else {
        cupomAplicado = codigo;
        resultado.hidden = false;
        resultado.textContent = `Cupom aplicado: ${(CUPONS_VALIDOS[codigo] * 100).toFixed(0)}% de desconto.`;
      }

      const itens = obterItensCarrinhoComDados();
      document.querySelector('.cart-resumo').outerHTML = criarResumoHtml(itens);
      configurarEventoContinuar();
    });
  }

  configurarEventoContinuar();
}

function configurarEventoContinuar() {
  const botaoContinuar = document.getElementById('btn-continuar');
  if (!botaoContinuar) return;

  botaoContinuar.addEventListener('click', () => {
    // Próxima etapa (Identificação) ainda não existe — placeholder por enquanto
    alert('Próxima etapa: Identificação (em construção).');
  });
}

/* ------------------------------------------------------------------
   INICIALIZAÇÃO
------------------------------------------------------------------- */
function iniciarPaginaDeCarrinho() {
  const container = document.getElementById('cart-container');
  if (!container) return; // esta página não é o carrinho.html

  renderizarCarrinho();
}

document.addEventListener('DOMContentLoaded', iniciarPaginaDeCarrinho);