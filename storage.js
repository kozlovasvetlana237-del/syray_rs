const Storage = {
  accounts() {
    return DATA.accounts;
  },
  categories() {
    return DATA.categories;
  },
  categoryData(cat) {
    return DATA.category_data[cat];
  },
  counterparties() {
    return DATA.counterparties;
  },
  counterpartyData(cp) {
    return DATA.counterparty_data[cp];
  },
  minDate() {
    return DATA.min_date;
  },
  maxDate() {
    return DATA.max_date;
  },
  totalIn() {
    return DATA.total_in;
  },
  totalOut() {
    return DATA.total_out;
  },
};
