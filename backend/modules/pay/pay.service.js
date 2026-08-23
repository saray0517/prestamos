const pool = require('../../config/db');
const loansService = require('../loans/loans.service');

async function registerPayment(loan, amount, isOverdue) {
  const newBalance = loan.remaining_balance - amount;
  const newPaymentsMade = loan.payments_made + 1;
  const finalOverdue = isOverdue && newBalance > 0;

  await pool.query(
    `INSERT INTO payments (loan_id, amount, is_overdue) VALUES (?, ?, ?)`,
    [loan.id, amount, finalOverdue]
  );

  await loansService.updateLoanBalance(loan.id, newBalance, newPaymentsMade, finalOverdue);

  return { ...loan, remaining_balance: newBalance, payments_made: newPaymentsMade, is_overdue: finalOverdue };
}

module.exports = { registerPayment };