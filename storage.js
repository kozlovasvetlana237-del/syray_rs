if (typeof window.DATA === 'undefined') {
  document.body.innerHTML = '<div style="padding:40px;text-align:center;color:red;font-size:18px;">Ошибка: данные не загружены. Проверьте консоль браузера (F12).</div>';
  throw new Error('DATA is not defined');
}

const _ = window.DATA;

const Storage = {
  accounts() {
    return _.accounts;
  },
  categories() {
    return _.categories;
  },
  categoryData(cat) {
    const d = _.category_data[cat];
    if (!d) return null;
    return d;
  },
  categoryTransactions(cat) {
    const cd = _.category_data[cat];
    if (!cd) return [];
    return cd.transaction_ids.map(i => _.transactions[i]);
  },
  counterparties() {
    return _.counterparties;
  },
  counterpartyData(cp) {
    const d = _.counterparty_data[cp];
    if (!d) return null;
    return d;
  },
  counterpartyTransactions(cp) {
    const cd = _.counterparty_data[cp];
    if (!cd) return [];
    return cd.transaction_ids.map(i => _.transactions[i]);
  },
  allTransactions() {
    return _.transactions;
  },
  minDate() {
    return _.min_date;
  },
  maxDate() {
    return _.max_date;
  },
  totalIn() {
    return _.total_in;
  },
  totalOut() {
    return _.total_out;
  },
};
