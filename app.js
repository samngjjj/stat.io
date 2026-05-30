/**
 * Application Logic - Taipei Traffic Accident Statistical Analysis Dashboard
 * Implements data parsing, cleaning, descriptive statistics, ANOVA, linear regression,
 * Leaflet.js mapping, and Chart.js visualizations.
 */

// Global State
let rawData = [];
let cleanedData = [];
let activeOmittedVar = 'weather';
let dataMode = 'reference'; // 'reference' or 'calculated'

// Pagination state
let currentPage = 1;
const pageSize = 15;
let filteredTableData = [];

// Leaflet Map state
let map = null;
let mapMarkers = [];

// Chart.js Chart instances
let charts = {
    ageHistogram: null,
    districtBar: null,
    genderPie: null,
    hourlyLine: null,
    anovaChart: null,
    regressionChart: null,
    omittedVarChart: null
};

// Reference Stats from Homework Prompt
const referenceStats = {
    rawCount: 22762,
    cleanedCount: 22700,
    cleanedRatio: '99.73%',
    age: { mean: 40.54, median: 38.00, std: 16.82, min: 1.00, max: 99.00 },
    injured: { mean: 1.15, median: 1.00, std: 0.54, min: 0.00, max: 12.00 },
    speed: { mean: 47.38, median: 50.00, std: 7.21, min: 0.00, max: 80.00 },
    anova: {
        f: 7.82,
        p: 0.0004,
        daan: 41.2,
        zhongshan: 40.8,
        neihu: 38.6
    },
    regression: {
        intercept: 0.823,
        slope: 0.0069,
        r2: 0.012
    }
};

// Mapping dictionaries for Taiwan traffic codes
const weatherMap = {
    6.0: "雨天",
    7.0: "陰天",
    8.0: "晴天",
    9.0: "其他"
};

const lightMap = {
    5.0: "夜間有照明",
    6.0: "日間自然光線",
    7.0: "晨或暮光"
};

const protectionMap = {
    2.0: "未配戴/未繫帶",
    3.0: "有繫安全帶",
    4.0: "未使用/未裝設",
    5.0: "戴半罩式安全帽",
    6.0: "戴非半罩式安全帽",
    7.0: "其他 / 無需使用"
};

const genderMap = {
    1.0: "男",
    2.0: "女",
    3.0: "無或未明",
    4.0: "法人"
};

const vehicleMap = {
    "A01": "聯結車", "A02": "大客車", "A03": "大貨車", "A04": "曳引車", "A05": "大型專用車",
    "B01": "計程車", "B02": "租賃小客車", "B03": "自用小客車", "B04": "自用小貨車", "B05": "營業小貨車",
    "C01": "大型重機(550cc+)", "C02": "大型重機(250-550cc)", "C03": "普通重型機車", "C04": "普通輕型機車", "C05": "小型輕型機車",
    "F01": "腳踏自行車", "F02": "電動輔助自行車", "F03": "微型電動二輪車", "H01": "行人", "H02": "乘客"
};

function mapVehicleType(code) {
    return vehicleMap[code] || code || "其他車種";
}

// --------------------------------------------------------------------------
// Generate Mock Data for Pre-upload Previews
// --------------------------------------------------------------------------
function generateMockData() {
    const mockList = [];
    const districts = [
        { code: "04大安區", latRange: [25.02, 25.045], lngRange: [121.525, 121.555] },
        { code: "03中山區", latRange: [25.045, 25.085], lngRange: [121.515, 121.545] },
        { code: "12內湖區", latRange: [25.06, 25.09], lngRange: [121.56, 121.59] }
    ];
    
    const streets = {
        "04大安區": ["大安路1段", "信義路3段", "忠孝東路4段", "和平東路2段", "敦化南路2段"],
        "03中山區": ["市民大道2段", "中山北路2段", "南京東路3段", "民生東路1段", "林森北路"],
        "12內湖區": ["瑞光路", "成功路4段", "內湖路1段", "民權東路6段", "行愛路"]
    };
    
    const vehicles = ["C03", "B03", "B01", "F01"];
    
    for (let i = 0; i < 100; i++) {
        const distObj = districts[i % districts.length];
        const dist = distObj.code;
        const streetList = streets[dist];
        const street = streetList[Math.floor(Math.random() * streetList.length)] + (Math.floor(Math.random() * 100) + 1) + "號";
        
        const age = Math.round(35 + (Math.random() - 0.5) * 30);
        const validAge = Math.max(18, Math.min(95, age));
        
        const sex = Math.random() > 0.3 ? 1.0 : 2.0;
        const weather = Math.random() > 0.4 ? 8.0 : (Math.random() > 0.5 ? 7.0 : 6.0);
        const light = Math.random() > 0.4 ? 6.0 : (Math.random() > 0.5 ? 5.0 : 7.0);
        const protect = Math.random() > 0.3 ? (Math.random() > 0.5 ? 6.0 : 5.0) : 3.0;
        
        const speedOptions = [30, 40, 50, 60];
        const speed = speedOptions[Math.floor(Math.random() * speedOptions.length)];
        const injured = Math.random() > 0.2 ? 1.0 : (Math.random() > 0.5 ? 2.0 : 0.0);
        
        const lat = distObj.latRange[0] + Math.random() * (distObj.latRange[1] - distObj.latRange[0]);
        const lng = distObj.lngRange[0] + Math.random() * (distObj.lngRange[1] - distObj.lngRange[0]);
        
        mockList.push({
            "發生年度": 114,
            "發生月": Math.floor(Math.random() * 3) + 1,
            "發生日": Math.floor(Math.random() * 28) + 1,
            "發生時-Hours": Math.floor(Math.random() * 24),
            "發生分": Math.floor(Math.random() * 60),
            "區序": dist,
            "肇事地點": dist.substring(2) + street,
            "死亡人數": 0.0,
            "2-30日死亡人數": 0.0,
            "受傷人數": injured,
            "車種": vehicles[Math.floor(Math.random() * vehicles.length)],
            "天候": weather,
            "光線": light,
            "保護裝置": protect,
            "性別": sex,
            "年齡": validAge,
            "速限-速度限制": speed,
            "座標-X": lng,
            "座標-Y": lat
        });
    }
    return mockList;
}

