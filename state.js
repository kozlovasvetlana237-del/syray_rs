const State = {
  _activeTab: 'categories',

  get activeTab() {
    return this._activeTab;
  },
  set activeTab(val) {
    this._activeTab = val;
  },

  filters() {
    const g = id => document.getElementById(id);
    return {
      dateFrom: g('filterDateFrom').value,
      dateTo: g('filterDateTo').value,
      account: g('filterAccount').value,
      category: g('filterCategory').value,
      direction: g('filterDirection').value,
    };
  },

  cpSearchQuery() {
    const el = document.getElementById('cpSearchInput');
    return (el ? el.value : '').toLowerCase();
  },
};
