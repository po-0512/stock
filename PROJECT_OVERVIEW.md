# TradeLog 投資行為分析系統 — 專案總覽與技術文件
**Project Overview & Technical Documentation**

---

## 一、 專案核心概念 (Project Concept)

**TradeLog** 是一套專為台灣股市獨立投資人量身設計的**無伺服器（Serverless）個人化交易日誌與行為量化分析系統**。

在金融市場中，多數投資人並非輸在專業知識匱乏，而是輸在**缺乏紀律、情緒化決策（追高殺跌、凹單不認賠）以及混亂的資產紀錄**。TradeLog 的核心哲學是：

> **「凡無法衡量者，便無法管理；凡無法記錄者，便無法精進。」**

TradeLog 將純前端單頁應用（SPA）的高效流暢性，與 Google 雲端生態系（Google Apps Script + Google Sheets）深度結合，提供**零維護成本、100% 隱私掌控、盤中即時報價連線、深度行為評估**的現代化投資管理體驗。

![系統總覽與即時損益儀表板](scene_pnl.png)

---

## 二、 解決的市場痛點 (Problems Solved)

傳統投資人在記錄與檢討交易時，普遍面臨以下四大致命痛點：

| 傳統投資痛點 | 傳統工具缺陷 (券商 App / Excel / 市售軟體) | TradeLog 解決方案 |
| :--- | :--- | :--- |
| **1. 資訊零碎與歷史盲區** | 券商軟體多僅提供單日或單一帳戶損益，無法跨券商統計；更換券商後歷史交易紀錄斷層丟失。 | **統整跨帳戶資產**：單一介面彙整全部買賣決策，歷史紀錄完整保存，隨時依日期、標的與策略交叉比對。 |
| **2. 傳統表格無即時行情** | Excel / Google 表格手動輸入繁瑣，無法自動即時反映台股盤中最新撮合價與未實現損益。 | **台股即時盤中連線**：自動辨識上市（TWSE）與上櫃（TPEx）代號，盤中一鍵刷新股票現價，損益即時動態跳動。 |
| **3. 缺乏行為檢討與紀律回測** | 僅記錄賺賠金額，卻無法統計「停損執行率」、「持股天數偏好」、「衝動下單比例」等核心心理盲點。 | **行為評估矩陣**：數據化量化賺賠比、期望值、勝率分佈，並內建策略遵守度與情緒影響評分，破除人性弱點。 |
| **4. 隱私外洩風險與高昂訂閱費** | 市售雲端記帳軟體需按月付費，且個人敏感投資持股資料被迫存放於第三方廠商伺服器，資安隱憂大。 | **100% 資料自主權**：採用個人 Google 試算表作為專屬雲端資料庫，無任何第三方中繼資料庫，完全免費且安全無虞。 |

---

## 三、 系統架構與運作機制 (Architecture & Data Flow)

TradeLog 採用全自主、輕量無伺服器的現代架構設計：

```mermaid
flowchart TD
    subgraph Client ["用戶端 (Client Browser)"]
        UI["使用者介面 (SPA Web App)<br/>GitHub Pages 託管"]
        LocalStorage[("本機快取 (LocalStorage)<br/>交易紀錄 / 報價快取 / 偏好")]
        UI <--> LocalStorage
    end

    subgraph Cloud ["雲端後端 (Personal Cloud Backend)"]
        GAS["Google Apps Script (Web App API)<br/>安全無伺服器微服務"]
        Sheet[("Google Sheets 投資帳本<br/>個人私有雲端資料庫")]
        GAS <--> Sheet
    end

    subgraph External ["外部數據服務 (Market Data)"]
        Yahoo["即時金融報價 API<br/>Yahoo Finance (TWSE / TPEx)"]
        GAS -->|查詢盤中股價| Yahoo
    end

    UI -->|1. 備份/還原 (HTTP POST/GET)| GAS
    UI -->|2. 抓取即時報價 (HTTP GET)| GAS
```

### 運作架構特色：
1. **極速前端體驗**：核心介面採用純原生的 HTML5 / CSS3 / Vanilla JS 打造，單檔部署於 GitHub Pages，載入速度 < 0.3 秒，無肥大框架負擔。
2. **雙軌儲存機制**：平時操作所有交易數據即時寫入瀏覽器 `LocalStorage`，秒開即用；需要跨裝置同步或永久留存時，一鍵備份至個人的 Google 試算表。
3. **無伺服器微服務**：以 Google Apps Script 扮演安全 API Gateway，不僅負責試算表資料的讀寫序列化，亦負責抓取與快取台股即時行情。

---

## 四、 核心功能模組與實機畫面 (Key Features & Screenshots)

### 1. 總覽與未實現損益儀表板 (Portfolio & Unrealized PnL)
* **核心功能**：即時計算所有在倉持股的總市值、未實現損益金額、整體報酬率以及已實現獲利。
* **介面特色**：黑底終端風格，以高辨識度磨砂金與盈虧色彩（紅色獲利 / 綠色虧損）標記關鍵數字；點擊頂部數值可立即展開持股損益明細彈窗。

![系統總覽與損益儀表板](scene_pnl.png)

