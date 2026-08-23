let activeLoan = null;

function parseInputNumber(value) {
  if (!value) return 0;
  const cleanValue = value.toString().replace(/\./g, '').replace(',', '.');
  return parseFloat(cleanValue);
}

function showNotification(text, isError = true) {
  const messageElement = document.getElementById('system-message');
  messageElement.innerText = text;
  messageElement.className = isError ? 'message-error' : 'message-success';
}

function showSection(sectionId) {
  document.getElementById('welcome-screen').classList.add('hidden');
  document.getElementById('request-section').classList.add('hidden');
  document.getElementById('details-section').classList.add('hidden');
  document.getElementById('payment-section').classList.add('hidden');

  document.getElementById(sectionId).classList.remove('hidden');
  showNotification('');
}

function resetRequestForm() {
  document.getElementById('client-id').value = '';
  document.getElementById('first-name').value = '';
  document.getElementById('last-name').value = '';
  document.getElementById('address').value = '';
  document.getElementById('monthly-income').value = '';
  document.getElementById('requested-amount').value = '';
  document.getElementById('installments-count').value = '';
  document.getElementById('loan-date').value = '';
  showNotification('Formulario listo para registrar un nuevo préstamo.', false);
}

function calculateNextPaymentDate(startDateString, paymentsMade) {
  if (!startDateString) return '-';
  const parts = startDateString.split('-');
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  const day = parseInt(parts[2]);

  const date = new Date(year, month, day);
  date.setMonth(date.getMonth() + paymentsMade + 1);

  return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
}

function requestLoan() {
  const clientId = document.getElementById('client-id').value.trim();
  const firstName = document.getElementById('first-name').value.trim();
  const lastName = document.getElementById('last-name').value.trim();
  const address = document.getElementById('address').value.trim();
  const monthlyIncome = parseInputNumber(document.getElementById('monthly-income').value);
  const amount = parseInputNumber(document.getElementById('requested-amount').value);
  const installments = parseInt(document.getElementById('installments-count').value);
  const loanDate = document.getElementById('loan-date').value;

  if (!clientId || !firstName || !lastName || !address) {
    showNotification("Por favor complete todos los datos personales del cliente.");
    return;
  }

  if (activeLoan && activeLoan.isOverdue) {
    showNotification("No se puede otorgar un nuevo préstamo si registra saldo en mora.");
    return;
  }

  if (isNaN(monthlyIncome) || monthlyIncome <= 0) {
    showNotification("El ingreso mensual debe ser mayor a 0.");
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

  if (!loanDate) {
    showNotification("Por favor seleccione la fecha del préstamo.");
    return;
  }

  const installmentValue = amount / installments;

  if (installmentValue > monthlyIncome) {
    showNotification("No se pudo realizar el préstamo: la cuota mensual excede sus ingresos.");
    return;
  }

  activeLoan = {
    clientId: clientId,
    clientName: `${firstName} ${lastName}`,
    address: address,
    monthlyIncome: monthlyIncome,
    originalAmount: amount,
    totalInstallments: installments,
    installmentValue: installmentValue,
    loanDate: loanDate,
    paymentsMade: 0,
    remainingBalance: amount,
    isOverdue: false
  };

  updateUI();
  showSection('details-section');
  showNotification("¡Préstamo registrado exitosamente!", false);
}

function processPayment() {
  const paymentClientId = document.getElementById('payment-client-id').value.trim();

  if (!activeLoan) {
    showNotification("No hay ningún préstamo activo en el sistema.");
    return;
  }

  if (paymentClientId !== activeLoan.clientId) {
    showNotification("La cédula no coincide con el cliente del préstamo activo.");
    return;
  }

  if (activeLoan.remainingBalance === 0) {
    showNotification("El préstamo ya se encuentra completamente pagado.");
    return;
  }

  const paymentAmountRaw = document.getElementById('payment-amount').value;
  const paymentAmount = parseInputNumber(paymentAmountRaw);
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
  activeLoan.paymentsMade += 1;
  activeLoan.isOverdue = isPaymentOverdue && activeLoan.remainingBalance > 0;

  updateUI();
  showSection('details-section');
  showNotification("Pago registrado correctamente.", false);
}

function updateUI() {
  if (!activeLoan) return;

  document.getElementById('display-client-name').innerText = activeLoan.clientName;
  document.getElementById('display-client-id').innerText = activeLoan.clientId;
  document.getElementById('display-amount').innerText = activeLoan.originalAmount.toLocaleString('es-CO');
  document.getElementById('display-installments').innerText = activeLoan.totalInstallments;
  document.getElementById('display-installment-value').innerText = activeLoan.installmentValue.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  document.getElementById('display-loan-date').innerText = activeLoan.loanDate;
  document.getElementById('display-next-payment-date').innerText = calculateNextPaymentDate(activeLoan.loanDate, activeLoan.paymentsMade);
  document.getElementById('display-payments-count').innerText = activeLoan.paymentsMade;
  document.getElementById('display-remaining-balance').innerText = activeLoan.remainingBalance.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  document.getElementById('display-overdue-status').innerText = activeLoan.isOverdue ? "SÍ" : "No";
}