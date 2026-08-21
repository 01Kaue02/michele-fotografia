const express = require('express');
const router = express.Router();
const controller = require('../controllers/horarioPadraoController');

router.get('/', controller.listarHorarioPadrao);
router.post('/', controller.salvarHorarioPadrao);

module.exports = router;