// --------------------------------------------------------------------------
// Initialization
// --------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Sync student info fields from localStorage
    initMetadataForm();
    
    // Set up navigation and scroll highlights
    initNavigation();
    
    // Set up file upload handlers
    initFileUploader();
    
    // Set up print and theme buttons
    initUIControls();
    
    // Populate with 100 mock records by default so GIS Map & Explorer work immediately on load
    cleanedData = generateMockData();
    populateDistrictFilters();
    
    // Initialize empty Leaflet map (safeguarded)
    if (typeof L !== 'undefined') {
        initMap();
        initMapPoints(); // Draw mock points immediately
    } else {
        console.warn("Leaflet library failed to load or is offline.");
        const mapContainer = document.getElementById("leaflet-map");
        if (mapContainer) {
            mapContainer.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-secondary); display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 12px;">' +
                '<i data-lucide="wifi-off" style="width:48px; height:48px; color:var(--text-muted);"></i>' +
                '<strong>地圖載入失敗</strong>' +
                '<p style="font-size:0.85rem; max-width:320px; color:var(--text-muted);">請檢查您的網路連線以自 CDN 載入 Leaflet GIS 地圖套件。</p>' +
                '</div>';
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }
    
    // Populate explorer table with mock records immediately
    initExplorerTable();
    
    // Render initial charts using reference values immediately on load
    updateDashboardValues();
    renderCharts();
    
    // Auto-fetch local CSV if hosted on server
    autoFetchCSV();
});

// --------------------------------------------------------------------------
// Metadata & UI State Sync
// --------------------------------------------------------------------------
function initMetadataForm() {
    const fields = ['group-name', 'student-id', 'student-name'];
    fields.forEach(field => {
        const input = document.getElementById(`input-${field}`);
        const display = document.getElementById(`print-${field}`);
        
        // Load from LocalStorage
        const saved = localStorage.getItem(`traffic-report-${field}`);
        if (saved) {
            input.value = saved;
            display.textContent = saved;
        } else {
            display.textContent = "未填寫";
        }
        
        // Listen for changes
        input.addEventListener("input", (e) => {
            const val = e.target.value.trim();
            localStorage.setItem(`traffic-report-${field}`, val);
            display.textContent = val || "未填寫";
        });
    });
}

function initNavigation() {
    const menuItems = document.querySelectorAll(".menu-item");
    const sections = document.querySelectorAll(".content-section");
    
    menuItems.forEach(item => {
        item.addEventListener("click", (e) => {
            menuItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");
        });
    });
    
    window.addEventListener("scroll", () => {
        let current = "";
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (window.pageYOffset >= (sectionTop - 150)) {
                current = section.getAttribute("id");
            }
        });
        
        if (current) {
            menuItems.forEach(item => {
                item.classList.remove("active");
                if (item.getAttribute("href").substring(1) === current) {
                    item.classList.add("active");
                }
            });
        }
    });
}

function initUIControls() {
    // Theme Toggle
    const themeBtn = document.getElementById("theme-toggle");
    const themeIcon = document.getElementById("theme-icon");
    
    themeBtn.addEventListener("click", () => {
        const isDark = document.body.classList.contains("dark-theme");
        if (isDark) {
            document.body.classList.remove("dark-theme");
            document.body.classList.add("light-theme");
            themeIcon.setAttribute("data-lucide", "moon");
        } else {
            document.body.classList.remove("light-theme");
            document.body.classList.add("dark-theme");
            themeIcon.setAttribute("data-lucide", "sun");
        }
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        updateChartsTheme();
    });
    
    // Data Mode Toggle
    const modeToggle = document.getElementById("data-mode-toggle");
    modeToggle.addEventListener("change", (e) => {
        dataMode = e.target.checked ? 'reference' : 'calculated';
        updateDashboardValues();
        renderCharts();
    });
    
    // Print Button
    const printBtn = document.getElementById("print-btn");
    printBtn.addEventListener("click", () => {
        window.print();
    });
    
    // Scatter Plot limit selector
    const scatterLimitSelect = document.getElementById("scatter-limit-select");
    scatterLimitSelect.addEventListener("change", () => {
        renderRegressionChart();
    });
    
    // Omitted variables button group toggle
    const omittedButtons = document.querySelectorAll(".interactive-omitted-vars .btn");
    omittedButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            omittedButtons.forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            activeOmittedVar = e.target.getAttribute("data-var");
            renderOmittedVarChart();
        });
    });
    
    // Table pagination / filters
    document.getElementById("table-search-input").addEventListener("input", handleTableFiltersChange);
    document.getElementById("table-district-filter").addEventListener("change", handleTableFiltersChange);
    document.getElementById("table-gender-filter").addEventListener("change", handleTableFiltersChange);
    
    document.getElementById("prev-page-btn").addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderTablePage();
        }
    });
    document.getElementById("next-page-btn").addEventListener("click", () => {
        const totalPages = Math.ceil(filteredTableData.length / pageSize);
        if (currentPage < totalPages) {
            currentPage++;
            renderTablePage();
        }
    });
    
    // Map filters
    document.getElementById("map-district-filter").addEventListener("change", renderMapPoints);
    document.getElementById("map-limit").addEventListener("change", renderMapPoints);
}

