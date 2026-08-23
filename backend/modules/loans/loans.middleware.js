function validateLoanRequest(req, res, next) {
  const { clientId, firstName, lastName, address, employmentType, monthlyIncome, amount, installments, loanDate } = req.body;

  if (!clientId || !firstName || !lastName || !address) {
    return res.status(400).json({ error: 'Por favor complete todos los datos personales del cliente.' });
  }
  if (employmentType === 'empresa' && (!req.body.companyName || !req.body.jobTitle)) {
    return res.status(400).json({ error: 'Por favor ingrese la empresa y el cargo del cliente.' });
  }
  if (!monthlyIncome || monthlyIncome <= 0) {
    return res.status(400).json({ error: 'El ingreso mensual debe ser mayor a 0.' });
  }
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'El monto debe ser mayor a 0.' });
  }
  if (!installments || installments < 1 || installments > 60) {
    return res.status(400).json({ error: 'El número de cuotas debe estar entre 1 y 60.' });
  }
  if (!loanDate) {
    return res.status(400).json({ error: 'Por favor seleccione la fecha del préstamo.' });
  }

  next();
}

module.exports = { validateLoanRequest };