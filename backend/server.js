require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/database');
const servicosRoutes = require('./routes/servicosRoutes');
const horariosRoutes = require('./routes/horariosRoutes');
const agendamentosRoutes = require('./routes/agendamentosRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api/horarios', horariosRoutes);
app.use('/api/agendamentos', agendamentosRoutes);

app.use('/api/servicos', servicosRoutes);

// Rota simples só para testar se o servidor e o banco estão funcionando
app.get('/api/teste-conexao', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT NOW()');
    res.json({
      mensagem: 'Conexão com o banco funcionando!',
      horarioServidor: resultado.rows[0].now,
    });
  } catch (erro) {
    console.error('Erro ao conectar no banco:', erro);
    res.status(500).json({ erro: 'Falha ao conectar no banco de dados' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});