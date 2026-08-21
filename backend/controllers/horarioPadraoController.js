const pool = require('../config/database');

// Lista todo o horário padrão cadastrado
async function listarHorarioPadrao(req, res) {
  try {
    const resultado = await pool.query(
      'SELECT * FROM horario_padrao ORDER BY dia_semana'
    );
    res.json(resultado.rows);
  } catch (erro) {
    console.error('Erro ao listar horário padrão:', erro);
    res.status(500).json({ erro: 'Falha ao buscar horário padrão' });
  }
}

// Cria ou atualiza o horário padrão de um dia da semana específico
async function salvarHorarioPadrao(req, res) {
  const { dia_semana, hora_inicio, hora_fim, ativo } = req.body;

  if (dia_semana === undefined || !hora_inicio || !hora_fim) {
    return res.status(400).json({ erro: 'Informe dia_semana, hora_inicio e hora_fim' });
  }

  try {
    // Verifica se já existe um registro para esse dia da semana
    const existente = await pool.query(
      'SELECT id FROM horario_padrao WHERE dia_semana = $1',
      [dia_semana]
    );

    let resultado;

    if (existente.rows.length > 0) {
      // Já existe: atualiza
      resultado = await pool.query(
        `UPDATE horario_padrao 
         SET hora_inicio = $1, hora_fim = $2, ativo = $3
         WHERE dia_semana = $4
         RETURNING *`,
        [hora_inicio, hora_fim, ativo ?? true, dia_semana]
      );
    } else {
      // Não existe: cria novo
      resultado = await pool.query(
        `INSERT INTO horario_padrao (dia_semana, hora_inicio, hora_fim, ativo)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [dia_semana, hora_inicio, hora_fim, ativo ?? true]
      );
    }

    res.status(200).json(resultado.rows[0]);
  } catch (erro) {
    console.error('Erro ao salvar horário padrão:', erro);
    res.status(500).json({ erro: 'Falha ao salvar horário padrão' });
  }
}

module.exports = {
  listarHorarioPadrao,
  salvarHorarioPadrao,
};