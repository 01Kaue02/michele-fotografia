const express = require('express');
const router = express.Router();
const horariosController = require('../controllers/horariosController');

router.get('/', horariosController.listarHorariosLivres);

module.exports = router;