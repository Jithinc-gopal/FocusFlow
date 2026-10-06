/**
 * expenseService.js
 * API communication service for personal expense tracker.
 */

const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Token ${token}` } : {}),
})

/**
 * Fetch expenses for a specific month and year.
 * @param {string} token - Auth token
 * @param {Object} options - { year, month }
 */
export async function fetchExpenses(token, { year, month } = {}) {
  let url = '/api/expenses/'
  const params = new URLSearchParams()
  if (year) params.append('year', year)
  if (month) params.append('month', month)
  const queryString = params.toString()
  if (queryString) {
    url += `?${queryString}`
  }

  const res = await fetch(url, {
    method: 'GET',
    headers: getHeaders(token),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || errorData.error || 'Failed to load expenses.')
  }

  return res.json()
}

/**
 * Create a new expense.
 * @param {string} token - Auth token
 * @param {Object} data - { description, amount, expense_date }
 */
export async function createExpense(token, data) {
  const res = await fetch('/api/expenses/', {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    const firstKey = Object.keys(errorData)[0]
    const msg = Array.isArray(errorData[firstKey])
      ? errorData[firstKey][0]
      : errorData.detail || errorData.error || 'Failed to create expense.'
    throw new Error(msg)
  }

  return res.json()
}

/**
 * Update an existing expense.
 * @param {string} token - Auth token
 * @param {number|string} id - Expense ID
 * @param {Object} data - Partial expense updates
 */
export async function updateExpense(token, id, data) {
  const res = await fetch(`/api/expenses/${id}/`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    const firstKey = Object.keys(errorData)[0]
    const msg = Array.isArray(errorData[firstKey])
      ? errorData[firstKey][0]
      : errorData.detail || errorData.error || 'Failed to update expense.'
    throw new Error(msg)
  }

  return res.json()
}

/**
 * Delete an expense.
 * @param {string} token - Auth token
 * @param {number|string} id - Expense ID
 */
export async function deleteExpense(token, id) {
  const res = await fetch(`/api/expenses/${id}/`, {
    method: 'DELETE',
    headers: getHeaders(token),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || errorData.error || 'Failed to delete expense.')
  }

  return true
}

/**
 * Fetch monthly expense history with dynamic totals.
 * @param {string} token - Auth token
 */
export async function fetchExpenseHistory(token) {
  const res = await fetch('/api/expenses/history/', {
    method: 'GET',
    headers: getHeaders(token),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || errorData.error || 'Failed to load expense history.')
  }

  return res.json()
}
