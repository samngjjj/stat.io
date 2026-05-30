#!/usr/bin/env python3
"""
Batch-update index.html:
  - Add chart-interpretation divs to EVERY chart that is missing one
  - Rewrite the regression narrative to critically examine "十次車禍九次快"
"""

html_path = "index.html"

with open(html_path, "r", encoding="utf-8") as f:
    content = f.read()

changes = 0

# ── 1. ANOVA Post-Hoc chart ──────────────────────────────────────────
old = '''                            <div class="chart-container">
                                <canvas id="anova-chart"></canvas>
                            </div>
                        </div>
                    </div>

                    <div class="sub-card mt-2">
                        <h4 class="sub-title"><i data-lucide="compass"></i> 5.3 實務解讀</h4>'''

new = '''                            <div class="chart-container">
                                <canvas id="anova-chart"></canvas>
                            </div>
                            <div class="chart-interpretation">
                                <strong>圖表解讀：</strong>
                                <p>長條圖清晰顯示，內湖區涉案當事人的平均年齡（約 38.6 歲）明顯低於大安區（約 41.2 歲）與中山區（約 40.8 歲）。三者之間的差距雖然只有 2-3 歲，但在超過 7,500 筆觀測值的大樣本下已達統計顯著水準（F = 7.82, p = 0.0004），說明不同行政區的用路人年齡結構確實存在系統性差異。</p>
                            </div>
                        </div>
                    </div>

                    <div class="sub-card mt-2">
                        <h4 class="sub-title"><i data-lucide="compass"></i> 5.3 實務解讀</h4>'''

if old in content:
    content = content.replace(old, new)
    changes += 1
    print("[OK] ANOVA chart interpretation added")
else:
    print("[SKIP] ANOVA target not found")

# ── 2. Regression scatter chart ───────────────────────────────────────
old2 = '''                            <div class="chart-container">
                                <canvas id="regression-chart"></canvas>
                            </div>
                        </div>
                    </div>

                    <div class="sub-card mt-2 alert-card">'''

new2 = '''                            <div class="chart-container">
                                <canvas id="regression-chart"></canvas>
                            </div>
                            <div class="chart-interpretation">
                                <strong>圖表解讀：</strong>
                                <p>散佈圖中紅色擬合線展現正斜率（0.0069），代表速限每提高 10 km/h，平均受傷人數僅增加約 0.069 人。然而，散佈點高度重疊且散佈範圍極廣，視覺上幾乎看不出明確的線性趨勢，直接呼應了 R² 僅 1.2% 的極低解釋力。</p>
                            </div>
                        </div>
                    </div>

                    <div class="sub-card mt-2 alert-card">'''

if old2 in content:
    content = content.replace(old2, new2)
    changes += 1
    print("[OK] Regression chart interpretation added")
else:
    print("[SKIP] Regression chart target not found")

# ── 3. Rewrite the "omitted variables" card to critically examine "十次車禍九次快" ──
old3 = '''                    <div class="sub-card mt-2 alert-card">
                        <h5 class="alert-title"><i data-lucide="alert-triangle"></i> 寫作提示：遺漏變數之探討 (Omitted Variables)</h5>
                        <p class="text-content">
                            「相關不等於因果」。即便速限的迴歸結果顯著，但在現實中影響受傷人數的因素非常多（存在嚴重的遺漏變數 Omitted Variables），例如：當事人是否配戴安全帽/繫安全帶（保護裝置）、車種（大貨車或機車）、天候與光線等。單靠速限一個變數，無法完全精準預測受傷人數。
                        </p>'''

new3 = '''                    <div class="sub-card mt-2 alert-card">
                        <h5 class="alert-title"><i data-lucide="alert-triangle"></i> 批判性探討：「十次車禍九次快」是否為過度簡化的論述？</h5>
                        <p class="text-content">
                            交通部長期宣導的口號「十次車禍九次快」暗示車速是交通事故最主要的成因。然而，本研究的迴歸模型 R² 僅有 <strong>1.2%</strong>，這意味著「速限」這一變數只能解釋受傷人數變異中微乎其微的 1.2%，剩下 <strong>98.8% 的變異來自其他因素</strong>。
                        </p>
                        <p class="text-content">
                            雖然斜率項在統計上「顯著」（p < 0.01），但<strong>統計顯著不等於實務重要</strong>。在超過 22,000 筆的大樣本中，即使效果量（effect size）極小，也容易達到統計顯著。這恰恰說明「快」可能只是眾多肇事因素中的一小環，而非壓倒性的主因。
                        </p>
                        <p class="text-content">
                            <strong>「相關不等於因果」</strong>：速限高的路段往往也是車道更寬、車流量更大的幹道或快速道路，這些道路本身的交通密度與複雜度就更高。將事故歸因於「快」，可能忽略了真正的關鍵變數——車流量、道路設計、駕駛人注意力分散等。因此，本研究認為「十次車禍九次快」這一論述<strong>過度簡化了事故成因的複雜性</strong>，有誤導公眾之嫌。
                        </p>'''

