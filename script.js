const API_BASE_URL = 'http://localhost:3008/api';

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

function toggleEmploymentFields() {
  const employmentType = document.getElementById('employment-type').value;
  const companyFields = document.getElementById('company-fields');

  if (employmentType === 'empresa') {
    companyFields.classList.remove('hidden');
  } else {
    companyFields.classList.add('hidden');
    document.getElementById('company-name').value = '';
    document.getElementById('job-title').value = '';
  }
}

function resetRequestForm() {
  document.getElementById('client-id').value = '';
  document.getElementById('first-name').value = '';
  document.getElementById('last-name').value = '';
  document.getElementById('address').value = '';
  document.getElementById('employment-type').value = 'independiente';
  toggleEmploymentFields();
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

// Convierte la fila que devuelve MySQL (snake_case, DECIMAL como string)
// al mismo formato que ya usa updateUI() en el frontend.
function mapLoanFromServer(loan) {
  const firstName = loan.first_name ?? loan.firstName;
  const lastName = loan.last_name ?? loan.lastName;

  return {
    clientId: loan.client_id ?? loan.clientId,
    clientName: `${firstName ?? ''} ${lastName ?? ''}`.trim(),
    address: loan.address,
    employmentType: loan.employment_type ?? loan.employmentType,
    companyName: loan.company_name ?? loan.companyName,
    jobTitle: loan.job_title ?? loan.jobTitle,
    monthlyIncome: parseFloat(loan.monthly_income ?? loan.monthlyIncome),
    originalAmount: parseFloat(loan.original_amount ?? loan.amount),
    totalInstallments: loan.total_installments ?? loan.installments,
    installmentValue: parseFloat(loan.installment_value ?? loan.installmentValue),
    loanDate: typeof (loan.loan_date ?? loan.loanDate) === 'string'
      ? (loan.loan_date ?? loan.loanDate).substring(0, 10)
      : (loan.loan_date ?? loan.loanDate),
    paymentsMade: loan.payments_made ?? loan.paymentsMade ?? 0,
    remainingBalance: parseFloat(loan.remaining_balance ?? loan.remainingBalance ?? loan.amount),
    isOverdue: !!(loan.is_overdue ?? loan.isOverdue)
  };
}

async function requestLoan() {
  const clientId = document.getElementById('client-id').value.trim();
  const firstName = document.getElementById('first-name').value.trim();
  const lastName = document.getElementById('last-name').value.trim();
  const address = document.getElementById('address').value.trim();
  const employmentType = document.getElementById('employment-type').value;
  const companyName = document.getElementById('company-name').value.trim();
  const jobTitle = document.getElementById('job-title').value.trim();
  const monthlyIncome = parseInputNumber(document.getElementById('monthly-income').value);
  const amount = parseInputNumber(document.getElementById('requested-amount').value);
  const installments = parseInt(document.getElementById('installments-count').value);
  const loanDate = document.getElementById('loan-date').value;

  // Validaciones rápidas en el cliente (el backend valida de nuevo, es la fuente de verdad)
  if (!clientId || !firstName || !lastName || !address) {
    showNotification("Por favor complete todos los datos personales del cliente.");
    return;
  }
  if (employmentType === 'empresa' && (!companyName || !jobTitle)) {
    showNotification("Por favor ingrese la empresa y el cargo del cliente.");
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

  const payload = {
    clientId, firstName, lastName, address, employmentType,
    companyName: employmentType === 'empresa' ? companyName : null,
    jobTitle: employmentType === 'empresa' ? jobTitle : null,
    monthlyIncome, amount, installments, loanDate
  };

  try {
    const response = await fetch(`${API_BASE_URL}/loans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      showNotification(data.error || "No se pudo registrar el préstamo.");
      return;
    }

    activeLoan = mapLoanFromServer(data);
    updateUI();
    showSection('details-section');
    showNotification("¡Préstamo registrado exitosamente!", false);
  } catch (err) {
    showNotification("No se pudo conectar con el servidor. Verifique que el backend esté corriendo.");
  }
}

async function processPayment() {
  const paymentClientId = document.getElementById('payment-client-id').value.trim();
  const paymentAmountRaw = document.getElementById('payment-amount').value;
  const paymentAmount = parseInputNumber(paymentAmountRaw);
  const isPaymentOverdue = document.getElementById('overdue-checkbox').checked;

  if (!paymentClientId) {
    showNotification("Ingrese la cédula del cliente.");
    return;
  }
  if (isNaN(paymentAmount) || paymentAmount <= 0) {
    showNotification("Ingrese un valor de pago válido.");
    return;
  }

  const payload = {
    clientId: paymentClientId,
    amount: paymentAmount,
    isOverdue: isPaymentOverdue
  };

  try {
    const response = await fetch(`${API_BASE_URL}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      showNotification(data.error || "No se pudo registrar el pago.");
      return;
    }

    activeLoan = mapLoanFromServer(data);
    updateUI();
    showSection('details-section');
    showNotification("Pago registrado correctamente.", false);
  } catch (err) {
    showNotification("No se pudo conectar con el servidor. Verifique que el backend esté corriendo.");
  }
}

function updateUI() {
  if (!activeLoan) return;

  document.getElementById('display-client-name').innerText = activeLoan.clientName;
  document.getElementById('display-client-id').innerText = activeLoan.clientId;
  document.getElementById('display-employment-type').innerText = activeLoan.employmentType === 'empresa' ? 'Empleado (Empresa)' : 'Independiente';

  const companyWrapper = document.getElementById('display-company-wrapper');
  if (activeLoan.employmentType === 'empresa') {
    companyWrapper.classList.remove('hidden');
    document.getElementById('display-company-info').innerText = `${activeLoan.companyName} - ${activeLoan.jobTitle}`;
  } else {
    companyWrapper.classList.add('hidden');
  }

  document.getElementById('display-amount').innerText = activeLoan.originalAmount.toLocaleString('es-CO');
  document.getElementById('display-installments').innerText = activeLoan.totalInstallments;
  document.getElementById('display-installment-value').innerText = activeLoan.installmentValue.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  document.getElementById('display-loan-date').innerText = activeLoan.loanDate;
  document.getElementById('display-next-payment-date').innerText = calculateNextPaymentDate(activeLoan.loanDate, activeLoan.paymentsMade);
  document.getElementById('display-payments-count').innerText = activeLoan.paymentsMade;
  document.getElementById('display-remaining-balance').innerText = activeLoan.remainingBalance.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  document.getElementById('display-overdue-status').innerText = activeLoan.isOverdue ? "SÍ" : "No";
}