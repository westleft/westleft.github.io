---
title: 關於擴充套件拿到精選勳章
date: 2025-11-07
summary: 7 月的時候我寫過一篇 上架Google Extension 的那些事，事隔四個月，終於拿到了 Chrome Extension Store 的精選勳章。
category: 前端
tags: [javascript]
---

7 月的時候我寫過一篇 上架 [Google Extension 的那些事](https://seasoning.dev/posts/extension/)，事隔四個月，終於拿到了 Chrome Extension Store 的精選勳章。

![](https://i.meee.com.tw/MUJaOUm.png)

## 成為精選的方式

要拿到精選徽章，有兩個方式：

1. 等到官方自己發現
2. 毛遂自薦，提交申請表單

第一個方式要等到官方發現，你的流量必須要很夠、使用者夠多才有可能被注意到，想我這種小擴充功能要達到這種規模不太可能，所以選擇自己提交申請表單。

> 填寫連結：[https://support.google.com/chrome_webstore/contact/one_stop_support](https://support.google.com/chrome_webstore/contact/one_stop_support)

選擇「我想為自己的擴充功能申請「精選」徽章和商品推薦資格」的選項後，就可以開始寫上自薦的內容了。

## 最佳做法

在自薦之前一定要先看過這篇：[最佳做法](https://developer.chrome.com/docs/webstore/best-practices?sjid=14180092661291716717-NC#design-a-high-quality-extension)，可以說是成為精選的條件都寫在這邊了，包括是不是用 Manifest Version 3、安全性、使用者體驗等項目。

以我的擴充功能為例子，我在申請時詳細解說了為何我用到了 `activeTab`、`contextMenus`、`sidePanel`，為什麼要製作這個擴充功能、這個擴充功能帶給使用者什麼好處、未來的計劃等，同時附上 Github 程式碼連結，表示開源且安全、無惡意程式碼。

## 在申請過後

提交後會在信箱收到一封主旨為「Your Chrome Web Store Self Nomination Request has been created」的信。這邊應該會依照自己選擇的語言有所不同。

![](https://i.meee.com.tw/YvN02hJ.png)

接著就是漫長的等待，我等了一個月後收到符合資格的信。

![](https://i.meee.com.tw/Vy76UUL.png)

不過其實在收到這封信的兩天前，就有發現勳章出現在商店頁面上了，所以信來得比較晚。

## 拿到精選後的變化

拿到勳章後幾天就趕緊打了這篇文章，所以還沒什麼成效，不過可以從下圖的分析看出，在 Nov 4 拿到勳章這幾天，曝光有上升不少，最後邊跌到谷底是因為還沒結算。

![](https://i.meee.com.tw/pRU6OQl.png)

之後再來補充流量跟使用者的變化。

---

這次拿到精選勳章後，我更確定這件事情：當前使用者人數不重要，是否好用且符合最佳做法才是重點。
