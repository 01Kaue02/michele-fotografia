const express = require('express');
const router = express.Router();
const agendamentosController = require('../controllers/agendamentosController');

router.post('/', agendamentosController.criarAgendamento);

module.exports = router;
