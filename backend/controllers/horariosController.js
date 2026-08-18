const pool = require('../config/database');

// Converte "09:30" em minutos desde meia-noite (570), para facilitar contas
function horaParaMinutos(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

// Faz o caminho inverso: minutos desde meia-noite de volta para "09:30"
function minutosParaHora(minutos) {
  const h = Math.floor(minutos / 60).toString().padStart(2, '0');
  const m = (minutos % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

async function listarHorariosLivres(req, res) {
  const { data, servico_id } = req.query;

  if (!data || !servico_id) {
    return res.status(400).json({ erro: 'Informe a data e o servico_id' });
  }

  try {
    // 1. Busca a duração do serviço escolhido
    const servico = await pool.query(
      'SELECT duracao_horas FROM servicos WHERE id = $1',
      [servico_id]
    );

    if (servico.rows.length === 0) {
      return res.status(404).json({ erro: 'Serviço não encontrado' });
    }

    const duracaoMinutos = Number(servico.rows[0].duracao_horas) * 60;

    // 2. Descobre o dia da semana (0 = domingo, 6 = sábado)
    const diaSemana = new Date(`${data}T00:00:00`).getDay();

    // 3. Verifica se existe exceção cadastrada para essa data
    const excecao = await pool.query(
      'SELECT * FROM excecoes_horario WHERE data = $1',
      [data]
    );

    let horaInicioTrabalho, horaFimTrabalho;

    if (excecao.rows.length > 0 && excecao.rows[0].fechado) {
      // Dia marcado como fechado: não há horários disponíveis
      return res.json([]);
    } else if (excecao.rows.length > 0 && excecao.rows[0].hora_inicio) {
      // Exceção com horário reduzido/diferente
      horaInicioTrabalho = excecao.rows[0].hora_inicio;
      horaFimTrabalho = excecao.rows[0].hora_fim;
    } else {
      // Sem exceção: usa o padrão do dia da semana
      const padrao = await pool.query(
        'SELECT * FROM horario_padrao WHERE dia_semana = $1 AND ativo = true',
        [diaSemana]
      );

      if (padrao.rows.length === 0) {
        // Ela não atende nesse dia da semana
        return res.json([]);
      }

      horaInicioTrabalho = padrao.rows[0].hora_inicio;
      horaFimTrabalho = padrao.rows[0].hora_fim;
    }

    // 4. Busca agendamentos já existentes nessa data
    const agendamentosExistentes = await pool.query(
      'SELECT hora_inicio, hora_fim FROM agendamentos WHERE data = $1 ORDER BY hora_inicio',
      [data]
    );

    // 5. Calcula os intervalos livres entre os agendamentos
    const inicioTrabalho = horaParaMinutos(horaInicioTrabalho);
    const fimTrabalho = horaParaMinutos(horaFimTrabalho);

    const ocupados = agendamentosExistentes.rows.map(a => ({
      inicio: horaParaMinutos(a.hora_inicio),
      fim: horaParaMinutos(a.hora_fim),
    }));

    const intervalosLivres = [];
    let cursor = inicioTrabalho;

    for (const bloco of ocupados) {
      if (bloco.inicio > cursor) {
        intervalosLivres.push({ inicio: cursor, fim: bloco.inicio });
      }
      cursor = Math.max(cursor, bloco.fim);
    }

    if (cursor < fimTrabalho) {
      intervalosLivres.push({ inicio: cursor, fim: fimTrabalho });
    }

    // 6. Dentro de cada intervalo livre, gera horários de início possíveis
    //    (de 30 em 30 minutos), checando se cabe a duração do serviço
    const horariosDisponiveis = [];
    const INTERVALO_SUGESTAO = 30; // minutos entre cada sugestão de horário

    for (const intervalo of intervalosLivres) {
      let inicioSugestao = intervalo.inicio;

      while (inicioSugestao + duracaoMinutos <= intervalo.fim) {
        horariosDisponiveis.push({
          hora_inicio: minutosParaHora(inicioSugestao),
          hora_fim: minutosParaHora(inicioSugestao + duracaoMinutos),
        });
        inicioSugestao += INTERVALO_SUGESTAO;
      }
    }

    res.json(horariosDisponiveis);
  } catch (erro) {
    console.error('Erro ao calcular horários livres:', erro);
    res.status(500).json({ erro: 'Falha ao calcular horários disponíveis' });
  }
}

module.exports = {
  listarHorariosLivres,
};