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

const DESCONTO_PIX = 10.0;

let cupomAplicado = null; // string do código, ou null
let freteSelecionado = null; // objeto { id, nome, valor, prazo } — vem de OPCOES_FRETE (app.js), ou null
let etapaAtual = 1; // 1 = Carrinho, 2 = Identificação, 3 = Pagamento, 4 = Sucesso
let metodoPagamentoSelecionado = 'cartao'; // 'cartao' ou 'pix'

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
  return freteSelecionado ? freteSelecionado.valor : 0;
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
        <span>Frete${freteSelecionado ? ` (${freteSelecionado.nome})` : ''}</span>
        <span>${freteSelecionado ? formatarPreco(frete) : 'A calcular'}</span>
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
        return; // não deixa ir abaixo de 1 pelo botão — remoção é a lixeira
      }

      salvarCarrinho(carrinho);
      renderizarCarrinho();
    });
  });

  // Remover item (lixeira)
  document.querySelectorAll('.cart-item__lixeira-btn').forEach((botao) => {
    botao.addEventListener('click', () => {
      const carrinho = obterCarrinho();
      const indice = Number(botao.dataset.indice);
      carrinho.splice(indice, 1);
      salvarCarrinho(carrinho);
      renderizarCarrinho();
    });
  });

  // Cálculo de frete (simulado — EXATAMENTE a mesma função de
  // produto.js: calcularOpcoesDeFrete, em app.js). Aqui, diferente
  // de produto.html, a escolha de fato entra no total da compra —
  // por isso os radios de opção têm um listener próprio.
  const formularioFrete = document.getElementById('shipping-form');
  if (formularioFrete) {
    formularioFrete.addEventListener('submit', (evento) => {
      evento.preventDefault();

      const cep = document.getElementById('shipping-cep').value.trim();
      const opcoes = calcularOpcoesDeFrete(cep);
      const resultado = document.getElementById('shipping-result');

      if (!opcoes) {
        alert('Digite um CEP válido, no formato 00000-000.');
        return;
      }

      freteSelecionado = opcoes[0]; // pré-seleciona a primeira opção (PAC)
      resultado.hidden = false;
      resultado.innerHTML = criarOpcoesFreteHtml(opcoes, freteSelecionado.id);
      configurarEventosDasOpcoesDeFrete(opcoes);

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

/**
 * Liga os radios de PAC/SEDEX renderizados por criarOpcoesFreteHtml
 * (app.js) — trocar de opção atualiza freteSelecionado e recalcula
 * o resumo na hora, sem precisar re-submeter o formulário de CEP.
 */
function configurarEventosDasOpcoesDeFrete(opcoes) {
  document.querySelectorAll('input[name="opcao-frete"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      freteSelecionado = opcoes.find((opcao) => opcao.id === radio.value) || null;

      const itens = obterItensCarrinhoComDados();
      document.querySelector('.cart-resumo').outerHTML = criarResumoHtml(itens);
      configurarEventoContinuar();
    });
  });
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
   ETAPA 3 — PAGAMENTO
   Duas opções (Cartão / Pix), com o Pix aplicando um desconto fixo
   (DESCONTO_PIX) somado ao desconto de cupom já calculado na etapa 1.
   O cupomAplicado e o frete continuam vivos no estado do módulo —
   não precisam ser recalculados, só reaproveitados aqui.
------------------------------------------------------------------- */
function criarOpcaoPagamentoHtml(valor, titulo, subtexto, destaque) {
  const selecionada = metodoPagamentoSelecionado === valor;
  return `
    <label class="payment-option ${selecionada ? 'payment-option--selecionada' : ''}">
      <input type="radio" name="metodo-pagamento" value="${valor}" ${selecionada ? 'checked' : ''}>
      <span class="payment-option__conteudo">
        <span class="payment-option__titulo">${titulo}</span>
        <span class="payment-option__sub ${destaque ? 'payment-option__sub--destaque' : ''}">${subtexto}</span>
      </span>
    </label>
  `;
}

function criarResumoPagamentoHtml(itens) {
  const subtotal = calcularSubtotal(itens);
  const descontoCupom = calcularDesconto(subtotal);
  const frete = calcularFrete();
  const descontoPix = metodoPagamentoSelecionado === 'pix' ? DESCONTO_PIX : 0;
  const total = subtotal - descontoCupom - descontoPix + frete;
  const nomeMetodo = metodoPagamentoSelecionado === 'pix' ? 'Pix' : 'Cartão de Crédito';

  return `
    <aside class="cart-resumo" id="payment-resumo">
      <p class="cart-resumo__titulo">Resumo</p>

      <div class="cart-resumo__linha">
        <span>Valor dos produtos</span>
        <span>${formatarPreco(subtotal)}</span>
      </div>

      <div class="cart-resumo__linha">
        <span>Desconto Pix</span>
        <span class="cart-resumo__desconto">${descontoPix > 0 ? '-' + formatarPreco(descontoPix) : formatarPreco(0)}</span>
      </div>

      <div class="cart-resumo__linha">
        <span>Frete${freteSelecionado ? ` (${freteSelecionado.nome})` : ''}</span>
        <span>${formatarPreco(frete)}</span>
      </div>

      <div class="cart-resumo__linha cart-resumo__linha--total">
        <span>Total da Compra</span>
        <span>${formatarPreco(total)} no ${nomeMetodo}</span>
      </div>

      <button type="button" class="btn-pill cart-resumo__continuar" id="btn-finalizar-compra">Finalizar compra</button>
    </aside>
  `;
}

function renderizarEtapaPagamento(itens) {
  const container = document.getElementById('cart-container');

  container.innerHTML = `
    <div class="cart-card">
      ${criarStepperHtml(3)}

      <div class="payment-page">
        <p class="payment-page__titulo">Pagamento</p>
        <p class="payment-page__subtitulo">Selecione um método de pagamento</p>

        <div class="payment-options" id="payment-options">
          ${criarOpcaoPagamentoHtml('cartao', 'Cartão de Crédito', 'Parcele em até 3x sem juros', false)}
          ${criarOpcaoPagamentoHtml('pix', 'Pix', `Ganha ${formatarPreco(DESCONTO_PIX)} de desconto`, true)}
        </div>

        <div id="payment-resumo-container"></div>

        <p class="payment-page__rodape">Ao finalizar a sua compra, você concordará com a nossa política de reembolso.</p>
      </div>
    </div>
  `;

  document.getElementById('payment-resumo-container').outerHTML = criarResumoPagamentoHtml(itens);
  configurarEventosDaEtapaPagamento(itens);
}

function configurarEventosDaEtapaPagamento(itens) {
  // Trocar método de pagamento re-renderiza a etapa inteira (mais simples
  // e seguro do que remontar só o pedaço, já que o radio precisa refletir
  // a nova seleção nos dois cards ao mesmo tempo)
  document.querySelectorAll('input[name="metodo-pagamento"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      metodoPagamentoSelecionado = radio.value;
      renderizarEtapaPagamento(itens);
    });
  });

  const botaoFinalizar = document.getElementById('btn-finalizar-compra');
  if (botaoFinalizar) {
    botaoFinalizar.addEventListener('click', () => {
      salvarCarrinho([]); // limpa o carrinho — a compra foi concluída
      etapaAtual = 4;
      renderizarCarrinho();
    });
  }
}