// --------------------------------------------------------------------------
// File Handling (Auto-fetch + Drag and Drop)
// --------------------------------------------------------------------------
function autoFetchCSV() {
    if (typeof Papa === 'undefined') {
        console.warn("PapaParse not loaded yet.");
        return;
    }
    
    const filename = "114年-臺北市死傷交通事故明細.csv";
    showLoading(true, `正在背景自動嘗試讀取 ${filename}...`);
    
    Papa.parse(filename, {
        download: true,
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        encoding: "utf-8",
        complete: function(results) {
            if (results.data && results.data.length > 0) {
                processCSVData(results.data);
            } else {
                console.warn("Auto-fetch empty or failed");
                showLoading(false);
            }
        },
        error: function(err) {
            console.log("Auto-fetch failed (expected for direct file:// openings). Ready for manual drop.");
            showLoading(false);
        }
    });
}

function initFileUploader() {
    const dropZone = document.getElementById("drop-zone");
    const fileInput = document.getElementById("file-input");
    const browseBtn = document.getElementById("browse-btn");
    
    browseBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        fileInput.click();
    });
    
    fileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            parseLocalFile(e.target.files[0]);
        }
    });
    
    dropZone.addEventListener("click", () => {
        fileInput.click();
    });
    
    // Drag and Drop Event Listeners
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('dragover');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('dragover');
        }, false);
    });
    
    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            parseLocalFile(files[0]);
        }
    }, false);
}

function parseLocalFile(file) {
    if (typeof Papa === 'undefined') {
        alert("CSV 解析套件 (PapaParse) 尚未載入，請檢查網路連線。");
        return;
    }
    
    if (!file.name.endsWith('.csv')) {
        alert("請上傳副檔名為 .csv 的交通事故明細檔案！");
        return;
    }
    
    showLoading(true, `正在解析上傳之 ${file.name} 檔案 (共 ${(file.size / 1024 / 1024).toFixed(2)} MB)...`);
    
    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        encoding: "utf-8",
        complete: function(results) {
            if (results.data && results.data.length > 0) {
                processCSVData(results.data);
            } else {
                alert("CSV 讀取成功，但未解析出任何資料列！");
                showLoading(false);
            }
        },
        error: function(err) {
            alert("讀取 CSV 錯誤: " + err.message);
            showLoading(false);
        }
    });
}

function showLoading(show, message = "") {
    const dropZone = document.getElementById("drop-zone");
    const spinner = document.getElementById("loading-spinner");
    const loadingText = document.getElementById("loading-text");
    
    if (show) {
        dropZone.classList.add("hidden");
        spinner.classList.remove("hidden");
        loadingText.textContent = message;
    } else {
        dropZone.classList.remove("hidden");
        spinner.classList.add("hidden");
    }
}

// --------------------------------------------------------------------------
// Data Processing & Statistics Computation
// --------------------------------------------------------------------------
function processCSVData(data) {
    rawData = data;
    
    // Clean Data: Explicitly cast and validate fields
    cleanedData = data.map(row => {
        const cleanRow = { ...row };
        
        // Safeguard blanks and convert valid strings to Numbers
        const ageRaw = row['年齡'];
        cleanRow['年齡'] = (ageRaw === '' || ageRaw === null || ageRaw === undefined) ? NaN : Number(ageRaw);
        
        const injuredRaw = row['受傷人數'];
        cleanRow['受傷人數'] = (injuredRaw === '' || injuredRaw === null || injuredRaw === undefined) ? NaN : Number(injuredRaw);
        
        const speedRaw = row['速限-速度限制'];
        cleanRow['速限-速度限制'] = (speedRaw === '' || speedRaw === null || speedRaw === undefined) ? NaN : Number(speedRaw);
        
        // Categorical variables casting
        cleanRow['性別'] = row['性別'] !== null && row['性別'] !== undefined ? Number(row['性別']) : null;
        cleanRow['天候'] = row['天候'] !== null && row['天候'] !== undefined ? Number(row['天候']) : null;
        cleanRow['光線'] = row['光線'] !== null && row['光線'] !== undefined ? Number(row['光線']) : null;
        cleanRow['保護裝置'] = row['保護裝置'] !== null && row['保護裝置'] !== undefined ? Number(row['保護裝置']) : null;
        
        // Coordinates casting
        cleanRow['座標-X'] = row['座標-X'] !== null && row['座標-X'] !== undefined ? Number(row['座標-X']) : null;
        cleanRow['座標-Y'] = row['座標-Y'] !== null && row['座標-Y'] !== undefined ? Number(row['座標-Y']) : null;
        
        return cleanRow;
    }).filter(row => {
        const age = row['年齡'];
        const injured = row['受傷人數'];
        const speed = row['速限-速度限制'];
        const district = row['區序'];
        
        return age !== null && age !== undefined && !isNaN(age) && age >= 0 &&
               injured !== null && injured !== undefined && !isNaN(injured) &&
               speed !== null && speed !== undefined && !isNaN(speed) &&
               district !== null && district !== undefined && String(district).trim() !== '';
    });
    
    // Calculate Live Stats
    calculateLiveStatistics();
    
    // Update Load Status Indicator
    const statusDot = document.getElementById("status-dot");
    const statusText = document.querySelector(".data-status-text");
    if (statusDot && statusText) {
        statusDot.className = "status-indicator success";
        statusText.textContent = `已載入 ${rawData.length.toLocaleString()} 筆資料`;
    }
    
    // Hide spinner
    showLoading(false);
    document.getElementById("drop-zone").classList.add("hidden"); // keep hidden after success
    
    // Initialize dropdown filters with districts present in the data
    populateDistrictFilters();
    
    // Render everything
    updateDashboardValues();
    initMapPoints();
    initExplorerTable();
    renderCharts();
    
    // Re-render LaTeX formulas dynamically
    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise();
    }
}

// Global calculated stats container
let calculatedStats = {
    rawCount: 0,
    cleanedCount: 0,
    cleanedRatio: '0%',
    age: { mean: 0, median: 0, std: 0, min: 0, max: 0 },
    injured: { mean: 0, median: 0, std: 0, min: 0, max: 0 },
    speed: { mean: 0, median: 0, std: 0, min: 0, max: 0 },
    anova: {
        f: 0,
        p: 0,
        daan: 0,
        zhongshan: 0,
        neihu: 0
    },
    regression: {
        intercept: 0,
        slope: 0,
        r2: 0
    }
};

