const getInvoicesIds = (invoices = []) => {
  const ids = invoices.map((invoice) => invoice.invoice_id);
  console.log("ids:::", ids);
  return ids;
};

module.exports = { getInvoicesIds };
