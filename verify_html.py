#!/usr/bin/env python3
"""Verify all required DOM elements exist in index.html."""

with open("index.html", "r", encoding="utf-8") as f:
    c = f.read()

required_ids = [
    'data-mode-toggle', 'theme-toggle', 'theme-icon', 'print-btn',
    'input-group-name', 'input-student-id', 'input-student-name',
    'print-group-name', 'print-student-id', 'print-student-name',
    'drop-zone', 'file-input', 'browse-btn', 'loading-spinner', 'loading-text',
    'status-dot',
    'raw-count-val', 'cleaned-count-val', 'cleaned-ratio-val',
    'age-mean', 'age-median', 'age-std', 'age-min', 'age-max',
    'inj-mean', 'inj-median', 'inj-std', 'inj-min', 'inj-max',
    'speed-mean', 'speed-median', 'speed-std', 'speed-min', 'speed-max',
    'age-histogram', 'district-bar-chart', 'gender-pie-chart', 'hourly-line-chart',
    'anova-f-val', 'anova-p-val', 'anova-sig-badge', 'anova-chart',
    'scatter-limit-select', 'regression-chart', 'omitted-var-chart',
    'leaflet-map', 'map-district-filter', 'map-limit', 'map-points-count',
    'table-search-input', 'table-district-filter', 'table-gender-filter',
    'table-body', 'prev-page-btn', 'next-page-btn', 'pagination-info'
]

missing = [id for id in required_ids if f'id="{id}"' not in c]
print(f"Total required IDs: {len(required_ids)}")
print(f"Missing IDs: {len(missing)}")
if missing:
    for m in missing:
        print(f"  MISSING: {m}")
else:
    print("All IDs found!")

# Check sections
sections = ['section-intro', 'section-upload', 'section-preprocessing',
            'section-descriptive', 'section-anova', 'section-regression',
            'section-gis', 'section-explorer']
missing_sections = [s for s in sections if f'id="{s}"' not in c]
print(f"\nSections: {len(sections) - len(missing_sections)}/{len(sections)} found")
if missing_sections:
    for m in missing_sections:
        print(f"  MISSING section: {m}")

# Count chart-interpretation divs
interp_count = c.count('chart-interpretation')
print(f"\nChart interpretation divs: {interp_count}")

# Check critical text
checks = [
    ("十次車禍九次快", "Critical discussion"),
    ("過度簡化", "Oversimplification argument"),
    ("98.8%", "98.8% other factors"),
    ("統計顯著不等於實務重要", "Statistical vs practical significance"),
]

for pattern, name in checks:
    found = pattern in c
    status = "OK" if found else "MISSING"
    print(f"  {status}: {name}")
