/* ==================================================================
   SOURCE — app.js
   Lógica de tematização (State-Based UI + Tematização Temporal).

   IMPORTANTE: existem DOIS estados independentes no site:

   1. TEMA GLOBAL (paleta/fonte do site inteiro — header, seções, footer)
      → controlado pela classe no <body>: 'modo-quebrada' / 'modo-realeza'
      → na primeira visita, definido automaticamente pelo HORÁRIO, já que
        o site nunca pode ficar "sem cor" para o cliente.
      → a partir do momento em que o cliente escolhe um lado no Hero
        (em qualquer página), essa escolha é salva no LocalStorage e
        passa a valer em TODAS as páginas, sobrescrevendo o horário.

   2. ESTADO DO HERO (a foto e o texto da primeira dobra)
      → controlado por uma classe no #hero: 'hero--duality' (padrão),
        'hero--quebrada' ou 'hero--realeza'
      → SEMPRE começa em 'hero--duality' (a foto dupla), não importa
        o horário. Só muda quando o cliente clica em um dos lados.

   Ou seja: o cliente pode entrar de dia (site já claro/Realeza) e ainda
   assim ver a foto dupla no Hero, podendo escolher livremente qualquer
   um dos dois lados — a escolha no Hero então SOBRESCREVE o tema global.

   Conceito de arquitetura: o JS nunca manipula cor, fonte ou fundo
   diretamente — ele só decide QUAIS CLASSES estão ativas. Quem traduz
   essas classes em aparência visual é sempre o style.css.
================================================================== */

const MODOS = {
  QUEBRADA: 'modo-quebrada',
  REALEZA: 'modo-realeza',
};

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

function aplicarModoGlobal(modo) {
  document.body.classList.remove(MODOS.QUEBRADA, MODOS.REALEZA);
  document.body.classList.add(modo);
}

/* ------------------------------------------------------------------
   PERSISTÊNCIA DO TEMA ESCOLHIDO (LocalStorage)

   Antes, cada página recalculava o tema do zero pelo horário — então
   se o cliente escolhesse "Realeza" na home e clicasse no ícone de
   perfil, a tela de login "esquecia" a escolha e voltava pro horário.

   Agora: assim que o cliente escolhe um lado no Hero, guardamos essa
   escolha no navegador. TODA página, ao carregar, primeiro pergunta
   "o cliente já escolheu um tema antes?" — só cai no cálculo por
   horário se a resposta for não (ou seja, na primeira visita).
------------------------------------------------------------------- */
const CHAVE_TEMA_ESCOLHIDO = 'source_tema_escolhido';

function salvarTemaEscolhido(modo) {
  localStorage.setItem(CHAVE_TEMA_ESCOLHIDO, modo);
}

function obterTemaEscolhido() {
  return localStorage.getItem(CHAVE_TEMA_ESCOLHIDO);
}

function calcularTemaPorHorario() {
  const horaAtual = new Date().getHours();
  const eDiurno = horaAtual >= 6 && horaAtual < 18;
  return eDiurno ? MODOS.REALEZA : MODOS.QUEBRADA;
}

/**
 * Decide o tema global ao carregar QUALQUER página:
 *  1. Se o cliente já escolheu um lado antes (em qualquer página),
 *     usa essa escolha salva — ela tem prioridade.
 *  2. Caso contrário (primeira visita), calcula pelo horário.
 */
function aplicarTemaInicial() {
  const temaSalvo = obterTemaEscolhido();
  const modo = temaSalvo || calcularTemaPorHorario();
  aplicarModoGlobal(modo);
}

const heroEl = document.getElementById('hero');

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
  heroEl.classList.remove('hero--quebrada', 'hero--realeza');
  heroEl.classList.add(lado === 'quebrada' ? 'hero--quebrada' : 'hero--realeza');
  heroEl.classList.add('hero--escolhido');

  atualizarTextoHero(lado);

  const modoGlobal = lado === 'quebrada' ? MODOS.QUEBRADA : MODOS.REALEZA;
  aplicarModoGlobal(modoGlobal);
  salvarTemaEscolhido(modoGlobal); // agora essa escolha "viaja" com o cliente pelo site
}