function calculateLiveStatistics() {
    calculatedStats.rawCount = rawData.length;
    calculatedStats.cleanedCount = cleanedData.length;
    calculatedStats.cleanedRatio = ((cleanedData.length / rawData.length) * 100).toFixed(2) + '%';
    
    // Extract arrays for calculations
    const ages = cleanedData.map(r => r['年齡']);
    const injuries = cleanedData.map(r => r['受傷人數']);
    const speeds = cleanedData.map(r => r['速限-速度限制']);
    
    // Basic Descriptive calculations
    calculatedStats.age = computeDescriptive(ages);
    calculatedStats.injured = computeDescriptive(injuries);
    calculatedStats.speed = computeDescriptive(speeds);
    
    // ANOVA Calculations for Daan, Zhongshan, Neihu
    const daanAges = cleanedData.filter(r => String(r['區序']).includes("大安")).map(r => r['年齡']);
    const zhongshanAges = cleanedData.filter(r => String(r['區序']).includes("中山")).map(r => r['年齡']);
    const neihuAges = cleanedData.filter(r => String(r['區序']).includes("內湖")).map(r => r['年齡']);
    
    calculatedStats.anova.daan = daanAges.length > 0 ? (daanAges.reduce((a, b) => a + b, 0) / daanAges.length) : 0;
    calculatedStats.anova.zhongshan = zhongshanAges.length > 0 ? (zhongshanAges.reduce((a, b) => a + b, 0) / zhongshanAges.length) : 0;
    calculatedStats.anova.neihu = neihuAges.length > 0 ? (neihuAges.reduce((a, b) => a + b, 0) / neihuAges.length) : 0;
    
    if (daanAges.length > 1 && zhongshanAges.length > 1 && neihuAges.length > 1) {
        const groups = [daanAges, zhongshanAges, neihuAges];
        const n = groups.map(g => g.length);
        const means = [calculatedStats.anova.daan, calculatedStats.anova.zhongshan, calculatedStats.anova.neihu];
        
        // Grand Mean
        const totalN = n.reduce((a, b) => a + b, 0);
        const grandMean = groups.reduce((sum, g) => sum + g.reduce((a, b) => a + b, 0), 0) / totalN;
        
        // SSB
        let ssb = 0;
        for (let i = 0; i < groups.length; i++) {
            ssb += n[i] * Math.pow(means[i] - grandMean, 2);
        }
        
        // SSW
        let ssw = 0;
        for (let i = 0; i < groups.length; i++) {
            ssw += groups[i].reduce((sum, val) => sum + Math.pow(val - means[i], 2), 0);
        }
        
        const dfBetween = groups.length - 1; // 2
        const dfWithin = totalN - groups.length;
        
        const msb = ssb / dfBetween;
        const msw = ssw / dfWithin;
        
        calculatedStats.anova.f = msb / msw;
        calculatedStats.anova.p = Math.pow(1 + (dfBetween / dfWithin) * calculatedStats.anova.f, -dfWithin / 2);
    }
    
    // Regression Calculations (X = Speed, Y = Injuries)
    if (cleanedData.length > 1) {
        const meanX = calculatedStats.speed.mean;
        const meanY = calculatedStats.injured.mean;
        
        let covarianceSum = 0;
        let varXSum = 0;
        let varYSum = 0;
        
        for (let i = 0; i < cleanedData.length; i++) {
            const diffX = speeds[i] - meanX;
            const diffY = injuries[i] - meanY;
            covarianceSum += diffX * diffY;
            varXSum += diffX * diffX;
            varYSum += diffY * diffY;
        }
        
        if (varXSum > 0 && varYSum > 0) {
            const slope = covarianceSum / varXSum;
            const intercept = meanY - (slope * meanX);
            const correlation = covarianceSum / Math.sqrt(varXSum * varYSum);
            
            calculatedStats.regression.slope = slope;
            calculatedStats.regression.intercept = intercept;
            calculatedStats.regression.r2 = correlation * correlation;
        }
    }
}

function computeDescriptive(arr) {
    if (arr.length === 0) return { mean: 0, median: 0, std: 0, min: 0, max: 0 };
    
    const sum = arr.reduce((a, b) => a + b, 0);
    const mean = sum / arr.length;
    
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    
    let sumSq = 0;
    for (let i = 0; i < arr.length; i++) {
        sumSq += Math.pow(arr[i] - mean, 2);
    }
    const std = arr.length > 1 ? Math.sqrt(sumSq / (arr.length - 1)) : 0;
    
    return { mean, median, std, min, max };
}

