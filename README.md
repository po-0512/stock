# TradeLog — 投資行為分析系統

個人台股投資行為紀錄、損益管理與行為分析系統。

## ✨ 功能特色

- **☁️ Google 表格雲端備份與還原**：串接個人 Google 試算表（Google Sheets），一鍵備份所有買賣紀錄、交易理由與行為標籤，支援跨裝置同步還原。
- **⚡ 台股即時／盤中現價自動串接**：支援台灣上市（.TW）與上櫃（.TWO）股票與 ETF（如 2330、2449、6274、009816、0050），即時抓取最新成交價、漲跌金額與漲跌幅，自動換算未實現損益與最新市值。
- **📈 資產趨勢與總覽折線**：支援市值、成本、未實現損益、已實現損益個別檢視與多線對比。
- **未實現損益分析**：圓餅圖視覺化獲利／虧損市值占比與即時部位明細。
- **已實現損益分析**：支援今日、三日、一週、一個月與自訂時間範圍，搭配損益圓餅圖與交易對帳明細。
- **策略分析**：自動將交易依持有時間配對分類為當沖、隔日沖、波段，分析個別勝率與均 ROI。
- **行為 × 績效分析**：追蹤追高、抄底、突破交易、情緒交易、紀律交易等行為標籤對損益之影響。
- **投資績效計算**：支援年化報酬率與投資周轉率試算。
- **持股佔比圖表**：莫蘭迪配色甜甜圈圖與歷史交易流水帳。
- **交易日曆**：以月曆形式檢視每日交易損益與明細。
- **純前端 + Serverless 設計**：本地以 LocalStorage 運作，雲端透過 Google Apps Script (GAS) Web App 串接，隱私安全無負擔。

---

## 🌐 相關連結

* **線上體驗（GitHub Pages）**：👉 **[https://po-0512.github.io/stock/](https://po-0512.github.io/stock/)**
* **Google 試算表雲端資料庫**：👉 **[TradeLog 投資帳本](https://docs.google.com/spreadsheets/d/13XYZGJegldlPg8aay3acuEx2hucx5Ty0DND38H1DgCI/edit)**
* **Google Apps Script 後端 API**：`https://script.google.com/macros/s/AKfycbyqrFdcMSUXmnADR4QFk3cYItHuHMRav0jaXd1cf59y8TI0lhovdVroqLhJnFwSaud6yw/exec`
