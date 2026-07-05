#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import csv
import json
import os
import re
from collections import defaultdict
from datetime import datetime

DATA_DIR = r"C:\Users\Acer\Desktop\Вайб кодинг\VS\Анализ рс"

ACCOUNTS = {
    "40702810620000115701": "Махачкала-1 (основной операционный)",
    "40702810320000117562": "Махачкала-3 (строительство/оборудование)",
    "40702810220000130458": "Счет без движения",
}

def safe_float(val):
    if not val:
        return 0.0
    val = str(val).strip().replace(" ", "").replace(",", ".").replace("\xa0", "")
    if not val:
        return 0.0
    try:
        return float(val)
    except:
        return 0.0

def parse_date(val):
    if not val:
        return None
    val = val.strip()
    for fmt in ("%d.%m.%Y", "%d.%m.%y"):
        try:
            return datetime.strptime(val, fmt)
        except:
            pass
    return None

def categorize(row):
    purpose = (row.get("Назначение платежа", "") or "").lower()
    payer = (row.get("Наименование плательщика", "") or "").lower()
    receiver = (row.get("Наименование получателя", "") or "").lower()
    direction = row.get("Направление", "")
    amount = safe_float(row.get("Сумма операции в рублях", "0"))

    # Incoming
    if direction == "Входящий":
        if "выдача займа" in purpose or "процентного займа" in purpose or "договор процентного" in purpose:
            return "Займы полученные"
        if "эквайринг" in purpose and "сбербанк" in purpose:
            return "Эквайринг (банковские карты)"
        if "эквайринг" in purpose:
            return "Эквайринг (банковские карты)"
        if "нко юмани" in payer or "юмани" in payer or "додо пицца" in purpose and "реестр" in purpose:
            return "Онлайн-заказы (ЮMoney)"
        if "инкасс" in purpose and "наличность" in purpose:
            return "Инкассация (наличные)"
        if "возврат" in purpose:
            return "Возвраты"
        if "перевод средств между счетами" in purpose:
            return "Переводы между счетами"
        if "зачисление средств по операциям" in purpose:
            return "Эквайринг (банковские карты)"
        return "Прочие поступления"

    # Outgoing
    if direction == "Исходящий":
        if "перевод средств между счетами" in purpose:
            return "Переводы между счетами"
        if "заработная плата" in purpose or "заработной плате" in purpose or "отпускные" in purpose:
            return "Заработная плата"
        if "ист-вест" in receiver or "ист-вест логистикс" in receiver:
            return "Закупка продуктов"
        if "голдпродукт" in receiver:
            return "Закупка продуктов"
        if "метро кэш" in receiver or "metro" in receiver:
            return "Закупка продуктов"
        if "джи эф дагестан" in receiver:
            return "Закупка продуктов"
        if "эквайринг" in purpose and "комиссия" in purpose:
            return "Услуги банков (эквайринг)"
        if "аренд" in purpose:
            return "Аренда помещений"
        if "стройэксперт" in receiver or "договору подряда" in purpose or "договору продряда" in purpose:
            return "Строительно-монтажные работы"
        if "стройматериал" in purpose or "стройматериалы" in purpose:
            return "Стройматериалы и оборудование"
        if "оборудование" in purpose or "оборудован" in purpose:
            return "Стройматериалы и оборудование"
        if "сплит-систем" in purpose or "печь" in purpose or "мебель" in purpose:
            return "Стройматериалы и оборудование"
        if "инвентарь" in purpose:
            return "Инвентарь и оснащение"
        if "транспортно-экспедиционные" in purpose or "транспортные услуги" in purpose:
            return "Транспортные услуги"
        if "покупка товара" in purpose and "терминал" in purpose:
            return "Хоз. расходы (покупки по карте)"
        if "рекламн" in purpose:
            return "Реклама и маркетинг"
        if "интернет" in purpose or "сабнет" in receiver or "ростелеком" in receiver:
            return "Интернет и связь"
        if "охрана" in purpose or "чоо" in receiver:
            return "Охрана"
        if "мед. осмотр" in purpose or "медицин" in purpose:
            return "Медицинские услуги"
        if "налог" in purpose or "кбк" in purpose or "страхов" in purpose or "сфр" in purpose:
            return "Налоги и сборы"
        if "услуги по проектированию" in purpose:
            return "Проектные услуги"
        if "монтаж" in purpose:
            return "Строительно-монтажные работы"
        if "видеонаблюдение" in purpose:
            return "Оборудование безопасности"
        if "коммунальн" in purpose:
            return "Коммунальные услуги"
        if "инкассаци" in purpose:
            return "Услуги инкассации"
        if "перевозок" in purpose or "пассажирских" in purpose:
            return "Транспортные услуги"
        if "бронирован" in purpose or "смартвэй" in receiver:
            return "Командировки и бронирование"
        if "консоль" in purpose or "консоль.про" in receiver:
            return "ПО и цифровые услуги"
        if "проектированию" in purpose:
            return "Проектные услуги"
        if "додо франчайзинг" in receiver:
            return "Франчайзинговые услуги"
        # General services
        if "услуги" in purpose and "ремонт" in purpose:
            return "Ремонт и обслуживание"
        if "электромонтаж" in purpose:
            return "Строительно-монтажные работы"
        if "сейф" in purpose:
            return "Инвентарь и оснащение"
        return "Прочие расходы"

    return "Неопределено"

