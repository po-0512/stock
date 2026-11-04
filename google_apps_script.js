/**
 * ==============================================================================
 * TradeLog Google Apps Script (GAS) 雲端後端與即時股價 API
 * ==============================================================================
 * 
 * 功能：
 * 1. 交易紀錄備份（自動存入 Google 表格「交易紀錄」）
 * 2. 交易紀錄還原（從 Google 表格拉取所有紀錄還原至前端 LocalStorage）
 * 3. 台灣股市即時 / 最新盤中股價查詢（支援上市 .TW 與上櫃 .TWO，自動判定）
 * 4. 試算表自動建立美化欄位與公式
 */

// 試算表工作表名稱定義
const SHEET_TX = "交易紀錄";
const SHEET_HOLDINGS = "持股現價";
const SHEET_LOGS = "備份日誌";

/**
 * 處理 GET 請求
 * 支援:
 * ?action=restore (還原交易與現價)
 * ?action=fetch_prices&symbols=2330,2449,6274 (查詢即時股價)
 * ?action=ping (測試連線)
 */
function doGet(e) {
  return handleRequest(e, "GET");
}

/**
 * 處理 POST 請求
 * 支援:
 * action="backup" (備份資料至表格)
 * action="fetch_prices" (查詢即時股價)
 * action="restore" (還原資料)
 */
function doPost(e) {
  return handleRequest(e, "POST");
}

function handleRequest(e, method) {
  try {
    let params = {};
    if (e && e.parameter) {
      params = e.parameter;
    }
    
    // 解析 POST 內容 (支援 text/plain 與 application/json)
    let postData = null;
    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (err) {
        // 若不是純 JSON 則忽略
      }
    }

    const action = (postData && postData.action) || params.action || "ping";

    let responseData = {};

    switch (action) {
      case "ping":
        responseData = {
          status: "success",
          message: "TradeLog Google Apps Script API 運作正常！",
          timestamp: new Date().toISOString()
        };
        break;

      case "backup":
        responseData = handleBackup(postData || params);
        break;

      case "restore":
        responseData = handleRestore();
        break;

      case "fetch_prices":
        const symbols = (postData && postData.symbols) || (params.symbols ? params.symbols.split(",") : []);
        responseData = handleFetchPrices(symbols);
        break;

      default:
        responseData = { status: "error", message: "未知的 action: " + action };
    }

    return createJsonResponse(responseData);
  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.toString(),
      stack: error.stack
    });
  }
}

function createJsonResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * 取得或自動建立指定的工作表
 */
function getOrCreateSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

/**
 * 備份所有交易資料與現價至 Google 表格
 */
function handleBackup(payload) {
  const transactions = payload.transactions || [];
  const priceOverrides = payload.priceOverrides || {};

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const txSheet = getOrCreateSheet(SHEET_TX);

  // 初始化 / 清理並重寫標題列
  txSheet.clear();
  const headers = [
    "交易ID", "交易日期", "股票代號", "股票名稱", "類型", 
    "交易方式", "成交價格", "成交股數", "手續費", "總金額", 
    "買賣理由", "AI行為標籤", "進出場時機", "AI短評", "備份更新時間"
  ];

  txSheet.appendRow(headers);
  
  // 美化標題列
  const headerRange = txSheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#131922")
             .setFontColor("#d4a843")
             .setFontWeight("bold")
             .setHorizontalAlignment("center");
  txSheet.setFrozenRows(1);

  const nowStr = Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy-MM-dd HH:mm:ss");

  // 寫入交易列
  if (transactions.length > 0) {
    const rows = transactions.map(t => [
      t.id || "",
      t.date || "",
      t.symbol || "",
      t.name || "",
      t.type || "",
      t.tradeMethod || "cash",
      t.price || 0,
      t.quantity || 0,
      t.fee || 0,
      t.totalAmount || (t.price * t.quantity),
      t.reason || "",
      (t.behavior_tags || []).join(", "),
      t.timing || "",
      t.ai_comment || "",
      nowStr
    ]);

    txSheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  // 備份現價表 (持股現價工作表)
  const holdingsSheet = getOrCreateSheet(SHEET_HOLDINGS);
  holdingsSheet.clear();
  const hHeaders = ["股票代號", "最新現價", "備份時間"];
  holdingsSheet.appendRow(hHeaders);
  holdingsSheet.getRange(1, 1, 1, hHeaders.length)
               .setBackground("#131922")
               .setFontColor("#79c0ff")
               .setFontWeight("bold")
               .setHorizontalAlignment("center");
  holdingsSheet.setFrozenRows(1);

  const priceEntries = Object.entries(priceOverrides);
  if (priceEntries.length > 0) {
    const pRows = priceEntries.map(([sym, px]) => [sym, px, nowStr]);
    holdingsSheet.getRange(2, 1, pRows.length, hHeaders.length).setValues(pRows);
  }

  // 記錄 Log
  const logSheet = getOrCreateSheet(SHEET_LOGS);
  if (logSheet.getLastRow() === 0) {
    logSheet.appendRow(["時間", "操作", "筆數", "狀態"]);
    logSheet.getRange(1, 1, 1, 4).setBackground("#131922").setFontColor("#e6edf3").setFontWeight("bold");
    logSheet.setFrozenRows(1);
  }
  logSheet.appendRow([nowStr, "備份寫入 (Backup)", transactions.length + " 筆交易", "成功"]);

  return {
    status: "success",
    message: "成功備份 " + transactions.length + " 筆交易與現價資料至 Google 表格！",
    count: transactions.length,
    timestamp: nowStr
  };
}

/**
 * 從 Google 表格還原資料至 TradeLog 前端
 */
function handleRestore() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const txSheet = ss.getSheetByName(SHEET_TX);
  
  if (!txSheet || txSheet.getLastRow() <= 1) {
    return {
      status: "success",
      transactions: [],
      priceOverrides: {},
      message: "表格內尚無備份資料"
    };
  }

  const values = txSheet.getDataRange().getValues();
  const transactions = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row[0] && !row[2]) continue;

    transactions.push({
      id: String(row[0]),
      date: typeof row[1] === 'object' ? Utilities.formatDate(row[1], "Asia/Taipei", "yyyy-MM-dd") : String(row[1]),
      symbol: String(row[2]),
      name: String(row[3]),
      type: String(row[4]),
      tradeMethod: String(row[5] || 'cash'),
      price: parseFloat(row[6]) || 0,
      quantity: parseFloat(row[7]) || 0,
      fee: parseFloat(row[8]) || 0,
      totalAmount: parseFloat(row[9]) || (parseFloat(row[6]) * parseFloat(row[7])),
      reason: String(row[10] || ""),
      behavior_tags: row[11] ? String(row[11]).split(",").map(s => s.trim()).filter(Boolean) : [],
      timing: String(row[12] || "合理"),
      ai_comment: String(row[13] || ""),
      confidence: 100
    });
  }

  // 讀取現價
  const priceOverrides = {};
  const holdingsSheet = ss.getSheetByName(SHEET_HOLDINGS);
  if (holdingsSheet && holdingsSheet.getLastRow() > 1) {
    const hValues = holdingsSheet.getDataRange().getValues();
    for (let j = 1; j < hValues.length; j++) {
      const sym = String(hValues[j][0]).trim();
      const px = parseFloat(hValues[j][1]);
      if (sym && !isNaN(px)) {
        priceOverrides[sym] = px;
      }
    }
  }

  return {
    status: "success",
    transactions: transactions,
    priceOverrides: priceOverrides,
    count: transactions.length,
    message: "成功從 Google 表格還原 " + transactions.length + " 筆交易！"
  };
}

