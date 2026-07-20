/* ==================================================================
   SOURCE — app.js
   Lógica de tematização (State-Based UI + Tematização Temporal).

   IMPORTANTE: existem DOIS estados independentes no site:

   1. TEMA GLOBAL (paleta/fonte do site inteiro — header, seções, footer)
      → controlado pela classe no <body>: 'modo-quebrada' / 'modo-realeza'
      → definido automaticamente pelo HORÁRIO assim que a página carrega,
        já que o site nunca pode ficar "sem cor" para o cliente.

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

function definirTemaGlobalPorHorario() {
  const horaAtual = new Date().getHours();
  const eDiurno = horaAtual >= 6 && horaAtual < 18;
  const modo = eDiurno ? MODOS.REALEZA : MODOS.QUEBRADA;
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
}

function configurarZonasDoHero() {
  document.querySelectorAll('.hero__zone').forEach((zona) => {
    zona.addEventListener('click', () => {
      escolherLadoHero(zona.dataset.mode);
    });
  });
}

function iniciarApp() {
  definirTemaGlobalPorHorario();

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

  document.getElementById('auth-form').addEventListener('submit', (evento) => {
    evento.preventDefault();

    // Espaço reservado para a futura integração com Supabase:
    //   - modo 'login'    → supabase.auth.signInWithPassword(...)
    //   - modo 'cadastro' → supabase.auth.signUp(...)
    console.log(`Formulário de ${modoAuthAtual} enviado (integração com Supabase entra aqui).`);
  });
}

document.addEventListener('DOMContentLoaded', iniciarApp);