---

### 2. 台股盤中即時報價連線 (Real-Time Stock Quotes)
* **核心功能**：
  * 自動判斷台股標的市場歸屬：上市公司自動對應 `.TW`（如 `2330.TW` 台積電）、上櫃公司自動對應 `.TWO`（如 `6488.TWO` 環球晶）。
  * 在「持股」頁面點擊 **⚡ 報價** 按鈕，系統即刻發起背景查詢，並回傳漲跌幅、漲跌點數與最新現價。
  * 支援設定「開啟網頁時自動抓取最新現價」，持股市值隨盤勢同步更新。

![持股明細與即時盤中報價](scene_holdings.png)

---

### 3. 交易行為與勝率量化分析 (Behavioral Analytics)
* **核心功能**：
  * **勝率與獲利品質分析**：精確統計交易勝率、盈虧比（Profit Factor）、單筆最大獲利與最大虧損。
  * **持股週期統計**：分析當沖、隔日沖、波段（1~4 週）與長線投資的賺賠效率，找出最適合個人性格的獲利週期。
  * **深度決策評分**：提供進場理由確認、停損紀律遵循、加碼時機檢驗等多維度行為打分。

![交易行為與勝率量化分析](scene_analytics.png)

---

### 4. Google 試算表雲端同步與備份 (Google Sheets Cloud Integration)
* **核心功能**：
  * **一鍵備份**：將本地所有交易紀錄、客製化現價覆寫設定推送到雲端試算表。
  * **一鍵還原**：更換新手機或新電腦時，貼上 Web App 網址即可完整拉回所有歷史帳本。
  * **自動建表機制**：後端腳本具備自我初始化功能，若試算表未建立，自動產生「TradeLog 投資帳本」及相應的欄位表頭（交易編號、日期、股票代號、買賣別、成交價、股數、手續費等）。

![Google 試算表雲端備份設定面板](scene_cloud.png)

---

### 5. 策略紀律與月份日曆檢視 (Discipline & Calendar Matrix)
* **核心功能**：
  * 以月份日曆形式可視化每日獲利與虧損金額。
  * 透過顏色深淺直觀評估每日操作頻率與心理負擔，協助投資人辨識「過度交易（Overtrading）」的高風險交易日。

![決策深度分析與日曆評估](scene_deep.png)

---

## 五、 技術規格與效能特色 (Technical Specifications)

| 維度 | 技術實作規格 | 設計優勢 |
| :--- | :--- | :--- |
| **前端架構** | HTML5 / CSS3（自適應深色變數）/ Vanilla ES6+ | 零編譯步驟、無 node_modules 膨脹，載入極速 |
| **圖表視覺化** | Chart.js 4.4 | 支援持股佔比環狀圖、損益累積折線圖與互動提示 |
| **後端技術** | Google Apps Script (V8 Runtime) | 伺服器無須維護、免主機月租、自動享有 Google 高可用性 |
| **資料儲存** | 本地 `LocalStorage` + 雲端 `Google Sheets` | 斷網仍可正常操作，聯網一鍵同步備份 |
| **報價連線** | 經由 GAS 端向 Yahoo Finance API 代理請求 | 避免前端跨域 CORS 阻擋，自動辨識台股上市櫃尾碼 |
| **靜態部署** | GitHub Pages (由 `po-0512/stock` 主分支託管) | 全球 CDN 邊緣加速、免伺服器費用、具備 SSL 憑證 |

---

## 六、 快速上手指南 (Quick Start Guide)

> [!TIP]
> 系統已完成線上部署，打開瀏覽器即可直接開始使用！

1. **直接造訪線上版**：
   前往 [TradeLog 線上系統](https://po-0512.github.io/stock/)。
2. **綁定 Google 雲端帳本**：
   * 點擊導覽列右上角的 **☁️ 雲端圖示** 開啟設定。
   * 填入您的 Google Apps Script 網頁應用程式網址：
     ```text
     https://script.google.com/macros/s/AKfycbyqrFdcMSUXmnADR4QFk3cYItHuHMRav0jaXd1cf59y8TI0lhovdVroqLhJnFwSaud6yw/exec
     ```
   * 點擊 **「測試連線狀態」** 確認連線綠燈，即可開啟自動盤中股價更新。
3. **備份與管理**：
   * 點擊 **「立即備份至 Google 表格」**，資料將自動寫入您的 [TradeLog 投資帳本試算表](https://docs.google.com/spreadsheets/d/13XYZGJegldlPg8aay3acuEx2hucx5Ty0DND38H1DgCI/edit)。

---

## 七、 相關專案資源連結

* **線上系統首頁**：[https://po-0512.github.io/stock/](https://po-0512.github.io/stock/)
* **GitHub 專案倉庫**：[`po-0512/stock`](https://github.com/po-0512/stock)
* **後端 Google Apps Script 原始碼**：[`google_apps_script.js`](file:///C:/Users/(0m0)/.gemini/antigravity/scratch/TradeLog/google_apps_script.js)
* **30 秒產品介紹影片**：[`TradeLog_intro_30s.mp4`](TradeLog_intro_30s.mp4)
