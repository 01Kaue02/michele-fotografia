const API_URL = 'http://localhost:3000/api';

const NOMES_DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// ===== HORÁRIO PADRÃO =====

async function carregarHorarioPadrao() {
  const resposta = await fetch(`${API_URL}/horario-padrao`);
  const horarios = await resposta.json();

  renderizarDiasSemana(horarios);
}

function renderizarDiasSemana(horariosExistentes) {
  const container = document.getElementById('dias-semana');

  container.innerHTML = NOMES_DIAS.map((nome, indice) => {
    // Procura se já existe um horário cadastrado para esse dia
    const existente = horariosExistentes.find(h => h.dia_semana === indice);

    return `
      <div class="dia-semana-item">
        <span class="nome-dia">${nome}</span>
        <input type="time" class="input-inicio" data-dia="${indice}" value="${existente ? existente.hora_inicio.slice(0, 5) : ''}">
        <span>até</span>
        <input type="time" class="input-fim" data-dia="${indice}" value="${existente ? existente.hora_fim.slice(0, 5) : ''}">
        <button class="btn btn-primary btn-salvar-dia" data-dia="${indice}">Salvar</button>
      </div>
    `;
  }).join('');

  // Adiciona o clique de salvar em cada dia
  document.querySelectorAll('.btn-salvar-dia').forEach(botao => {
    botao.addEventListener('click', () => salvarDia(botao.dataset.dia));
  });
}

async function salvarDia(diaSemana) {
  const inicio = document.querySelector(`.input-inicio[data-dia="${diaSemana}"]`).value;
  const fim = document.querySelector(`.input-fim[data-dia="${diaSemana}"]`).value;

  if (!inicio || !fim) {
    alert('Preencha os dois horários antes de salvar');
    return;
  }

  try {
    await fetch(`${API_URL}/horario-padrao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dia_semana: Number(diaSemana),
        hora_inicio: inicio,
        hora_fim: fim,
      }),
    });

    alert(`${NOMES_DIAS[diaSemana]} salvo com sucesso!`);
  } catch (erro) {
    console.error('Erro ao salvar horário:', erro);
    alert('Não foi possível salvar. Tente novamente.');
  }
}

// ===== EXCEÇÕES =====

async function carregarExcecoes() {
  const resposta = await fetch(`${API_URL}/excecoes`);
  const excecoes = await resposta.json();

  renderizarExcecoes(excecoes);
}

function renderizarExcecoes(excecoes) {
  const container = document.getElementById('lista-excecoes');

  if (excecoes.length === 0) {
    container.innerHTML = '<p class="ajuda">Nenhuma exceção cadastrada.</p>';
    return;
  }

  container.innerHTML = excecoes.map(e => `
    <div class="item-excecao">
      <span>
        ${new Date(e.data + 'T00:00:00').toLocaleDateString('pt-BR')} —
        ${e.fechado ? 'Fechado' : `${e.hora_inicio.slice(0,5)} às ${e.hora_fim.slice(0,5)}`}
      </span>
      <button class="btn-excluir" data-id="${e.id}">Excluir</button>
    </div>
  `).join('');

  document.querySelectorAll('.btn-excluir').forEach(botao => {
    botao.addEventListener('click', () => excluirExcecao(botao.dataset.id));
  });
}

async function excluirExcecao(id) {
  try {
    await fetch(`${API_URL}/excecoes/${id}`, { method: 'DELETE' });
    carregarExcecoes();
  } catch (erro) {
    console.error('Erro ao excluir exceção:', erro);
    alert('Não foi possível excluir. Tente novamente.');
  }
}

// Mostra/esconde os campos de horário dependendo do checkbox "Fechado"
document.getElementById('input-excecao-fechado').addEventListener('change', (evento) => {
  const campos = document.getElementById('campos-horario-excecao');
  campos.style.display = evento.target.checked ? 'none' : 'flex';
});

// Envio do formulário de exceção
document.getElementById('form-excecao').addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const data = document.getElementById('input-excecao-data').value;
  const fechado = document.getElementById('input-excecao-fechado').checked;
  const horaInicio = document.getElementById('input-excecao-inicio').value;
  const horaFim = document.getElementById('input-excecao-fim').value;

  try {
    const resposta = await fetch(`${API_URL}/excecoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data,
        fechado,
        hora_inicio: fechado ? null : horaInicio,
        hora_fim: fechado ? null : horaFim,
      }),
    });

    if (resposta.status === 409) {
      alert('Já existe uma exceção cadastrada para essa data.');
      return;
    }

    evento.target.reset();
    document.getElementById('campos-horario-excecao').style.display = 'flex';
    carregarExcecoes();
  } catch (erro) {
    console.error('Erro ao criar exceção:', erro);
    alert('Não foi possível criar a exceção. Tente novamente.');
  }
});

carregarHorarioPadrao();
carregarExcecoes();