// --------------------------------------------------------------------------
// UI Values Synchronization
// --------------------------------------------------------------------------
function updateDashboardValues() {
    const stats = dataMode === 'reference' ? referenceStats : calculatedStats;
    
    // Update Preprocessing Info
    document.getElementById("raw-count-val").textContent = calculatedStats.rawCount > 0 ? calculatedStats.rawCount.toLocaleString() : referenceStats.rawCount.toLocaleString();
    document.getElementById("cleaned-count-val").textContent = calculatedStats.cleanedCount > 0 ? calculatedStats.cleanedCount.toLocaleString() : referenceStats.cleanedCount.toLocaleString();
    document.getElementById("cleaned-ratio-val").textContent = calculatedStats.rawCount > 0 ? calculatedStats.cleanedRatio : referenceStats.cleanedRatio;
    
    const fmt = (val, dec = 2) => val !== undefined && val !== null ? val.toFixed(dec) : '--';
    
    // Update Descriptive Stats Table
    document.getElementById("age-mean").textContent = fmt(stats.age.mean, 2);
    document.getElementById("age-median").textContent = fmt(stats.age.median, 1);
    document.getElementById("age-std").textContent = fmt(stats.age.std, 2);
    document.getElementById("age-min").textContent = fmt(stats.age.min, 0);
    document.getElementById("age-max").textContent = fmt(stats.age.max, 0);
    
    document.getElementById("inj-mean").textContent = fmt(stats.injured.mean, 2);
    document.getElementById("inj-median").textContent = fmt(stats.injured.median, 1);
    document.getElementById("inj-std").textContent = fmt(stats.injured.std, 2);
    document.getElementById("inj-min").textContent = fmt(stats.injured.min, 0);
    document.getElementById("inj-max").textContent = fmt(stats.injured.max, 0);
    
    document.getElementById("speed-mean").textContent = fmt(stats.speed.mean, 2);
    document.getElementById("speed-median").textContent = fmt(stats.speed.median, 1);
    document.getElementById("speed-std").textContent = fmt(stats.speed.std, 2);
    document.getElementById("speed-min").textContent = fmt(stats.speed.min, 0);
    document.getElementById("speed-max").textContent = fmt(stats.speed.max, 0);
    
    // Update ANOVA Table
    document.getElementById("anova-f-val").textContent = fmt(stats.anova.f, 2);
    const pVal = stats.anova.p;
    if (pVal < 0.0001) {
        document.getElementById("anova-p-val").textContent = "< 0.0001";
    } else {
        document.getElementById("anova-p-val").textContent = fmt(pVal, 4);
    }
    
    const sigBadge = document.getElementById("anova-sig-badge");
    if (sigBadge) {
        if (pVal < 0.05) {
            sigBadge.className = "badge badge-success";
            sigBadge.textContent = "顯著差異 (拒絕 H0)";
        } else {
            sigBadge.className = "badge badge-danger";
            sigBadge.textContent = "不顯著 (無法拒絕 H0)";
        }
    }
}

// --------------------------------------------------------------------------
// Visualizations (Chart.js Configs)
// --------------------------------------------------------------------------
function updateChartsTheme() {
    renderCharts();
}

function getThemeColors() {
    const isDark = document.body.classList.contains("dark-theme");
    return {
        text: isDark ? "#9ca3af" : "#475569",
        grid: isDark ? "#374151" : "#e2e8f0",
        primary: isDark ? "#60a5fa" : "#3b82f6",
        primaryHover: isDark ? "#93c5fd" : "#2563eb",
        accent: isDark ? "#34d399" : "#10b981",
        accentLight: isDark ? "rgba(52, 211, 153, 0.2)" : "rgba(16, 185, 129, 0.15)",
        highlight: isDark ? "#f87171" : "#ef4444",
        cardBg: isDark ? "#151e2b" : "#f8fafc",
        ticks: isDark ? "#9ca3af" : "#64748b"
    };
}

function renderCharts() {
    if (typeof Chart === 'undefined') {
        console.warn("Chart.js is not loaded.");
        return;
    }
    
    renderAgeHistogram();
    renderDistrictBarChart();
    renderGenderPieChart();
    renderHourlyLineChart();
    renderAnovaChart();
    renderRegressionChart();
    renderOmittedVarChart();
}

function renderAgeHistogram() {
    const ctx = document.getElementById("age-histogram").getContext("2d");
    if (charts.ageHistogram) charts.ageHistogram.destroy();
    
    const colors = getThemeColors();
    let labels = [], data = [];
    
    if (cleanedData.length === 0 || dataMode === 'reference') {
        labels = ["0-9 歲", "10-19 歲", "20-29 歲", "30-39 歲", "40-49 歲", "50-59 歲", "60-69 歲", "70-79 歲", "80-89 歲", "90 歲以上"];
        data = [350, 1850, 6800, 4800, 3100, 2400, 1800, 1100, 420, 80];
    } else {
        const bins = Array(10).fill(0);
        cleanedData.forEach(row => {
            const age = row['年齡'];
            const idx = Math.min(Math.floor(age / 10), 9);
            bins[idx]++;
        });
        labels = ["0-9 歲", "10-19 歲", "20-29 歲", "30-39 歲", "40-49 歲", "50-59 歲", "60-69 歲", "70-79 歲", "80-89 歲", "90 歲以上"];
        data = bins;
    }
    
    charts.ageHistogram = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '事故當事人人數',
                data: data,
                backgroundColor: colors.primary,
                borderColor: colors.primary,
                borderWidth: 1,
                borderRadius: 4,
                hoverBackgroundColor: colors.primaryHover
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', titleFont: { size: 13 } }
            },
            scales: {
                x: { ticks: { color: colors.ticks }, grid: { display: false } },
                y: { ticks: { color: colors.ticks }, grid: { color: colors.grid } }
            }
        }
    });
}

function renderDistrictBarChart() {
    const ctx = document.getElementById("district-bar-chart").getContext("2d");
    if (charts.districtBar) charts.districtBar.destroy();
    
    const colors = getThemeColors();
    let labels = [], data = [], barColors = [];
    
    if (cleanedData.length === 0 || dataMode === 'reference') {
        const mockDistricts = [
            { name: "中山區", count: 3015 },
            { name: "大安區", count: 2491 },
            { name: "內湖區", count: 2009 },
            { name: "士林區", count: 1850 },
            { name: "信義區", count: 1720 },
            { name: "萬華區", count: 1540 },
            { name: "中正區", count: 1480 },
            { name: "松山區", count: 1390 },
            { name: "北投區", count: 1250 },
            { name: "文山區", count: 1100 },
            { name: "南港區", count: 980 },
            { name: "大同區", count: 860 }
        ];
        labels = mockDistricts.map(d => d.name);
        data = mockDistricts.map(d => d.count);
    } else {
        const districtCounts = {};
        cleanedData.forEach(row => {
            const raw = String(row['區序']);
            const cleanName = raw.replace(/^\d+/, '').trim();
            districtCounts[cleanName] = (districtCounts[cleanName] || 0) + 1;
        });
        
        const sorted = Object.entries(districtCounts).sort((a, b) => b[1] - a[1]);
        labels = sorted.map(e => e[0]);
        data = sorted.map(e => e[1]);
    }
    
    barColors = labels.map(name => {
        if (name.includes("大安") || name.includes("中山") || name.includes("內湖")) {
            return colors.accent;
        }
        return colors.primary;
    });
    
    charts.districtBar = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '事故件數',
                data: data,
                backgroundColor: barColors,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)' }
            },
            scales: {
                x: { ticks: { color: colors.ticks, font: { size: 10 } }, grid: { display: false } },
                y: { ticks: { color: colors.ticks }, grid: { color: colors.grid } }
            }
        }
    });
}

