/* Matilha Pet Club: previa de site. Topo, menu, aparecer ao rolar e agendamento pelo WhatsApp. */
(function () {
  'use strict';
  var WHATS = '5511966024153';
  var raiz = document.documentElement;
  raiz.classList.add('js');
  var reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* altura do topo fixo (aviso + barra) vira variavel de CSS */
  var topo = document.getElementById('topo');
  var medirTopo = function () { raiz.style.setProperty('--topo-h', topo.offsetHeight + 'px'); };
  medirTopo();
  if ('ResizeObserver' in window) { new ResizeObserver(medirTopo).observe(topo); }
  else { window.addEventListener('resize', medirTopo); }

  /* aviso de previa */
  var aviso = document.getElementById('aviso');
  if (aviso) {
    aviso.querySelector('.aviso__fechar').addEventListener('click', function () {
      aviso.classList.add('oculto');
      medirTopo();
    });
  }

  /* topo: transparente sobre a foto ate rolar (no celular) */
  var whatsFixo = document.querySelector('.whats-fixo');
  var agendaNaTela = false;
  var aoRolar = function () {
    var y = window.scrollY;
    topo.classList.toggle('rolou', y > 40);
    if (whatsFixo) {
      var mostrar = y > window.innerHeight * 0.8 && !agendaNaTela && !topo.classList.contains('menu-aberto');
      whatsFixo.classList.toggle('mostra', mostrar);
    }
  };
  window.addEventListener('scroll', aoRolar, { passive: true });
  aoRolar();

  /* menu do celular */
  var menu = document.getElementById('menu-cel');
  var menuBtn = document.getElementById('menu-btn');
  var menuTxt = menuBtn.querySelector('.menu-btn__txt');
  var abrirMenu = function (abrir) {
    menu.classList.toggle('aberto', abrir);
    topo.classList.toggle('menu-aberto', abrir);
    raiz.classList.toggle('travado', abrir);
    menu.setAttribute('aria-hidden', abrir ? 'false' : 'true');
    menuBtn.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    menuTxt.textContent = abrir ? 'Fechar' : 'Menu';
    aoRolar();
  };
  menuBtn.addEventListener('click', function () { abrirMenu(!menu.classList.contains('aberto')); });
  menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { abrirMenu(false); }); });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && menu.classList.contains('aberto')) abrirMenu(false); });
  window.matchMedia('(min-width: 1000px)').addEventListener('change', function (m) { if (m.matches) abrirMenu(false); });

  /* aparecer ao rolar */
  var revelas = document.querySelectorAll('.revela');
  if ('IntersectionObserver' in window && !reduzir) {
    var obs = new IntersectionObserver(function (itens) {
      itens.forEach(function (it) {
        if (it.isIntersecting) { it.target.classList.add('visivel'); obs.unobserve(it.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revelas.forEach(function (el) { obs.observe(el); });
  } else {
    revelas.forEach(function (el) { el.classList.add('visivel'); });
  }

  /* o botao fixo de WhatsApp some enquanto o agendamento esta na tela */
  var secaoAgenda = document.getElementById('agendar');
  if (secaoAgenda && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (itens) {
      agendaNaTela = itens[0].isIntersecting;
      aoRolar();
    }, { threshold: 0.1 }).observe(secaoAgenda);
  }

  /* sobre as secoes escuras (Natal e rodape), o botao fixo inverte de cor */
  if (whatsFixo && 'IntersectionObserver' in window) {
    var escuras = new Set();
    var obsEscuro = new IntersectionObserver(function (itens) {
      itens.forEach(function (it) { if (it.isIntersecting) escuras.add(it.target); else escuras.delete(it.target); });
      whatsFixo.classList.toggle('no-escuro', escuras.size > 0);
    }, { rootMargin: '-90% 0px -2% 0px', threshold: 0 });
    /* so conta quando a secao escura passa pela faixa de baixo da tela, onde o botao fica */
    document.querySelectorAll('.natal, .rodape').forEach(function (el) { obsEscuro.observe(el); });
  }

  /* ---------------- agendamento ---------------- */
  var form = document.getElementById('form-agenda');
  if (!form) return;
  var etapas = form.querySelectorAll('.etapa');
  var marcas = form.querySelectorAll('.progresso li');
  var passoTxt = document.getElementById('passo-txt');
  var atual = 1;
  var DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

  var valor = function (nome) {
    var el = form.elements[nome];
    if (!el) return '';
    if (el.length !== undefined && el.tagName !== 'SELECT') {
      var marcado = form.querySelector('input[name="' + nome + '"]:checked');
      return marcado ? marcado.value : '';
    }
    return (el.value || '').trim();
  };
  var erro = function (nome, mostrar) {
    var e = form.querySelector('[data-erro="' + nome + '"]');
    if (e) e.classList.toggle('visivel', mostrar);
  };

  /* data minima = hoje */
  var campoDia = form.elements.dia;
  var hoje = new Date();
  var iso = function (d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  campoDia.min = iso(hoje);

  /* raca "outra" */
  var campoOutra = document.getElementById('campo-outra');
  form.elements.raca.addEventListener('change', function () {
    campoOutra.classList.toggle('visivel', this.value === 'outra');
  });
  var raca = function () {
    var r = valor('raca');
    return r === 'outra' ? valor('raca_outra') : r;
  };

  /* regras do calendario (o que a Matilha publicou pra dezembro) */
  var avisoDia = document.getElementById('aviso-dia');
  var lerDia = function () {
    if (!campoDia.value) return null;
    var p = campoDia.value.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  };
  var regraDia = function () {
    var d = lerDia();
    avisoDia.hidden = true;
    avisoDia.classList.remove('ruim');
    if (!d) return false;
    var zero = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    var msg = '';
    var ok = true;
    if (d < zero) { ok = false; msg = 'Essa data já passou. Escolha um dia a partir de hoje.'; }
    else if (d.getMonth() === 11 && (d.getDate() === 25 || d.getDate() === 31)) { ok = false; msg = 'Nesse dia a Matilha está fechada. Escolha outra data.'; }
    else if (d.getMonth() === 11 && d.getDate() === 24) { msg = 'No dia 24 o atendimento vai até 15h.'; }
    else if (d.getDay() === 1 && d.getMonth() === 11) { msg = 'Em dezembro a Matilha abre também às segundas.'; }
    else if (d.getDay() === 1) { msg = 'Às segundas o atendimento costuma ser só em dezembro. A gente confirma pelo WhatsApp.'; }
    if (msg) {
      avisoDia.textContent = msg;
      avisoDia.hidden = false;
      avisoDia.classList.toggle('ruim', !ok);
    }
    return ok;
  };
  campoDia.addEventListener('change', function () { regraDia(); erro('dia', false); atualizarPrevia(); });

  /* validacao por etapa */
  var validar = function (n) {
    var ok = true;
    var checar = function (nome, condicao) { erro(nome, !condicao); if (!condicao) ok = false; };
    if (n === 1) { checar('servico', !!valor('servico')); checar('porte', !!valor('porte')); }
    if (n === 2) { checar('pet', !!valor('pet')); checar('raca', !!raca()); }
    if (n === 3) { checar('dia', regraDia()); checar('turno', !!valor('turno')); checar('tutor', !!valor('tutor')); }
    return ok;
  };

  var irPara = function (n) {
    atual = n;
    etapas.forEach(function (e) { e.classList.toggle('ativa', +e.dataset.etapa === n); });
    marcas.forEach(function (m, i) {
      m.classList.toggle('ativo', i + 1 === n);
      m.classList.toggle('feito', i + 1 < n);
    });
    passoTxt.textContent = 'Passo ' + n + ' de 3';
    /* no celular, se o topo do formulario ficou pra cima da tela, volta pra ele */
    if (form.getBoundingClientRect().top < 0) form.scrollIntoView({ behavior: reduzir ? 'auto' : 'smooth', block: 'start' });
    var primeiro = form.querySelector('.etapa.ativa input:not([type="radio"]), .etapa.ativa select');
    if (primeiro && window.matchMedia('(min-width: 1000px)').matches) primeiro.focus({ preventScroll: true });
  };
  form.querySelectorAll('[data-proximo]').forEach(function (b) {
    b.addEventListener('click', function () { if (validar(atual)) irPara(atual + 1); });
  });
  form.querySelectorAll('[data-voltar]').forEach(function (b) {
    b.addEventListener('click', function () { irPara(atual - 1); });
  });
  /* some o erro quando a pessoa corrige */
  var limpar = function (ev) {
    if (ev.target.name) erro(ev.target.name === 'raca_outra' ? 'raca' : ev.target.name, false);
    atualizarPrevia();
  };
  form.addEventListener('change', limpar);
  form.addEventListener('input', limpar);

  /* tocar num servico da lista ja deixa ele marcado no agendamento */
  document.querySelectorAll('.lista-servicos [data-servico], .lista-servicos [data-porte]').forEach(function (a) {
    a.addEventListener('click', function () {
      var marcar = function (nome, v) {
        var r = form.querySelector('input[name="' + nome + '"][value="' + v + '"]');
        if (r) { r.checked = true; erro(nome, false); }
      };
      if (a.dataset.servico) marcar('servico', a.dataset.servico);
      if (a.dataset.porte) marcar('porte', a.dataset.porte);
      if (atual !== 1) irPara(1);
      atualizarPrevia();
    });
  });

  /* a mensagem */
  var montarMensagem = function () {
    var d = lerDia();
    var dia = d ? DIAS[d.getDay()] + ', ' + String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') : '';
    var linhas = [
      'Olá, Matilha! Vim pelo site e quero agendar um horário.',
      '',
      '*Serviço:* ' + valor('servico'),
      '*Pet:* ' + valor('pet') + ', ' + raca() + ' (porte ' + valor('porte') + ')',
      '*Dia:* ' + dia + ', ' + valor('turno'),
      '*Tutor(a):* ' + valor('tutor')
    ];
    if (valor('obs')) linhas.push('*Observação:* ' + valor('obs'));
    return linhas.join('\n');
  };
  var previaMsg = document.getElementById('previa-msg');
  var textoMsg = document.getElementById('texto-msg');
  var atualizarPrevia = function () {
    var pronto = valor('servico') && valor('porte') && valor('pet') && raca() && campoDia.value && valor('turno') && valor('tutor');
    previaMsg.hidden = !pronto;
    if (pronto) textoMsg.textContent = montarMensagem().replace(/\*/g, '');
  };

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (!validar(3)) return;
    var url = 'https://wa.me/' + WHATS + '?text=' + encodeURIComponent(montarMensagem());
    form.dataset.ultimoLink = url;
    var aba = window.open(url, '_blank');
    if (aba) { aba.opener = null; } else { window.location.href = url; }
  });
})();
