function switchTab(tab) {
  State.activeTab = tab;
  document.getElementById('tabCategories').className = 'tab-btn' + (tab === 'categories' ? ' tab-active' : '');
  document.getElementById('tabCounterparties').className = 'tab-btn' + (tab === 'counterparties' ? ' tab-active' : '');
  document.getElementById('categoriesContainer').style.display = tab === 'categories' ? 'flex' : 'none';
  document.getElementById('counterpartiesContainer').style.display = tab === 'counterparties' ? 'flex' : 'none';
  document.getElementById('categorySummary').style.display = tab === 'categories' ? 'flex' : 'none';

  if (tab === 'categories') {
    applyFilters();
  } else {
    renderCounterparties();
  }
}

function resetFilters() {
  if (Storage.minDate()) document.getElementById('filterDateFrom').value = Storage.minDate();
  if (Storage.maxDate()) document.getElementById('filterDateTo').value = Storage.maxDate();
  document.getElementById('filterAccount').value = '';
  document.getElementById('filterCategory').value = '';
  document.getElementById('filterDirection').value = '';
  if (State.activeTab === 'categories') {
    applyFilters();
  } else {
    renderCounterparties();
  }
}

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('rangeLabel').textContent = Storage.minDate() + ' — ' + Storage.maxDate();

  // Init filters
  const accSel = document.getElementById('filterAccount');
  const catSel = document.getElementById('filterCategory');
  for (const [k, v] of Object.entries(Storage.accounts())) {
    if (v.count === 0) continue;
    const o = document.createElement('option');
    o.value = k; o.textContent = k + ' — ' + v.name;
    accSel.appendChild(o);
  }
  for (const c of Storage.categories()) {
    const o = document.createElement('option');
    o.value = c; o.textContent = c;
    catSel.appendChild(o);
  }
  if (Storage.minDate()) document.getElementById('filterDateFrom').value = Storage.minDate();
  if (Storage.maxDate()) document.getElementById('filterDateTo').value = Storage.maxDate();

  // Event listeners
  document.getElementById('tabCategories').addEventListener('click', function () { switchTab('categories'); });
  document.getElementById('tabCounterparties').addEventListener('click', function () { switchTab('counterparties'); });
  document.getElementById('applyBtn').addEventListener('click', function () {
    if (State.activeTab === 'categories') {
      applyFilters();
    } else {
      renderCounterparties();
    }
  });
  document.getElementById('resetBtn').addEventListener('click', resetFilters);

  // Initial render
  applyFilters();
});