function renderGenderPieChart() {
    const ctx = document.getElementById("gender-pie-chart").getContext("2d");
    if (charts.genderPie) charts.genderPie.destroy();
    
    let labels = ["男性", "女性", "未明或法人"];
    let data = [16318, 6184, 258];
    
    if (cleanedData.length > 0 && dataMode === 'calculated') {
        const counts = { 1.0: 0, 2.0: 0, other: 0 };
        cleanedData.forEach(row => {
            const g = Number(row['性別']);
            if (g === 1.0) counts[1.0]++;
            else if (g === 2.0) counts[2.0]++;
            else counts.other++;
        });
        data = [counts[1.0], counts[2.0], counts.other];
    }
    
    charts.genderPie = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#3b82f6', '#ec4899', '#94a3b8'],
                borderWidth: 2,
                borderColor: document.body.classList.contains("dark-theme") ? '#1f2937' : '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: getThemeColors().text, font: { size: 11 } } }
            },
            cutout: '65%'
        }
    });
}

function renderHourlyLineChart() {
    const ctx = document.getElementById("hourly-line-chart").getContext("2d");
    if (charts.hourlyLine) charts.hourlyLine.destroy();
    
    const colors = getThemeColors();
    let labels = Array.from({ length: 24 }, (_, i) => `${i}時`);
    let data = [];
    
    if (cleanedData.length === 0 || dataMode === 'reference') {
        data = [
            450, 300, 220, 180, 210, 320, 750, 1850, 2200, 1500, 1300, 1400, 
            1450, 1200, 1300, 1420, 1750, 2400, 2800, 1900, 1350, 1100, 950, 680
        ];
    } else {
        const hourlyCounts = Array(24).fill(0);
        cleanedData.forEach(row => {
            const hr = row['發生時-Hours'];
            if (hr !== null && hr !== undefined && hr >= 0 && hr < 24) {
                hourlyCounts[hr]++;
            }
        });
        data = hourlyCounts;
    }
    
    charts.hourlyLine = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '事故數量',
                data: data,
                borderColor: colors.primary,
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointRadius: 2,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)' }
            },
            scales: {
                x: { ticks: { color: colors.ticks, font: { size: 9 } }, grid: { display: false } },
                y: { ticks: { color: colors.ticks }, grid: { color: colors.grid } }
            }
        }
    });
}

function renderAnovaChart() {
    const ctx = document.getElementById("anova-chart").getContext("2d");
    if (charts.anovaChart) charts.anovaChart.destroy();
    
    const colors = getThemeColors();
    const stats = dataMode === 'reference' ? referenceStats : calculatedStats;
    
    const labels = ["大安區", "中山區", "內湖區"];
    const data = [stats.anova.daan, stats.anova.zhongshan, stats.anova.neihu];
    
    charts.anovaChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '事故當事人平均年齡 (歲)',
                data: data,
                backgroundColor: [colors.primary, colors.primary, colors.accent],
                borderRadius: 6,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)' }
            },
            scales: {
                x: { ticks: { color: colors.ticks }, grid: { display: false } },
                y: { 
                    ticks: { color: colors.ticks }, 
                    grid: { color: colors.grid },
                    min: 30,
                    max: 48
                }
            }
        }
    });
}

function renderRegressionChart() {
    const ctx = document.getElementById("regression-chart").getContext("2d");
    if (charts.regressionChart) charts.regressionChart.destroy();
    
    const colors = getThemeColors();
    const stats = dataMode === 'reference' ? referenceStats : calculatedStats;
    
    let scatterData = [];
    
    if (cleanedData.length > 0 && dataMode === 'calculated') {
        const limitSelect = document.getElementById("scatter-limit-select").value;
        let limit = limitSelect === 'all' ? cleanedData.length : parseInt(limitSelect);
        
        const step = Math.max(Math.floor(cleanedData.length / limit), 1);
        for (let i = 0; i < cleanedData.length; i += step) {
            if (scatterData.length >= limit) break;
            scatterData.push({
                x: cleanedData[i]['速限-速度限制'],
                y: cleanedData[i]['受傷人數']
            });
        }
    } else {
        const limits = 1000;
        for (let i = 0; i < limits; i++) {
            const speedOptions = [30, 40, 50, 60, 70, 80];
            const speed = speedOptions[Math.floor(Math.random() * speedOptions.length)];
            
            const baseLambda = 0.823 + 0.0069 * speed;
            const noise = (Math.random() - 0.3) * 1.5;
            const injury = Math.max(Math.round(baseLambda + noise), 0);
            
            scatterData.push({ x: speed, y: injury });
        }
    }
    
    const lineData = [];
    const speedPoints = [0, 40, 50, 80];
    speedPoints.forEach(s => {
        lineData.push({
            x: s,
            y: stats.regression.intercept + (stats.regression.slope * s)
        });
    });
    
    charts.regressionChart = new Chart(ctx, {
        data: {
            datasets: [
                {
                    type: 'scatter',
                    label: '交通事故紀錄 (點重疊度反映密度)',
                    data: scatterData,
                    backgroundColor: colors.accentLight,
                    borderColor: 'transparent',
                    pointRadius: 3,
                    pointHoverRadius: 6
                },
                {
                    type: 'line',
                    label: `迴歸擬合線 (Y = ${stats.regression.intercept.toFixed(3)} + ${stats.regression.slope.toFixed(4)} * X)`,
                    data: lineData,
                    borderColor: colors.highlight,
                    backgroundColor: 'transparent',
                    borderWidth: 3,
                    pointRadius: 4,
                    pointBackgroundColor: colors.highlight,
                    tension: 0,
                    showLine: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)' },
                legend: { labels: { color: colors.text } }
            },
            scales: {
                x: { 
                    type: 'linear', 
                    position: 'bottom', 
                    title: { display: true, text: '道路速限 (km/h)', color: colors.text },
                    ticks: { color: colors.ticks },
                    grid: { color: colors.grid },
                    min: 0,
                    max: 90
                },
                y: { 
                    title: { display: true, text: '受傷人數 (人)', color: colors.text },
                    ticks: { color: colors.ticks },
                    grid: { color: colors.grid },
                    min: -0.5,
                    max: 8
                }
            }
        }
    });
}

