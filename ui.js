function fmt(n) {
  if (n === undefined || n === null) return '0,00';
  let parts = Math.abs(n).toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (n < 0 ? '-' : '') + parts[0] + ',' + parts[1];
}

function getAccountClass(acc) {
  if (acc.includes('15701')) return 'acc1';
  if (acc.includes('17562')) return 'acc2';
  return '';
}

function getCounterparty(t) {
  return t.direction === 'Входящий' ? (t.payer || '') : (t.receiver || '');
}

function toggleCategory(header) {
  const arrow = header.querySelector('.arrow');
  const tx = header.nextElementSibling;
  tx.classList.toggle('open');
  arrow.classList.toggle('open');
}

function updateStats(dateFrom, dateTo, account, direction) {
  let totalIn = 0, totalOut = 0;
  for (const cat of Storage.categories()) {
    const cd = Storage.categoryData(cat);
    if (!cd) continue;
    for (const t of cd.transactions) {
      if (dateFrom && t.date < dateFrom) continue;
      if (dateTo && t.date > dateTo) continue;
      if (account && t.account !== account) continue;
      if (direction && t.direction !== direction) continue;
      if (t.direction === 'Входящий') totalIn += t.amount;
      else totalOut += t.amount;
    }
  }
  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card"><div class="label">Всего поступлений</div><div class="value green">+${fmt(totalIn)}</div></div>
    <div class="stat-card"><div class="label">Всего списаний</div><div class="value red">−${fmt(totalOut)}</div></div>
    <div class="stat-card"><div class="label">Оборот</div><div class="value blue">${fmt(totalIn + totalOut)}</div></div>
    <div class="stat-card"><div class="label">Сальдо</div><div class="value ${totalIn - totalOut >= 0 ? 'green' : 'red'}">${fmt(totalIn - totalOut)}</div></div>
  `;
}

function applyFilters() {
  const f = State.filters();
  const container = document.getElementById('categoriesContainer');
  container.innerHTML = '';
  let globalTotalIn = 0, globalTotalOut = 0;
  const summaryDiv = document.getElementById('categorySummary');

  let filteredCategories = Storage.categories();
  if (f.category) filteredCategories = [f.category];

  for (const cat of filteredCategories) {
    const cd = Storage.categoryData(cat);
    if (!cd) continue;

    let txs = cd.transactions.filter(t => {
      if (f.dateFrom && t.date < f.dateFrom) return false;
      if (f.dateTo && t.date > f.dateTo) return false;
      if (f.account && t.account !== f.account) return false;
      if (f.direction && t.direction !== f.direction) return false;
      return true;
    });

    if (txs.length === 0) continue;

    const totalIn = txs.filter(t => t.direction === 'Входящий').reduce((s, t) => s + t.amount, 0);
    const totalOut = txs.filter(t => t.direction === 'Исходящий').reduce((s, t) => s + t.amount, 0);
    const countIn = txs.filter(t => t.direction === 'Входящий').length;
    const countOut = txs.filter(t => t.direction === 'Исходящий').length;
    globalTotalIn += totalIn;
    globalTotalOut += totalOut;

    const maxAmount = Math.max(totalIn, totalOut, 1);
    const barInPct = (totalIn / maxAmount * 100).toFixed(1);
    const barOutPct = (totalOut / maxAmount * 100).toFixed(1);

    const card = document.createElement('div');
    card.className = 'category-card';

    card.innerHTML = `
      <div class="category-header" onclick="toggleCategory(this)">
        <span class="arrow">▶</span>
        <span class="category-name">${cat} <span class="category-count">(${txs.length} операций)</span></span>
        <div class="category-stats">
          <div class="category-stat">
            <div style="color:#10b981">+${fmt(totalIn)}</div>
            <div class="count">${countIn} поступл.</div>
          </div>
          <div class="category-stat">
            <div style="color:#ef4444">−${fmt(totalOut)}</div>
            <div class="count">${countOut} списаний</div>
          </div>
        </div>
        <div class="category-bar">
          <div class="category-bar-fill" style="width:${barInPct}%;background:#10b981"></div>
        </div>
        <div class="category-bar">
          <div class="category-bar-fill" style="width:${barOutPct}%;background:#ef4444"></div>
        </div>
      </div>
      <div class="transactions">
        <table class="transaction-table">
          <thead><tr>
            <th>Дата</th>
            <th>Счет</th>
            <th>Направление</th>
            <th>Сумма</th>
            <th>Назначение платежа</th>
            <th>Контрагент</th>
          </tr></thead>
          <tbody>
          ${txs.map(t => `
            <tr>
              <td>${t.date}</td>
              <td><span class="account-badge ${getAccountClass(t.account)}">${t.account.slice(-5)}</span></td>
              <td>${t.direction === 'Входящий' ? '⬇ Поступление' : '⬆ Списание'}</td>
              <td class="amount-cell ${t.direction === 'Входящий' ? 'amount-in' : 'amount-out'}">${t.direction === 'Входящий' ? '+' : '−'}${fmt(t.amount)}</td>
              <td class="purpose-cell" title="${t.purpose.replace(/""/g, '"').replace(/"/g, '&quot;')}">${t.purpose.length > 120 ? t.purpose.slice(0, 120) + '...' : t.purpose}</td>
              <td>${t.direction === 'Входящий' ? (t.payer || '') : (t.receiver || '')}</td>
            </tr>
          `).join('')}
          </tbody>
        </table>
      </div>
    `;
    container.appendChild(card);
  }

  if (container.children.length === 0) {
    container.innerHTML = '<div class="no-data">Нет операций, соответствующих фильтрам</div>';
    summaryDiv.style.display = 'none';
  } else {
    summaryDiv.style.display = 'flex';
    summaryDiv.innerHTML = `
      <span>Поступления: <strong style="color:#10b981">+${fmt(globalTotalIn)}</strong></span>
      <span>Списания: <strong style="color:#ef4444">−${fmt(globalTotalOut)}</strong></span>
      <span>Оборот: <strong>${fmt(globalTotalIn + globalTotalOut)}</strong></span>
      <span>Сальдо: <strong style="color:${globalTotalIn - globalTotalOut >= 0 ? '#10b981' : '#ef4444'}">${fmt(globalTotalIn - globalTotalOut)}</strong></span>
    `;
  }

  updateStats(f.dateFrom, f.dateTo, f.account, f.direction);
}

function renderCounterparties() {
  const f = State.filters();
  const searchQuery = State.cpSearchQuery();

  const container = document.getElementById('counterpartiesContainer');
  container.innerHTML = '';

  const searchBar = document.createElement('div');
  searchBar.className = 'cp-search';
  searchBar.innerHTML = '<input type="text" id="cpSearchInput" placeholder="Поиск контрагента..." oninput="renderCounterparties()" value="' + searchQuery.replace(/"/g, '&quot;') + '">';
  container.appendChild(searchBar);

  let globalTotalIn = 0, globalTotalOut = 0;
  const MAX_CP = searchQuery ? Infinity : 100;
  let shownCount = 0;
  let hasMore = false;

  for (const cp of Storage.counterparties()) {
    if (shownCount >= MAX_CP) { hasMore = true; break; }
    const cd = Storage.counterpartyData(cp);
    if (!cd) continue;

    let txs = cd.transactions.filter(t => {
      if (f.dateFrom && t.date < f.dateFrom) return false;
      if (f.dateTo && t.date > f.dateTo) return false;
      if (f.account && t.account !== f.account) return false;
      if (f.direction && t.direction !== f.direction) return false;
      return true;
    });

    if (txs.length === 0) continue;

    if (searchQuery && !cp.toLowerCase().includes(searchQuery)) continue;

    const totalIn = txs.filter(t => t.direction === 'Входящий').reduce((s, t) => s + t.amount, 0);
    const totalOut = txs.filter(t => t.direction === 'Исходящий').reduce((s, t) => s + t.amount, 0);
    const countIn = txs.filter(t => t.direction === 'Входящий').length;
    const countOut = txs.filter(t => t.direction === 'Исходящий').length;
    globalTotalIn += totalIn;
    globalTotalOut += totalOut;

    const maxAmount = Math.max(totalIn, totalOut, 1);
    const barInPct = (totalIn / maxAmount * 100).toFixed(1);
    const barOutPct = (totalOut / maxAmount * 100).toFixed(1);

    const card = document.createElement('div');
    card.className = 'category-card';

    card.innerHTML = `
      <div class="counterparty-header" onclick="toggleCategory(this)">
        <span class="arrow">▶</span>
        <span class="counterparty-name">${cp}</span>
        <div class="category-stats">
          <div class="category-stat">
            <div style="color:#10b981">+${fmt(totalIn)}</div>
            <div class="count">${countIn} поступл.</div>
          </div>
          <div class="category-stat">
            <div style="color:#ef4444">−${fmt(totalOut)}</div>
            <div class="count">${countOut} списаний</div>
          </div>
        </div>
        <div class="category-bar">
          <div class="category-bar-fill" style="width:${barInPct}%;background:#10b981"></div>
        </div>
        <div class="category-bar">
          <div class="category-bar-fill" style="width:${barOutPct}%;background:#ef4444"></div>
        </div>
      </div>
      <div class="transactions">
        <table class="transaction-table">
          <thead><tr>
            <th>Дата</th>
            <th>Счет</th>
            <th>Направление</th>
            <th>Сумма</th>
            <th>Назначение платежа</th>
          </tr></thead>
          <tbody>
          ${txs.map(t => `
            <tr>
              <td>${t.date}</td>
              <td><span class="account-badge ${getAccountClass(t.account)}">${t.account.slice(-5)}</span></td>
              <td>${t.direction === 'Входящий' ? '⬇ Поступление' : '⬆ Списание'}</td>
              <td class="amount-cell ${t.direction === 'Входящий' ? 'amount-in' : 'amount-out'}">${t.direction === 'Входящий' ? '+' : '−'}${fmt(t.amount)}</td>
              <td class="purpose-cell" title="${t.purpose.replace(/""/g, '"').replace(/"/g, '&quot;')}">${t.purpose.length > 120 ? t.purpose.slice(0, 120) + '...' : t.purpose}</td>
            </tr>
          `).join('')}
          </tbody>
        </table>
      </div>
    `;
    container.appendChild(card);
    shownCount++;
  }

  if (hasMore) {
    const more = document.createElement('div');
    more.style.textAlign = 'center';
    more.style.padding = '16px';
    more.style.color = '#888';
    more.style.fontSize = '13px';
    more.textContent = 'Показаны первые 100 контрагентов. Используйте поиск для фильтрации.';
    container.appendChild(more);
  }

  const noData = document.getElementById('cpNoData') || document.createElement('div');
  noData.id = 'cpNoData';
  noData.className = 'no-data';
  if (container.children.length <= 1) {
    noData.textContent = 'Нет операций, соответствующих фильтрам';
    container.appendChild(noData);
  }

  updateStats(f.dateFrom, f.dateTo, f.account, f.direction);
}