function configurarZonasDoHero() {
  document.querySelectorAll('.hero__zone').forEach((zona) => {
    zona.addEventListener('click', () => {
      escolherLadoHero(zona.dataset.mode);
    });
  });
}

function iniciarApp() {
  aplicarTemaInicial();
  atualizarContadorCarrinho();

  configurarZonasDoHero();
  configurarAuth();
}



/* ==================================================================
   TELA DE AUTENTICAÇÃO (Login / Cadastro)

   O card de autenticação alterna entre dois modos sem trocar de
   página: 'login' (padrão) e 'cadastro'. Cada modo tem seu próprio
   texto de botão e divisor, centralizados no objeto CONTEUDO_AUTH —
   mesmo padrão usado no CONTEUDO_HERO, pra manter a lógica consistente.

   Esses elementos só existem no login.html, então toda função aqui
   verifica se o elemento existe antes de mexer nele — assim o mesmo
   app.js pode ser usado em qualquer página do site sem quebrar.
================================================================== */

const CONTEUDO_AUTH = {
  login: {
    submitLabel: 'Entrar',
    dividerText: 'Não tem uma conta?',
    dividerLinkText: 'Crie uma aqui',
    toggleBtnLabel: 'Cadastrar-se',
    mostrarConfirmarSenha: false,
  },
  cadastro: {
    submitLabel: 'Criar Conta',
    dividerText: 'Já tem uma conta?',
    dividerLinkText: 'Entrar',
    toggleBtnLabel: 'Entrar',
    mostrarConfirmarSenha: true,
  },
};

let modoAuthAtual = 'login';

function atualizarUIAuth() {
  const conteudo = CONTEUDO_AUTH[modoAuthAtual];

  document.getElementById('auth-submit-btn').textContent = conteudo.submitLabel;
  document.getElementById('auth-divider-text').textContent = conteudo.dividerText;
  document.getElementById('auth-toggle-link').textContent = conteudo.dividerLinkText;
  document.getElementById('auth-toggle-btn').textContent = conteudo.toggleBtnLabel;
  document.getElementById('auth-confirm-password').hidden = !conteudo.mostrarConfirmarSenha;
}

function alternarModoAuth() {
  modoAuthAtual = modoAuthAtual === 'login' ? 'cadastro' : 'login';
  atualizarUIAuth();
}

function configurarAuth() {
  const authCard = document.getElementById('auth-card');
  if (!authCard) return; // esta página não tem card de autenticação

  document.getElementById('auth-toggle-btn').addEventListener('click', alternarModoAuth);
  document.getElementById('auth-toggle-link').addEventListener('click', alternarModoAuth);

  document.getElementById('auth-form').addEventListener('submit', tratarSubmitAuth);
}

/* ------------------------------------------------------------------
   "BANCO DE DADOS" FICTÍCIO (LocalStorage)
   Enquanto o Supabase não entra, simulamos contas de usuário salvas
   no navegador. Isso já deixa o fluxo de Cadastro → Login → Redirect
   funcionando de verdade, e facilita a troca futura: quando o
   Supabase entrar, só substituímos o CONTEÚDO destas duas funções
   (obterContas / salvarConta) por chamadas reais à API — o resto
   do fluxo (validação, alertas, redirecionamento) continua igual.

   ATENÇÃO: isso é só para fins de demonstração do TCC. Nunca se
   guarda senha em texto puro num banco de dados real — o Supabase
   Auth cuida do hash de senha por trás dos panos.
------------------------------------------------------------------- */
const CHAVE_CONTAS_FICTICIAS = 'source_contas_ficticias';

function obterContasFicticias() {
  const dados = localStorage.getItem(CHAVE_CONTAS_FICTICIAS);
  return dados ? JSON.parse(dados) : [];
}

