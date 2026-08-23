const loansService = require('./loans.service');

async function createLoan(req, res) {
  try {
    const existing = await loansService.getActiveLoanByClientId(req.body.clientId);
    if (existing) {
      return res.status(409).json({ error: 'El cliente registra un préstamo activo en proceso.' });
    }
    if (existing && existing.is_overdue) {
      return res.status(409).json({ error: 'No se puede otorgar un nuevo préstamo si registra saldo en mora.' });
    }

    const installmentValue = req.body.amount / req.body.installments;
    if (installmentValue > req.body.monthlyIncome) {
      return res.status(400).json({ error: 'La cuota mensual excede sus ingresos.' });
    }

    const loan = await loansService.createLoan({ ...req.body, installmentValue });
    res.status(201).json(loan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getLoanByClient(req, res) {
  try {
    const loan = await loansService.getActiveLoanByClientId(req.params.clientId);
    if (!loan) return res.status(404).json({ error: 'No se encontró préstamo activo.' });
    res.json(loan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { createLoan, getLoanByClient };