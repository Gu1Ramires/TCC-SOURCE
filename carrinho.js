/* ==================================================================
   SOURCE — carrinho.js
   Lógica exclusiva da página de Carrinho/Checkout (carrinho.html).

   Depende de funções/dados já carregados por scripts anteriores:
     - app.js  → obterCarrinho, salvarCarrinho, adicionarItemAoCarrinho,
                 obterSessaoAtiva, removerSessaoAtiva
     - sale.js → PRODUTOS, formatarPreco, formatarParcelamento,
                 criarIconeProduto, criarSeloLado, NOMES_LADO

   ARQUITETURA DO CHECKOUT: existe UM único card, e o que muda é o
   CONTEÚDO dentro dele conforme a etapa (etapaAtual: 1, 2 ou 3) —
   mesmo raciocínio de "uma página só, o estado é que muda" já usado
   em produto.js com o ?id= da URL.
================================================================== */

const CUPONS_VALIDOS = {
  SOURCE10: 0.10,
  BEMVINDO15: 0.15,
};

const VALOR_FRETE_PADRAO = 9.9;
const PRAZO_FRETE_DIAS = '5 a 8 dias úteis';

let cupomAplicado = null;
let freteCalculado = false;
let etapaAtual = 1; // 1 = Carrinho, 2 = Identificação, 3 = Pagamento

/* ------------------------------------------------------------------
   LEITURA DO CARRINHO + DADOS DO PRODUTO
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
   STEPPER (compartilhado por todas as etapas)
------------------------------------------------------------------- */
function criarStepperHtml(etapaAtiva) {
  const nomes = ['Carrinho', 'Identificação', 'Pagamento'];

  return `
    <nav class="cart-stepper" aria-label="Etapas da compra">
      ${nomes
        .map((nome, indice) => {
          const numero = indice + 1;
          const classeAtiva = numero === etapaAtiva ? 'cart-stepper__etapa--ativa' : '';
          return `
            <div class="cart-stepper__etapa ${classeAtiva}">
              <span class="cart-stepper__numero">${numero}</span> ${nome}
            </div>
          `;
        })
        .join('')}
    </nav>
  `;
}

/* ------------------------------------------------------------------
   RENDERIZAÇÃO — LINHA DE PRODUTO (etapa 1)
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
   RENDERIZAÇÃO — RESUMO DO PEDIDO (etapa 1)
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
   ETAPA 1 — CARRINHO
------------------------------------------------------------------- */
function renderizarEtapaCarrinho(itens) {
  const container = document.getElementById('cart-container');

  container.innerHTML = `
    <div class="cart-card">
      ${criarStepperHtml(1)}

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
            <input type="text" id="shipping-cep" class="cart-input" placeholder="00000-000" maxlength="9" inputmode="numeric" aria-label="Seu CEP">
            <button type="submit" class="btn-outline">Calcular</button>
          </form>
          <p class="cart-shipping__resultado" id="shipping-result" hidden></p>
        </div>

        <div class="cart-coupon">
          <p class="cart-bottom-grid__label">Cupom de Desconto</p>
          <form class="cart-coupon-form" id="coupon-form">
            <input type="text" id="coupon-code" class="cart-input" placeholder="Digite seu Cupom" aria-label="Código do cupom">
            <button type="submit" class="btn-outline">Aplicar</button>
          </form>
          <p class="cart-coupon__resultado" id="coupon-result" hidden></p>
        </div>

        <div id="cart-resumo-container"></div>
      </div>
    </div>
  `;

  document.getElementById('cart-resumo-container').outerHTML = criarResumoHtml(itens);
  configurarEventosDaEtapaCarrinho();
}

function configurarEventosDaEtapaCarrinho() {
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
        return;
      }

      salvarCarrinho(carrinho);
      renderizarCarrinho();
    });
  });

  document.querySelectorAll('.cart-item__lixeira-btn').forEach((botao) => {
    botao.addEventListener('click', () => {
      const carrinho = obterCarrinho();
      const indice = Number(botao.dataset.indice);
      carrinho.splice(indice, 1);
      salvarCarrinho(carrinho);
      renderizarCarrinho();
    });
  });

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

      const itens = obterItensCarrinhoComDados();
      document.querySelector('.cart-resumo').outerHTML = criarResumoHtml(itens);
      configurarEventoContinuar();
    });
  }

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
    etapaAtual = 2;
    renderizarCarrinho();
  });
}

