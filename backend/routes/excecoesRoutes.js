const express = require('express');
const router = express.Router();
const controller = require('../controllers/excecoesController');

router.get('/', controller.listarExcecoes);
router.post('/', controller.criarExcecao);
router.delete('/:id', controller.excluirExcecao);

module.exports = router;