/* ------------------------------------------------------------------
   ETAPA 4 — SUCESSO
   Única tela do fluxo sem stepper (o checkout já terminou). Renderiza
   direto a partir de renderizarCarrinho(), sem passar pela checagem
   de "carrinho vazio" — nesse ponto o carrinho ESTÁ vazio de propósito.
------------------------------------------------------------------- */
function renderizarTelaSucesso() {
  const container = document.getElementById('cart-container');

  container.innerHTML = `
    <div class="cart-card payment-success">
      <div class="payment-success__icone" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M8 12.5l2.5 2.5L16 9.5"></path>
        </svg>
      </div>

      <p class="payment-success__titulo">Parabéns !!</p>
      <p class="payment-success__subtitulo">Compra realizada com sucesso.</p>

      <div class="payment-success__card">
        <p class="payment-success__marca">SOURCE</p>
        <p class="payment-success__mensagem">Agradecemos a sua Preferência</p>
      </div>

      <a href="index.html" class="btn-pill payment-success__btn">Voltar ao início</a>
    </div>
  `;
}

/* ------------------------------------------------------------------
   ORQUESTRADOR PRINCIPAL
------------------------------------------------------------------- */
function renderizarCarrinho() {
  const container = document.getElementById('cart-container');

  // Etapa 4 (Sucesso) acontece DEPOIS de esvaziar o carrinho de propósito —
  // por isso ela precisa vir antes da checagem de "carrinho vazio" abaixo,
  // senão cairia sempre na tela errada de "carrinho vazio".
  if (etapaAtual === 4) {
    renderizarTelaSucesso();
    return;
  }

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
    renderizarEtapaPagamento(itens);
    return;
  }

  renderizarEtapaCarrinho(itens);
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
