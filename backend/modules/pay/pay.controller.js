const payService = require('./pay.service');
const loansService = require('../loans/loans.service');

async function processPayment(req, res) {
  try {
    const { clientId, amount, isOverdue } = req.body;
    const loan = await loansService.getActiveLoanByClientId(clientId);

    if (!loan) {
      return res.status(404).json({ error: 'No hay ningún préstamo activo para esta cédula.' });
    }
    if (loan.remaining_balance <= 0) {
      return res.status(400).json({ error: 'El préstamo ya se encuentra completamente pagado.' });
    }
    if (amount > loan.remaining_balance) {
      return res.status(400).json({ error: 'El pago no puede ser superior al saldo pendiente.' });
    }

    const updatedLoan = await payService.registerPayment(loan, amount, !!isOverdue);
    res.json(updatedLoan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { processPayment };