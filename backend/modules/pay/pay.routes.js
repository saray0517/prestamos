const express = require('express');
const router = express.Router();
const controller = require('./pay.controller');
const { validatePaymentRequest } = require('./pay.middleware');

router.post('/', validatePaymentRequest, controller.processPayment);

module.exports = router;