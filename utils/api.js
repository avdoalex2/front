// 🎯 info4invo - Αναβαθμισμένο api.js που χρησιμοποιεί το Next.js Proxy Rewrite
const BACKEND = '/backend'

export async function uploadDocument(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BACKEND}/documents/analyze`, {
    method: 'POST',
    body: form
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function askQuestion(docId, question) {
  const res = await fetch(`${BACKEND}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ doc_id: docId, question })
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export function buildSummary(fields = {}, lineItems = []) {
  const g = k => fields[k]?.value ?? null
  return {
    vendor: g('VendorName') || g('SupplierName') || 'N/A',
    total: g('InvoiceTotal') || g('AmountDue') || 'N/A',
    date: g('InvoiceDate') || 'N/A',
    items: lineItems.length,
    IsPaid: g('IsPaid') ?? false
  }
}