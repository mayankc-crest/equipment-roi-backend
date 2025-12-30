const getInvoicesIds = (invoices = []) => {
  const ids = invoices.map((invoice) => invoice.invoice_id);
  return ids;
};

module.exports = { getInvoicesIds };
