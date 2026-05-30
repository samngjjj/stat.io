import pandas as pd

try:
    df = pd.read_csv("114年-臺北市死傷交通事故明細.csv", encoding="utf-8-sig")
    total = len(df)
    valid_coords = df[(df['座標-X'].notna()) & (df['座標-X'] != 0) & (df['座標-Y'].notna()) & (df['座標-Y'] != 0)]
    print(f"Total rows: {total}")
    print(f"Rows with valid coords: {len(valid_coords)}")
    print(f"Percentage of rows with coords: {len(valid_coords)/total*100:.2f}%")
except Exception as e:
    print("Error:", e)