def process_csv(filepath, account_num):
    rows = []
    try:
        with open(filepath, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f, delimiter=";")
            for row in reader:
                if not row.get("Направление", "").strip():
                    continue
                purpose = row.get("Назначение платежа", "")
                date_str = row.get("Дата проводки", "")
                d = parse_date(date_str)
                row["_date"] = d.strftime("%Y-%m-%d") if d else ""
                row["_year"] = d.year if d else 0
                row["_month"] = d.month if d else 0
                row["_amount_num"] = safe_float(row.get("Сумма операции в рублях", "0"))
                row["_category"] = categorize(row)
                row["_account"] = account_num
                row["_account_name"] = ACCOUNTS.get(account_num, account_num)
                row["_direction"] = row.get("Направление", "")
                rows.append(row)
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
    return rows

def main():
    all_rows = []
    for fname in sorted(os.listdir(DATA_DIR)):
        if fname.endswith(".csv"):
            # Extract account number from filename
            parts = fname.split(" ")
            account_num = parts[0] if parts else ""
            fpath = os.path.join(DATA_DIR, fname)
            rows = process_csv(fpath, account_num)
            print(f"{fname}: {len(rows)} rows")
            all_rows.extend(rows)

    print(f"Total rows: {len(all_rows)}")

    # Build flat transaction list (single source of truth)
    transactions_list = []

    for r in all_rows:
        amount = r["_amount_num"]
        cp_name = (r.get("Наименование плательщика", "") or "").strip() if r["_direction"] == "Входящий" else (r.get("Наименование получателя", "") or "").strip()
        transactions_list.append({
            "date": r["_date"],
            "doc_num": r.get("Номер документа", ""),
            "direction": r["_direction"],
            "amount": amount,
            "purpose": r.get("Назначение платежа", ""),
            "payer": r.get("Наименование плательщика", ""),
            "receiver": r.get("Наименование получателя", ""),
            "account": r["_account"],
            "account_name": r["_account_name"],
            "year": r["_year"],
            "month": r["_month"],
            "category": r["_category"],
            "counterparty": cp_name,
        })

    # Category aggregation (store indices into transactions_list)
    categories = defaultdict(lambda: {"in": 0, "out": 0, "count_in": 0, "count_out": 0, "transaction_ids": []})

    for i, tx in enumerate(transactions_list):
        cat = tx["category"]
        amt = tx["amount"]
        if tx["direction"] == "Входящий":
            categories[cat]["in"] += amt
            categories[cat]["count_in"] += 1
        else:
            categories[cat]["out"] += amt
            categories[cat]["count_out"] += 1
        categories[cat]["transaction_ids"].append(i)

    sorted_cats = sorted(categories.keys(), key=lambda c: max(categories[c]["in"], categories[c]["out"]), reverse=True)

    # Counterparty aggregation (store indices into transactions_list)
    counterparty_data = defaultdict(lambda: {"in": 0, "out": 0, "count_in": 0, "count_out": 0, "transaction_ids": []})

    for i, tx in enumerate(transactions_list):
        cp = tx["counterparty"]
        if not cp:
            continue
        amt = tx["amount"]
        if tx["direction"] == "Входящий":
            counterparty_data[cp]["in"] += amt
            counterparty_data[cp]["count_in"] += 1
        else:
            counterparty_data[cp]["out"] += amt
            counterparty_data[cp]["count_out"] += 1
        counterparty_data[cp]["transaction_ids"].append(i)

    sorted_cps = sorted(counterparty_data.keys(), key=lambda c: max(counterparty_data[c]["in"], counterparty_data[c]["out"]), reverse=True)

    # Compute totals
    total_in = sum(tx["amount"] for tx in transactions_list if tx["direction"] == "Входящий")
    total_out = sum(tx["amount"] for tx in transactions_list if tx["direction"] == "Исходящий")
    total_all = total_in + total_out

    # Account stats
    account_stats = defaultdict(lambda: {"in": 0, "out": 0, "count": 0})
    for tx in transactions_list:
        acc = tx["account"]
        if tx["direction"] == "Входящий":
            account_stats[acc]["in"] += tx["amount"]
        else:
            account_stats[acc]["out"] += tx["amount"]
        account_stats[acc]["count"] += 1

    # Date range
    dates = [tx["date"] for tx in transactions_list if tx["date"]]
    min_date = min(dates) if dates else ""
    max_date = max(dates) if dates else ""

    # Build JSON data
    json_data = {
        "min_date": min_date,
        "max_date": max_date,
        "total_in": round(total_in, 2),
        "total_out": round(total_out, 2),
        "total_all": round(total_all, 2),
        "accounts": {k: {"name": ACCOUNTS.get(k, k), "in": round(v["in"], 2), "out": round(v["out"], 2), "count": v["count"]} for k, v in account_stats.items()},
        "categories": sorted_cats,
        "category_data": {cat: {"in": round(categories[cat]["in"], 2), "out": round(categories[cat]["out"], 2), "count_in": categories[cat]["count_in"], "count_out": categories[cat]["count_out"], "transaction_ids": categories[cat]["transaction_ids"]} for cat in sorted_cats},
        "counterparties": sorted_cps,
        "counterparty_data": {cp: {"in": round(counterparty_data[cp]["in"], 2), "out": round(counterparty_data[cp]["out"], 2), "count_in": counterparty_data[cp]["count_in"], "count_out": counterparty_data[cp]["count_out"], "transaction_ids": counterparty_data[cp]["transaction_ids"]} for cp in sorted_cps},
        "transactions": transactions_list,
    }

    json_str = json.dumps(json_data, ensure_ascii=False, indent=1)

    # Generate index.html
    html = f"""<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Анализ расчетных счетов — ООО Сурайя Пицца</title>
<link rel="stylesheet" href="styles.css">
</head>
<body>

<div class="header">
  <h1>Анализ расчетных счетов</h1>
  <p>ООО «Сурайя Пицца» (Додо Пицца, Махачкала) · <span id="rangeLabel"></span></p>
</div>

<div class="stats-grid" id="statsGrid"></div>

<div class="filters">
  <div class="filter-group">
    <label>Период от</label>
    <input type="date" id="filterDateFrom">
  </div>
  <div class="filter-group">
    <label>Период до</label>
    <input type="date" id="filterDateTo">
  </div>
  <div class="filter-group">
    <label>Расчетный счет</label>
    <select id="filterAccount"><option value="">Все счета</option></select>
  </div>
  <div class="filter-group">
    <label>Статья</label>
    <select id="filterCategory"><option value="">Все статьи</option></select>
  </div>
  <div class="filter-group">
    <label>Тип операции</label>
    <select id="filterDirection">
      <option value="">Все операции</option>
      <option value="Входящий">Поступления</option>
      <option value="Исходящий">Списания</option>
    </select>
  </div>
  <button class="btn btn-primary" id="applyBtn">Применить</button>
  <button class="btn btn-outline" id="resetBtn">Сброс</button>
</div>

<div class="tabs">
  <button class="tab-btn tab-active" id="tabCategories">По статьям</button>
  <button class="tab-btn" id="tabCounterparties">По контрагентам</button>
</div>

<div id="categorySummary" class="summary-row" style="display:none;"></div>
<div id="categoriesContainer" class="categories"></div>
<div id="counterpartiesContainer" class="categories" style="display:none;"></div>

<script>
var DATA = {json_str};
</script>
<script src="js/storage.js"></script>
<script src="js/state.js"></script>
<script src="js/ui.js"></script>
<script src="js/app.js"></script>
</body>
</html>"""

    outpath = os.path.join(DATA_DIR, "index.html")
    with open(outpath, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"\nReport saved: {outpath}")
    print(f"Total transactions: {len(all_rows)}")
    print(f"Categories: {len(sorted_cats)}")

if __name__ == "__main__":
    main()
