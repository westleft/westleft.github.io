---
title: 上架 Google Extension 的那些事
date: 2025-07-21
summary: '最近不知道哪根筋不對，突然想寫寫看 Google Extension，因為認知上跟寫前端差不多，只要搞懂運作原理跟 API 就好，實際上開發起來也跟想像的差不多。'
category: 前端
tags: [other]
---

最近不知道哪根筋不對，突然想寫寫看 Google Extension，因為認知上跟寫前端差不多，只要搞懂運作原理跟 API 就好，實際上開發起來也跟想像的差不多。

這邊就不講開發相關的東西，說說「上架流程」和遇到的事情。

## 先付 5 美金

在本地開發的話，只要環境搞一搞，在擴充功能畫面上點選「載入未封裝項目」就好，但是如果要把擴充功能上架到商店，必須要先支付 5 美金的一次性費用，否則沒辦法進入下個階段。

![](https://i.meee.com.tw/jZX0RJD.png '支付 $5 美元的註冊費用')

不管要在 Google Play 或是 Apple Store 上架 APP 都要支付費用，才 5 美這點算是合理，相比 Apple Store 的開發者帳號是每年需要支付 3,000 台幣，這已經算是很便宜了。

## 二階段認證

我的帳號一直都沒有開二階段驗證，但如果不開就沒辦法送審，也必須要確實填寫「聯絡電子郵件地址」等，這在之後如果有問題都會透過信件聯絡。

設定的位置在 Google 帳號 > 安全性 > 兩步驟驗證

有設定的話就會跟下圖一樣，按鈕是停用：

![](https://i.meee.com.tw/7Ewa1Ce.png '兩步驟驗證')

## 要求權限的理由

下圖可以看到，如果你的擴充功能有用到某些功能，例如 [ActiveTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab?hl=zh-tw)、[contextMenus](https://developer.chrome.com/docs/extensions/reference/api/contextMenus?hl=zh-tw) 等功能的話，在申請時必須要填寫理由。

![](https://i.meee.com.tw/V9FnooJ.png '要求權限的理由')

他上面有提到「由於你的擴充功能要求取得網站存取權限，因此可能必須接受深入審查，這會造成發布作業延遲。」我申請到通過的天數大約 4 天左右，比預估的還要快，但我的擴充功能只上架在台灣，不確定地區一多是否會變慢。

## 隱私權

如果想要搜集使用者資料如下圖：

![](https://i.meee.com.tw/fvcfNrI.png)

必須提供隱私權政策，然後他隱私權政策只能放網址，意思就是你要自己搞個網站出來放隱私權政策。

當然如果不需要這麼詳細的使用者資料，只是想看安裝次數等資料，其實在選單左邊的 Analytics 就可以看到，內容有曝光次數、評價、解除安裝等資訊。

另外如果成功發佈後，在左邊選單的商店資訊中，就可以開啟 Google Analytics4 的功能：

![](https://i.meee.com.tw/L77DxrH.png)

點進去就會自己建立出資源了。

## 上架或更新

只要發送申請，通過或失敗都會收到信件（可以在設定中開啟關閉），如下圖：

![](https://i.meee.com.tw/iSnXLSB.png)

像我自己是設定全開，使用者如果評論我的 extension 也會在信箱中收到。
