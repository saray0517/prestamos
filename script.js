let activeLoan = null;

function showNotification(text, isError = true) {
  const messageElement = document.getElementById('system-message');
  messageElement.innerText = text;
  messageElement.className = isError ? 'message-error' : 'message-success';
}
function requestLoan() {
  const amount = parseFloat(document.getElementById('requested-amount').value);
  const installments = parseInt(document.getElementById('installments-count').value);


  if (activeLoan && activeLoan.isOverdue) {
    showNotification("No se puede otorgar un nuevo préstamo si registra saldo en mora.");
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    showNotification("El monto debe ser mayor a 0.");
    return;
  }
  if (isNaN(installments) || installments < 1 || installments > 60) {
    showNotification("El número de cuotas debe estar entre 1 y 60.");
    return;
  }

  const installmentValue = amount / installments;

  activeLoan = {
    originalAmount: amount,
    totalInstallments: installments,
    installmentValue: installmentValue,
    remainingBalance: amount,
    isOverdue: false
  };

  updateUI();
  showNotification("¡Préstamo registrado exitosamente!", false);
}

function processPayment() {
  if (!activeLoan || activeLoan.remainingBalance === 0) {
    showNotification("No hay ningún préstamo activo con saldo pendiente.");
    return;
  }

  const paymentAmount = parseFloat(document.getElementById('payment-amount').value);
  const isPaymentOverdue = document.getElementById('overdue-checkbox').checked;

  if (isNaN(paymentAmount) || paymentAmount <= 0) {
    showNotification("Ingrese un valor de pago válido.");
    return;
  }

  if (paymentAmount > activeLoan.remainingBalance) {
    showNotification("El pago no puede ser superior al saldo pendiente.");
    return;
  }

  activeLoan.remainingBalance -= paymentAmount;
  activeLoan.isOverdue = isPaymentOverdue && activeLoan.remainingBalance > 0;

  updateUI();
  showNotification("Pago registrado correctamente.", false);
}

function updateUI() {
  if (!activeLoan) return;

  document.getElementById('display-amount').innerText = activeLoan.originalAmount.toLocaleString();
  document.getElementById('display-installments').innerText = activeLoan.totalInstallments;
  document.getElementById('display-installment-value').innerText = activeLoan.installmentValue.toFixed(2);
  document.getElementById('display-remaining-balance').innerText = activeLoan.remainingBalance.toFixed(2);
  document.getElementById('display-overdue-status').innerText = activeLoan.isOverdue ? "SÍ" : "No";
}