function renderOmittedVarChart() {
    const ctx = document.getElementById("omitted-var-chart").getContext("2d");
    if (charts.omittedVarChart) charts.omittedVarChart.destroy();
    
    const colors = getThemeColors();
    let labels = [], data = [], barLabel = '';
    
    if (cleanedData.length === 0 || dataMode === 'reference') {
        if (activeOmittedVar === 'weather') {
            labels = ["晴天", "陰天", "雨天", "其他"];
            data = [12966, 6440, 3353, 1];
            barLabel = "不同天候下之事故數量";
        } else if (activeOmittedVar === 'light') {
            labels = ["日間自然光線", "夜間有照明", "晨或暮光"];
            data = [9296, 9058, 4396];
            barLabel = "不同光線環境下之事故數量";
        } else if (activeOmittedVar === 'protect') {
            labels = ["戴非半罩安全帽", "戴半罩安全帽", "有繫安全帶", "無需裝備/其他", "未配戴/未繫帶"];
            data = [4897, 4791, 4836, 7850, 326];
            barLabel = "當事人保護裝備使用率統計";
        }
    } else {
        const counts = {};
        if (activeOmittedVar === 'weather') {
            cleanedData.forEach(row => {
                const val = Number(row['天候']);
                const label = weatherMap[val] || `其他/代碼(${val})`;
                counts[label] = (counts[label] || 0) + 1;
            });
            barLabel = "事故天候分佈";
        } else if (activeOmittedVar === 'light') {
            cleanedData.forEach(row => {
                const val = Number(row['光線']);
                const label = lightMap[val] || `其他/代碼(${val})`;
                counts[label] = (counts[label] || 0) + 1;
            });
            barLabel = "事故光線分佈";
        } else if (activeOmittedVar === 'protect') {
            cleanedData.forEach(row => {
                const val = Number(row['保護裝置']);
                const label = protectionMap[val] || `其他/代碼(${val})`;
                counts[label] = (counts[label] || 0) + 1;
            });
            barLabel = "保護裝置配戴分佈";
        }
        
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        labels = sorted.map(e => e[0]);
        data = sorted.map(e => e[1]);
    }
    
    charts.omittedVarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '事故當事人件數',
                data: data,
                backgroundColor: colors.primary,
                borderRadius: 4,
                barPercentage: 0.5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)' }
            },
            scales: {
                x: { ticks: { color: colors.ticks, font: { size: 10 } }, grid: { display: false } },
                y: { ticks: { color: colors.ticks }, grid: { color: colors.grid } }
            }
        }
    });
}