if old3 in content:
    content = content.replace(old3, new3)
    changes += 1
    print("[OK] Omitted variables card rewritten for critical analysis")
else:
    print("[SKIP] Omitted variables target not found")

# ── 4. Gender pie chart – enrich interpretation ──────────────────────
old4 = '''                            <div class="chart-interpretation">
                                <strong>性別特徵解讀：</strong>
                                <p>透過性別變數分析，可以了解男女當事人在死傷交通事故中的比例結構，作為特定族群防禦駕駛宣導的參考。</p>
                            </div>'''

new4 = '''                            <div class="chart-interpretation">
                                <strong>數據特徵與解讀：</strong>
                                <p>男性當事人佔比高達 72.4%（約 16,318 件），女性僅佔 27.2%（約 6,184 件），男性涉案比例約為女性的 2.6 倍。這反映出男性在機車通勤、職業駕駛（計程車、外送、物流）等高道路暴露場景中的比例明顯較高，交通安全宣導應將此數據納入受眾定位的重要依據。</p>
                            </div>'''

if old4 in content:
    content = content.replace(old4, new4)
    changes += 1
    print("[OK] Gender chart interpretation enriched")
else:
    print("[SKIP] Gender chart target not found")

# ── 5. Hourly trend chart – enrich interpretation ────────────────────
old5 = '''                            <div class="chart-interpretation">
                                <strong>時間特徵解讀：</strong>
                                <p>顯現出上下班尖峰時間（7-9時、17-19時）有明顯的峰值，與通勤人車潮高度相關。</p>
                            </div>'''

new5 = '''                            <div class="chart-interpretation">
                                <strong>數據特徵與解讀：</strong>
                                <p>折線圖呈現經典的「雙峰分佈」：事故數量在早上 7-9 時（早班通勤）與下午 17-19 時（晚班尖峰）各出現一次顯著波峰，而凌晨 3-4 時則是全日最低谷。這說明臺北市的死傷交通事故頻率與都市通勤作息高度吻合——車流最飽和、時間壓力最大的時段即為碰撞事故的高危險期。</p>
                            </div>'''

if old5 in content:
    content = content.replace(old5, new5)
    changes += 1
    print("[OK] Hourly chart interpretation enriched")
else:
    print("[SKIP] Hourly chart target not found")

# ── 6. GIS Map – add spatial analysis interpretation ─────────────────
old6 = '''                        <!-- Map Element -->
                        <div id="leaflet-map" class="leaflet-map-container"></div>
                    </div>
                </section>'''

new6 = '''                        <!-- Map Element -->
                        <div id="leaflet-map" class="leaflet-map-container"></div>
                    </div>
                    
                    <div class="sub-card mt-2">
                        <h4 class="sub-title"><i data-lucide="compass"></i> 地圖空間熱點特徵解讀</h4>
                        <p class="text-content">
                            從 GIS 地圖的標記分佈可以觀察到臺北市交通事故的<strong>三大空間聚集特徵</strong>：
                        </p>
                        <ul class="normal-list">
                            <li><strong>快速道路匝道匯流處</strong>：市民大道高架、建國高架等路段的上下匝道出入口，因行車速度快且頻繁變換車道，事故密度極高。</li>
                            <li><strong>跨區聯外橋樑端點</strong>：民權大橋、麥帥橋、台北橋與百齡橋等橋樑兩端是機車通勤族的瓶頸點，尖峰時段極易發生擦撞與追撞。</li>
                            <li><strong>核心商圈主要路口</strong>：忠孝東路與復興南路口（大安區）、南京東路與松江路口（中山區）等，因行人穿越與轉彎車交織，點位分佈極為密集。</li>
                        </ul>
                    </div>
                </section>'''

if old6 in content:
    content = content.replace(old6, new6)
    changes += 1
    print("[OK] GIS map spatial analysis added")
else:
    print("[SKIP] GIS map target not found")

# ── 7. Omitted variables mini chart – add interpretation below ───────
old7 = '''                            <div class="chart-container-mini mt-1">
                                <canvas id="omitted-var-chart"></canvas>
                            </div>
                        </div>
                    </div>
                </section>'''

new7 = '''                            <div class="chart-container-mini mt-1">
                                <canvas id="omitted-var-chart"></canvas>
                            </div>
                            <div class="chart-interpretation" style="margin-top:12px;">
                                <strong>遺漏變數圖表解讀：</strong>
                                <p>上方互動圖表可切換檢視天候、光線與保護裝置三個潛在遺漏變數的分佈。可以發現：大多數事故發生在「晴天」、「日間自然光線」等看似安全的環境條件下，這進一步說明事故成因遠比「車速快」複雜得多——駕駛人的注意力、路口設計、車種差異等才是更值得探討的關鍵因素。</p>
                            </div>
                        </div>
                    </div>
                </section>'''

if old7 in content:
    content = content.replace(old7, new7)
    changes += 1
    print("[OK] Omitted variables chart interpretation added")
else:
    print("[SKIP] Omitted variables chart target not found")

# ── Write back ────────────────────────────────────────────────────────
with open(html_path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"\nDone! {changes} replacements applied to {html_path}")