/* ------------------------------------------------------------------
   ETAPA 2 — IDENTIFICAÇÃO
------------------------------------------------------------------- */
function criarIdentificacaoUsuarioEncontradoHtml(sessao) {
  return `
    <div class="cart-id-card">
      <p class="cart-id-card__titulo">Identificação</p>
      <p class="cart-id-card__status cart-id-card__status--ok">Usuário Encontrado ✅</p>
      <p class="cart-id-card__texto">
        Você já está logado na sua conta Source, seu e-mail de cadastro é
        <strong>${sessao.email}</strong>.
      </p>
      <p class="cart-id-card__texto">Deseja continuar?</p>

      <button type="button" class="btn-pill cart-id-card__btn" id="btn-concluir-compra">Concluir Compra</button>
      <button type="button" class="cart-id-card__link" id="btn-trocar-conta">Deseja Trocar de Conta ?</button>
    </div>
  `;
}

function criarIdentificacaoUsuarioNaoEncontradoHtml() {
  return `
    <div class="cart-id-card">
      <p class="cart-id-card__titulo">Identificação</p>
      <p class="cart-id-card__texto">Entre ou crie uma conta SOURCE, para concluir sua compra.</p>
      <p class="cart-id-card__beneficios">
        Receba cashback, cupons de desconto, acesso antecipado a produtos e outros benefícios gratuitos.
      </p>

      <a href="login.html?redirect=checkout" class="btn-pill cart-id-card__btn">Entrar ou criar conta</a>
      <p class="cart-id-card__rodape">Para usar Cupons de Desconto, é necessária uma conta.</p>
    </div>
  `;
}

function renderizarEtapaIdentificacao() {
  const container = document.getElementById('cart-container');
  const sessao = obterSessaoAtiva();

  const conteudoHtml = sessao
    ? criarIdentificacaoUsuarioEncontradoHtml(sessao)
    : criarIdentificacaoUsuarioNaoEncontradoHtml();

  container.innerHTML = `
    <div class="cart-card">
      ${criarStepperHtml(2)}
      <div class="cart-identificacao">
        ${conteudoHtml}
      </div>
    </div>
  `;

  configurarEventosDaIdentificacao();
}

function configurarEventosDaIdentificacao() {
  const botaoConcluir = document.getElementById('btn-concluir-compra');
  if (botaoConcluir) {
    botaoConcluir.addEventListener('click', () => {
      etapaAtual = 3;
      renderizarCarrinho();
    });
  }

  const botaoTrocarConta = document.getElementById('btn-trocar-conta');
  if (botaoTrocarConta) {
    botaoTrocarConta.addEventListener('click', () => {
      removerSessaoAtiva();
      renderizarCarrinho(); // re-renderiza a mesma etapa 2, agora no Cenário B
    });
  }
}

/* ------------------------------------------------------------------
   ETAPA 3 — PAGAMENTO (placeholder, ainda não desenvolvido)
------------------------------------------------------------------- */
function renderizarEtapaPagamento() {
  const container = document.getElementById('cart-container');

  container.innerHTML = `
    <div class="cart-card">
      ${criarStepperHtml(3)}
      <div class="cart-empty">
        <p class="cart-empty__title">Pagamento em construção</p>
        <p class="cart-empty__text">Essa etapa ainda está sendo desenvolvida.</p>
        <button type="button" class="btn-pill cart-empty__btn" id="btn-voltar-identificacao">Voltar</button>
      </div>
    </div>
  `;

  document.getElementById('btn-voltar-identificacao').addEventListener('click', () => {
    etapaAtual = 2;
    renderizarCarrinho();
  });
}

/* ------------------------------------------------------------------
   ORQUESTRADOR PRINCIPAL
------------------------------------------------------------------- */
function renderizarCarrinho() {
  const container = document.getElementById('cart-container');
  const itens = obterItensCarrinhoComDados();

  if (itens.length === 0) {
    etapaAtual = 1;
    container.innerHTML = `
      <div class="cart-card">
        ${criarStepperHtml(1)}
        <div class="cart-empty">
          <p class="cart-empty__title">Seu carrinho está vazio</p>
          <p class="cart-empty__text">Explore a coleção e encontre a peça certa pro seu lado — Quebrada ou Realeza.</p>
          <a href="index.html" class="btn-pill cart-empty__btn">Voltar para a loja</a>
        </div>
      </div>
    `;
    return;
  }

  if (etapaAtual === 2) {
    renderizarEtapaIdentificacao();
    return;
  }

  if (etapaAtual === 3) {
    renderizarEtapaPagamento();
    return;
  }

  renderizarEtapaCarrinho(itens);
}

/* ------------------------------------------------------------------
   INICIALIZAÇÃO
------------------------------------------------------------------- */
function iniciarPaginaDeCarrinho() {
  const container = document.getElementById('cart-container');
  if (!container) return;

  renderizarCarrinho();
}

document.addEventListener('DOMContentLoaded', iniciarPaginaDeCarrinho);