const pool = require('../config/database');

// Lista todas as exceções cadastradas (datas futuras)
async function listarExcecoes(req, res) {
  try {
    const resultado = await pool.query(
      'SELECT * FROM excecoes_horario WHERE data >= CURRENT_DATE ORDER BY data'
    );
    res.json(resultado.rows);
  } catch (erro) {
    console.error('Erro ao listar exceções:', erro);
    res.status(500).json({ erro: 'Falha ao buscar exceções' });
  }
}

// Cria uma exceção para uma data específica
async function criarExcecao(req, res) {
  const { data, fechado, hora_inicio, hora_fim } = req.body;

  if (!data) {
    return res.status(400).json({ erro: 'Informe a data' });
  }

  try {
    const resultado = await pool.query(
      `INSERT INTO excecoes_horario (data, fechado, hora_inicio, hora_fim)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data, fechado ?? false, hora_inicio || null, hora_fim || null]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (erro) {
    if (erro.code === '23505') {
      // Código de erro do PostgreSQL para violação de UNIQUE
      return res.status(409).json({ erro: 'Já existe uma exceção cadastrada para essa data' });
    }
    console.error('Erro ao criar exceção:', erro);
    res.status(500).json({ erro: 'Falha ao criar exceção' });
  }
}

// Remove uma exceção (ex: ela mudou de ideia)
async function excluirExcecao(req, res) {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM excecoes_horario WHERE id = $1', [id]);
    res.status(204).send();
  } catch (erro) {
    console.error('Erro ao excluir exceção:', erro);
    res.status(500).json({ erro: 'Falha ao excluir exceção' });
  }
}

module.exports = {
  listarExcecoes,
  criarExcecao,
  excluirExcecao,
};