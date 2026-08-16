const pool = require('../config/database');

// Lista todos os serviços ativos
async function listarServicos(req, res) {
  try {
    const resultado = await pool.query(
      'SELECT * FROM servicos WHERE ativo = true ORDER BY categoria, nome'
    );
    res.json(resultado.rows);
  } catch (erro) {
    console.error('Erro ao listar serviços:', erro);
    res.status(500).json({ erro: 'Falha ao buscar serviços' });
  }
}

// Lista serviços de uma categoria específica
async function listarServicosPorCategoria(req, res) {
  const { categoria } = req.params;

  try {
    const resultado = await pool.query(
      'SELECT * FROM servicos WHERE categoria = $1 AND ativo = true ORDER BY nome',
      [categoria]
    );
    res.json(resultado.rows);
  } catch (erro) {
    console.error('Erro ao listar serviços por categoria:', erro);
    res.status(500).json({ erro: 'Falha ao buscar serviços da categoria' });
  }
}

module.exports = {
  listarServicos,
  listarServicosPorCategoria,
};