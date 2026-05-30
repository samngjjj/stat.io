#!/usr/bin/env python3
"""Decode the escaped index.html back to proper HTML."""
import codecs

with open("index.html", "r", encoding="utf-8") as f:
    raw = f.read()

print(f"Raw length: {len(raw)}")
print(f"Starts with quote: {raw[0] == chr(34)}")
print(f"Ends with quote: {raw[-1] == chr(34)}")

# Strip surrounding quotes
if raw.startswith('"') and raw.endswith('"'):
    raw = raw[1:-1]
elif raw.startswith('"'):
    raw = raw[1:]

# Decode the \\n, \\", etc.
decoded = codecs.decode(raw, "unicode_escape")

# The Chinese characters were UTF-8 bytes that got decoded as Latin-1
# Re-encode as Latin-1, then decode as UTF-8
try:
    fixed = decoded.encode("latin-1").decode("utf-8")
    print(f"Fixed encoding OK, length: {len(fixed)}")
except Exception as e:
    print(f"Latin-1 roundtrip failed: {e}")
    fixed = decoded

# Count actual newlines
lines = fixed.split("\n")
print(f"Line count: {len(lines)}")
print(f"First 300 chars:\n{fixed[:300]}")

with open("index.html", "w", encoding="utf-8") as f:
    f.write(fixed)

print("\nSaved decoded HTML back to index.html")
