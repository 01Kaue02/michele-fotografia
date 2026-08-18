const API_URL = 'http://localhost:3000/api';

// Lê o servico_id que veio da página de categoria
const params = new URLSearchParams(window.location.search);
const servicoId = params.get('servico_id');

let dataEscolhida = null;
let horarioEscolhido = null;

// Busca o nome do serviço, só para mostrar na tela (usando a API que já existe)
async function carregarNomeServico() {
  const resposta = await fetch(`${API_URL}/servicos`);
  const servicos = await resposta.json();
  const servico = servicos.find(s => s.id == servicoId);

  if (servico) {
    document.getElementById('nome-servico-selecionado').textContent =
      `Serviço selecionado: ${servico.nome}`;
  }
}

// ETAPA 1 -> 2: buscar horários livres na data escolhida
document.getElementById('btn-buscar-horarios').addEventListener('click', async () => {
  dataEscolhida = document.getElementById('input-data').value;

  if (!dataEscolhida) {
    alert('Escolha uma data primeiro');
    return;
  }

  const resposta = await fetch(`${API_URL}/horarios?data=${dataEscolhida}&servico_id=${servicoId}`);
  const horarios = await resposta.json();

  renderizarHorarios(horarios);
});

function renderizarHorarios(horarios) {
  const container = document.getElementById('lista-horarios');

  if (horarios.length === 0) {
    container.innerHTML = '<p>Nenhum horário disponível nessa data. Tente outro dia.</p>';
  } else {
    container.innerHTML = horarios.map(h => `
      <button class="btn-horario" data-inicio="${h.hora_inicio}" data-fim="${h.hora_fim}">
        ${h.hora_inicio} às ${h.hora_fim}
      </button>
    `).join('');

    // Adiciona o clique em cada botão de horário gerado
    document.querySelectorAll('.btn-horario').forEach(botao => {
      botao.addEventListener('click', () => {
        // Remove a marcação visual de qualquer botão selecionado antes
        document.querySelectorAll('.btn-horario').forEach(b => b.classList.remove('selecionado'));

        // Marca visualmente o botão que acabou de ser clicado
        botao.classList.add('selecionado');

        horarioEscolhido = {
          hora_inicio: botao.dataset.inicio,
          hora_fim: botao.dataset.fim,
        };
        document.getElementById('etapa-dados').style.display = 'block';
      });
    });
  }

  document.getElementById('etapa-horarios').style.display = 'block';
}

// ETAPA 3: confirmar o agendamento
document.getElementById('btn-confirmar').addEventListener('click', async () => {
  const nome = document.getElementById('input-nome').value;
  const telefone = document.getElementById('input-telefone').value;
  const observacoes = document.getElementById('input-observacoes').value;

  if (!nome || !telefone) {
    alert('Preencha nome e telefone');
    return;
  }

  try {
    const resposta = await fetch(`${API_URL}/agendamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        servico_id: servicoId,
        nome_cliente: nome,
        telefone_cliente: telefone,
        observacoes: observacoes,
        data: dataEscolhida,
        hora_inicio: horarioEscolhido.hora_inicio,
        hora_fim: horarioEscolhido.hora_fim,
      }),
    });

    if (resposta.status === 409) {
      alert('Esse horário acabou de ser ocupado por outra pessoa. Escolha outro.');
      return;
    }

    if (!resposta.ok) {
      throw new Error('Falha ao confirmar agendamento');
    }

    // Esconde todas as etapas e mostra a confirmação
    document.querySelectorAll('.etapa').forEach(etapa => etapa.style.display = 'none');
    document.getElementById('mensagem-confirmacao').textContent =
      `Sua sessão foi agendada para ${dataEscolhida} das ${horarioEscolhido.hora_inicio} às ${horarioEscolhido.hora_fim}. Entraremos em contato pelo telefone informado.`;
    document.getElementById('etapa-confirmacao').style.display = 'block';

  } catch (erro) {
    console.error('Erro ao confirmar agendamento:', erro);
    alert('Não foi possível confirmar o agendamento. Tente novamente.');
  }
});

carregarNomeServico();