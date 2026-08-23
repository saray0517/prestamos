const express = require('express');
const router = express.Router();
const controller = require('./loans.controller');
const { validateLoanRequest } = require('./loans.middleware');

router.post('/', validateLoanRequest, controller.createLoan);
router.get('/:clientId', controller.getLoanByClient);

module.exports = router;