function salvarContaFicticia(conta) {
  const contas = obterContasFicticias();
  contas.push(conta);
  localStorage.setItem(CHAVE_CONTAS_FICTICIAS, JSON.stringify(contas));
}

function contaExiste(email) {
  return obterContasFicticias().some((conta) => conta.email === email);
}

function autenticarConta(email, senha) {
  return obterContasFicticias().some(
    (conta) => conta.email === email && conta.senha === senha
  );
}

/* ------------------------------------------------------------------
   SUBMIT DO FORMULÁRIO (Login ou Cadastro, dependendo do modo atual)
------------------------------------------------------------------- */
function tratarSubmitAuth(evento) {
  evento.preventDefault();

  const email = document.getElementById('auth-email').value.trim();
  const senha = document.getElementById('auth-password').value;
  const confirmarSenha = document.getElementById('auth-confirm-password').value;

  // Validação de campos obrigatórios (comum aos dois modos)
  if (!email || !senha) {
    alert('Preencha os campos obrigatórios para continuar.');
    return;
  }

  if (modoAuthAtual === 'cadastro') {
    if (!confirmarSenha) {
      alert('Preencha os campos obrigatórios para continuar.');
      return;
    }

    if (senha !== confirmarSenha) {
      alert('As senhas não coincidem. Confira e tente novamente.');
      return;
    }

    if (contaExiste(email)) {
      alert('Já existe uma conta cadastrada com este e-mail. Faça login para continuar.');
      return;
    }

    salvarContaFicticia({ email, senha });
    alert('Sua conta foi criada com sucesso! Faça login para continuar.');

    document.getElementById('auth-form').reset();
    alternarModoAuth(); // volta pro modo login, já pronto pra ele entrar

  } else {
    if (!contaExiste(email)) {
      alert('Você ainda não tem uma conta. Cadastre-se para continuar.');
      return;
    }

    if (!autenticarConta(email, senha)) {
      alert('E-mail ou senha incorretos. Tente novamente.');
      return;
    }

    alert('Login realizado com sucesso!');
    window.location.href = 'index.html';
  }
}



/* ==================================================================
   CARRINHO DE COMPRAS (LocalStorage)
   Compartilhado por TODAS as páginas porque o contador do header
   (#cart-count) aparece em qualquer lugar do site. A lógica de
   renderizar a TELA do carrinho (carrinho.html) fica isolada em
   carrinho.js — aqui só cuidamos do dado em si.

   Formato de cada item: { produtoId, tamanho, quantidade }
================================================================== */
const CHAVE_CARRINHO = 'source_carrinho';

function obterCarrinho() {
  const dados = localStorage.getItem(CHAVE_CARRINHO);
  return dados ? JSON.parse(dados) : [];
}

function salvarCarrinho(carrinho) {
  localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(carrinho));
  atualizarContadorCarrinho(); // mantém o header sempre em dia
}

function calcularQuantidadeTotalCarrinho() {
  return obterCarrinho().reduce((total, item) => total + item.quantidade, 0);
}

function atualizarContadorCarrinho() {
  const contador = document.getElementById('cart-count');
  if (!contador) return; // guard clause: nem toda página tem o header completo
  contador.textContent = String(calcularQuantidadeTotalCarrinho());
}

/**
 * Adiciona um item ao carrinho. Se o mesmo produto+tamanho já existir,
 * soma a quantidade ao invés de duplicar a linha.
 */
function adicionarItemAoCarrinho(produtoId, tamanho, quantidade = 1) {
  const carrinho = obterCarrinho();
  const itemExistente = carrinho.find(
    (item) => item.produtoId === produtoId && item.tamanho === tamanho
  );

  if (itemExistente) {
    itemExistente.quantidade += quantidade;
  } else {
    carrinho.push({ produtoId, tamanho, quantidade });
  }

  salvarCarrinho(carrinho);
}

document.addEventListener('DOMContentLoaded', iniciarApp);