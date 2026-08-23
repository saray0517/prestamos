function validatePaymentRequest(req, res, next) {
  const { clientId, amount } = req.body;
  if (!clientId) {
    return res.status(400).json({ error: 'Debe indicar la cédula del cliente.' });
  }
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Ingrese un valor de pago válido.' });
  }
  next();
}

module.exports = { validatePaymentRequest };