const pool = require('../config/database');

async function criarAgendamento(req, res) {
  const { servico_id, nome_cliente, telefone_cliente, data, hora_inicio, hora_fim, observacoes } = req.body;

  if (!servico_id || !nome_cliente || !telefone_cliente || !data || !hora_inicio || !hora_fim) {
    return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Trava consultiva: "reserva" esse dia específico até o fim da transação,
    // impedindo que outra requisição simultânea mexa na agenda do mesmo dia
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [data]);

    // Verifica se já existe algum agendamento nesse dia que se sobrepõe ao horário pedido
    const conflito = await client.query(
      `SELECT id FROM agendamentos 
       WHERE data = $1 
       AND hora_inicio < $2 
       AND hora_fim > $3`,
      [data, hora_fim, hora_inicio]
    );

    if (conflito.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ erro: 'Esse horário acabou de ser ocupado por outra pessoa' });
    }

    const novoAgendamento = await client.query(
      `INSERT INTO agendamentos (servico_id, nome_cliente, telefone_cliente, data, hora_inicio, hora_fim, observacoes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [servico_id, nome_cliente, telefone_cliente, data, hora_inicio, hora_fim, observacoes || null]
    );

    await client.query('COMMIT');

    res.status(201).json(novoAgendamento.rows[0]);
  } catch (erro) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar agendamento:', erro);
    res.status(500).json({ erro: 'Falha ao criar agendamento' });
  } finally {
    client.release();
  }
}

module.exports = {
  criarAgendamento,
};