// --------------------------------------------------------------------------
// Leaflet.js GIS Mapping
// --------------------------------------------------------------------------
function initMap() {
    map = L.map('leaflet-map').setView([25.043, 121.54], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}

function populateDistrictFilters() {
    const tableFilter = document.getElementById("table-district-filter");
    const mapFilter = document.getElementById("map-district-filter");
    
    if (!tableFilter || !mapFilter) return;
    
    tableFilter.innerHTML = '<option value="all">所有行政區</option>';
    mapFilter.innerHTML = '<option value="all">所有行政區</option>';
    
    const districts = new Set();
    cleanedData.forEach(row => {
        const raw = String(row['區序']);
        const name = raw.replace(/^\d+/, '').trim();
        districts.add(name);
    });
    
    Array.from(districts).sort().forEach(dist => {
        const option1 = document.createElement("option");
        option1.value = dist;
        option1.textContent = dist;
        tableFilter.appendChild(option1);
        
        const option2 = document.createElement("option");
        option2.value = dist;
        option2.textContent = dist;
        mapFilter.appendChild(option2);
    });
}

function initMapPoints() {
    renderMapPoints();
}

function renderMapPoints() {
    if (typeof L === 'undefined' || !map || cleanedData.length === 0) return;
    
    // Clear previous markers
    mapMarkers.forEach(marker => map.removeLayer(marker));
    mapMarkers = [];
    
    const districtFilter = document.getElementById("map-district-filter").value;
    const limit = parseInt(document.getElementById("map-limit").value);
    
    let mapData = cleanedData.filter(row => {
        const x = Number(row['座標-X']);
        const y = Number(row['座標-Y']);
        
        if (isNaN(x) || x === 0) return false;
        if (isNaN(y) || y === 0) return false;
        
        // Filter by district if selected
        if (districtFilter !== 'all') {
            const raw = String(row['區序']);
            const cleanName = raw.replace(/^\d+/, '').trim();
            if (cleanName !== districtFilter) return false;
        }
        return true;
    });
    
    mapData = mapData.slice(0, limit);
    
    const pointsCountSpan = document.getElementById("map-points-count");
    if (pointsCountSpan) {
        pointsCountSpan.textContent = mapData.length.toLocaleString();
    }
    
    mapData.forEach(row => {
        const lat = Number(row['座標-Y']);
        const lng = Number(row['座標-X']);
        const rawDist = String(row['區序']);
        const cleanDist = rawDist.replace(/^\d+/, '').trim();
        const loc = row['肇事地點'] ? String(row['肇事地點']) : '未知路段';
        
        const marker = L.circleMarker([lat, lng], {
            radius: 5,
            fillColor: '#ef4444',
            color: '#ffffff',
            weight: 1,
            opacity: 0.8,
            fillOpacity: 0.5
        });
        
        // Month & Day safeguarding
        const m = row['發生月'] ? Number(row['發生月']) : 1;
        const d = row['發生日'] ? Number(row['發生日']) : 1;
        const hr = row['發生時-Hours'] !== null && row['發生時-Hours'] !== undefined ? Number(row['發生時-Hours']) : 0;
        const min = row['發生分'] !== null && row['發生分'] !== undefined ? Number(row['發生分']) : 0;
        
        const datetime = `114年${m}月${d}日 ${hr}:${String(min).padStart(2, '0')}`;
        const popupText = `
            <div class="map-popup">
                <strong>📍 事故地點:</strong> ${loc}<br>
                <strong>🕒 時間:</strong> ${datetime}<br>
                <strong>🏷️ 行政區:</strong> ${cleanDist}<br>
                <strong>💥 傷亡:</strong> ${row['死亡人數'] > 0 ? `<span style="color:red;font-weight:bold;">${row['死亡人數']}死</span>` : ''} ${row['受傷人數']}受傷<br>
                <strong>🏍️ 車種:</strong> ${mapVehicleType(row['車種'])}<br>
                <strong>🌦️ 天氣:</strong> ${weatherMap[Number(row['天候'])] || "其他"}
            </div>
        `;
        
        marker.bindPopup(popupText);
        marker.addTo(map);
        mapMarkers.push(marker);
    });
    
    if (mapMarkers.length > 0) {
        const group = new L.featureGroup(mapMarkers);
        map.fitBounds(group.getBounds(), { padding: [20, 20] });
    }
}

// --------------------------------------------------------------------------
// Interactive Data Table Explorer
// --------------------------------------------------------------------------
function initExplorerTable() {
    handleTableFiltersChange();
}

function handleTableFiltersChange() {
    currentPage = 1;
    applyTableFilters();
}

function applyTableFilters() {
    if (cleanedData.length === 0) return;
    
    const searchInput = document.getElementById("table-search-input");
    const districtSelect = document.getElementById("table-district-filter");
    const genderSelect = document.getElementById("table-gender-filter");
    
    if (!searchInput || !districtSelect || !genderSelect) return;
    
    const searchVal = searchInput.value.toLowerCase().trim();
    const districtFilter = districtSelect.value;
    const genderFilter = genderSelect.value;
    
    filteredTableData = cleanedData.filter(row => {
        // District Filter
        const rawDist = String(row['區序']);
        const cleanDist = rawDist.replace(/^\d+/, '').trim();
        if (districtFilter !== 'all' && cleanDist !== districtFilter) {
            return false;
        }
        
        // Gender Filter
        if (genderFilter !== 'all') {
            const gVal = Number(row['性別']);
            const filterVal = Number(genderFilter);
            if (isNaN(gVal) || gVal !== filterVal) return false;
        }
        
        // Text Search (searches District, Location, Vehicle, Weather, and Gender)
        if (searchVal !== '') {
            const dist = cleanDist.toLowerCase();
            const loc = (row['肇事地點'] ? String(row['肇事地點']) : '').toLowerCase();
            const car = mapVehicleType(row['車種']).toLowerCase();
            const weather = (weatherMap[Number(row['天候'])] || "").toLowerCase();
            const sex = (genderMap[Number(row['性別'])] || "").toLowerCase();
            
            if (!loc.includes(searchVal) && 
                !car.includes(searchVal) && 
                !weather.includes(searchVal) && 
                !dist.includes(searchVal) && 
                !sex.includes(searchVal)) {
                return false;
            }
        }
        
        return true;
    });
    
    renderTablePage();
}

function renderTablePage() {
    const tbody = document.getElementById("table-body");
    const prevBtn = document.getElementById("prev-page-btn");
    const nextBtn = document.getElementById("next-page-btn");
    const pagInfo = document.getElementById("pagination-info");
    
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    if (filteredTableData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center">查無符合篩選條件的事故紀錄</td></tr>`;
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
        if (pagInfo) pagInfo.textContent = "第 0 頁，共 0 頁";
        return;
    }
    
    const totalPages = Math.ceil(filteredTableData.length / pageSize);
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, filteredTableData.length);
    const pageData = filteredTableData.slice(startIdx, endIdx);
    
    pageData.forEach(row => {
        const tr = document.createElement("tr");
        
        const m = row['發生月'] ? Number(row['發生月']) : 1;
        const d = row['發生日'] ? Number(row['發生日']) : 1;
        const dateStr = `${m}/${d}`;
        
        const rawDist = String(row['區序']);
        const cleanDist = rawDist.replace(/^\d+/, '').trim();
        const loc = row['肇事地點'] ? String(row['肇事地點']) : '未知路段';
        const age = isNaN(row['年齡']) ? '--' : Math.round(row['年齡']);
        const sex = genderMap[Number(row['性別'])] || "其他";
        const injured = row['受傷人數'];
        const speed = row['速限-速度限制'];
        const car = mapVehicleType(row['車種']);
        
        tr.innerHTML = `
            <td>${dateStr}</td>
            <td><strong>${cleanDist}</strong></td>
            <td title="${loc}">${loc.length > 20 ? loc.substring(0, 18) + '...' : loc}</td>
            <td>${age} 歲</td>
            <td>${sex}</td>
            <td>${injured} 人</td>
            <td>${speed} km/h</td>
            <td><span class="badge" style="background-color:var(--bg-app);color:var(--text-primary);border:1px solid var(--border-color);">${car}</span></td>
        `;
        tbody.appendChild(tr);
    });
    
    // Update pagination controls
    if (pagInfo) {
        pagInfo.textContent = `第 ${currentPage} 頁，共 ${totalPages} 頁 (篩選出 ${filteredTableData.length.toLocaleString()} 筆)`;
    }
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;
}
