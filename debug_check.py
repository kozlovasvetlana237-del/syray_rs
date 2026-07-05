import json, re

with open('C:\\Users\\Acer\\Desktop\\Вайб кодинг\\VS\\Анализ рс\\report.html', 'r', encoding='utf-8') as f:
    content = f.read()

start = content.find('const DATA = ') + len('const DATA = ')

# Find the end - the DATA object ends before the next JS function
# We need to find the matching closing brace
depth = 0
in_string = False
escape = False
end = start

for i in range(start, len(content)):
    ch = content[i]
    if escape:
        escape = False
        continue
    if in_string:
        if ch == '\\':
            escape = True
        elif ch == '"':
            in_string = False
        continue
    if ch == '"':
        in_string = True
    elif ch == '{':
        depth += 1
    elif ch == '}':
        depth -= 1
        if depth == 0:
            end = i + 1
            break

json_str = content[start:end]
print(f"JSON starts at {start}, ends at {end}")
print(f"JSON length: {end - start}")

data = json.loads(json_str)

cat = data['categories'][0]
cd = data['category_data'][cat]
print(f"\nCategory: {cat}")
print(f"Total in: {cd['in']}, Total out: {cd['out']}")
print(f"Transactions count: {len(cd['transactions'])}")
for t in cd['transactions'][:3]:
    print(f"  amount={t['amount']} (type={type(t['amount']).__name__}), direction={t['direction']}")
    print(f"  purpose: {t['purpose'][:80]}...")

# Check for NaN or weird values
bad_count = 0
for cat_name, cd in data['category_data'].items():
    for t in cd['transactions']:
        if not isinstance(t['amount'], (int, float)):
            bad_count += 1
            if bad_count <= 5:
                print(f"BAD: cat={cat_name}, amount={t['amount']}, dir={t['direction']}")

print(f"\nTotal bad values: {bad_count}")
print(f"Total categories: {len(data['categories'])}")
print(f"Total_in: {data['total_in']}")
print(f"Total_out: {data['total_out']}")
