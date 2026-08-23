const pool = require('../../config/db');

async function createLoan(data) {
  const [result] = await pool.query(
    `INSERT INTO loans 
     (client_id, first_name, last_name, address, employment_type, company_name, job_title,
      monthly_income, original_amount, total_installments, installment_value, loan_date, remaining_balance)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.clientId, data.firstName, data.lastName, data.address, data.employmentType,
     data.companyName || null, data.jobTitle || null, data.monthlyIncome, data.amount,
     data.installments, data.installmentValue, data.loanDate, data.amount]
  );
  return { id: result.insertId, ...data };
}

async function getActiveLoanByClientId(clientId) {
  const [rows] = await pool.query(
    `SELECT * FROM loans WHERE client_id = ? AND remaining_balance > 0 ORDER BY id DESC LIMIT 1`,
    [clientId]
  );
  return rows[0] || null;
}

async function updateLoanBalance(loanId, newBalance, paymentsMade, isOverdue) {
  await pool.query(
    `UPDATE loans SET remaining_balance = ?, payments_made = ?, is_overdue = ? WHERE id = ?`,
    [newBalance, paymentsMade, isOverdue, loanId]
  );
}

module.exports = { createLoan, getActiveLoanByClientId, updateLoanBalance };