/**
 * 查詢台股即時/盤中最新股價
 * 支援代號自動匹配上市 (.TW) 或上櫃 (.TWO)
 */
function handleFetchPrices(symbols) {
  if (!symbols || symbols.length === 0) {
    return { status: "success", prices: {}, details: {} };
  }

  const cleanSymbols = symbols.map(s => String(s).trim().toUpperCase()).filter(Boolean);
  const prices = {};
  const details = {};

  cleanSymbols.forEach(sym => {
    const q = fetchSingleStockPrice(sym);
    if (q && q.price !== null) {
      prices[sym] = q.price;
      details[sym] = q;
    }
  });

  // 更新至持股現價表
  if (Object.keys(prices).length > 0) {
    try {
      const holdingsSheet = getOrCreateSheet(SHEET_HOLDINGS);
      const nowStr = Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy-MM-dd HH:mm:ss");
      
      // 讀取現有內容
      const existing = {};
      if (holdingsSheet.getLastRow() > 1) {
        const rows = holdingsSheet.getDataRange().getValues();
        for (let i = 1; i < rows.length; i++) {
          existing[String(rows[i][0]).trim()] = rows[i][1];
        }
      }

      // 合併新價格
      for (let s in prices) {
        existing[s] = prices[s];
      }

      holdingsSheet.clear();
      holdingsSheet.appendRow(["股票代號", "最新現價", "更新時間"]);
      holdingsSheet.getRange(1, 1, 1, 3)
                   .setBackground("#131922")
                   .setFontColor("#79c0ff")
                   .setFontWeight("bold")
                   .setHorizontalAlignment("center");
      holdingsSheet.setFrozenRows(1);

      const updatedRows = Object.entries(existing).map(([s, p]) => [s, p, nowStr]);
      if (updatedRows.length > 0) {
        holdingsSheet.getRange(2, 1, updatedRows.length, 3).setValues(updatedRows);
      }
    } catch (err) {
      console.error("更新現價表失敗: " + err);
    }
  }

  return {
    status: "success",
    prices: prices,
    details: details,
    updatedAt: Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy-MM-dd HH:mm:ss")
  };
}

/**
 * 查詢單檔台股現價（依序嘗試 .TW 上市與 .TWO 上櫃）
 */
function fetchSingleStockPrice(symbol) {
  const cleanSym = symbol.replace(/\.TW$|\.TWO$/i, "");
  const suffixes = [".TW", ".TWO"];

  for (let i = 0; i < suffixes.length; i++) {
    const ticker = cleanSym + suffixes[i];
    const url = "https://query1.finance.yahoo.com/v8/finance/chart/" + ticker + "?interval=1d&range=1d";
    
    try {
      const resp = UrlFetchApp.fetch(url, {
        muteHttpExceptions: true,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }
      });

      if (resp.getResponseCode() === 200) {
        const json = JSON.parse(resp.getContentText());
        const result = json.chart && json.chart.result && json.chart.result[0];
        if (result && result.meta) {
          const meta = result.meta;
          const curPrice = meta.regularMarketPrice;
          const prevClose = meta.chartPreviousClose || meta.previousClose;
          const change = curPrice && prevClose ? parseFloat((curPrice - prevClose).toFixed(2)) : 0;
          const changePct = prevClose ? parseFloat(((change / prevClose) * 100).toFixed(2)) : 0;

          if (curPrice !== undefined && curPrice !== null) {
            return {
              symbol: cleanSym,
              ticker: ticker,
              price: curPrice,
              previousClose: prevClose,
              change: change,
              changePct: changePct,
              currency: meta.currency || "TWD"
            };
          }
        }
      }
    } catch (e) {
      // 嘗試下一個 suffix
    }
  }

  return null;
}
