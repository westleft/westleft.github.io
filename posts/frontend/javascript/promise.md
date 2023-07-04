---
title: Promise 筆記
lang: en-US
date: 2023-07-03
---

![](https://i.imgur.com/CaH3bOA.jpg)

# Promise 筆記

`Promise` 是 ES6 新增的語法，用來處理非同步行為。`Promise` 會有三種狀態：

* `pending`： 承諾尚未兌現。
* `resolved`： 承諾已履行。
* `rejected`： 拒絕承諾。

而 `Promise` 一旦履行或拒絕後，就不會再改變其狀態。

## 建立 Promise
建構函式 new 一波。

`Promise` 內的 function 會有兩個參數：`resolve` 和 `reject`，分別代表 `Promise` 成功或失敗所要做的事情。

```javascript
const promise = new Promise((resolve, reject)=>{
    resolve("ya")
    reject("no~~")
})
```

::: tip
`resolve` 及 `reject` 的名稱可以自定義，但在開發上大多數開發者習慣維持此名稱。
:::

Chained Promise
上面的例子接著可以使用：

```javascript
promise.then();    // Promise 回傳正確
promise.catch();   // Promise 回傳失敗
promise.finally(); // 非同步執行完畢（無論是否正確完成）
```

then() 可以連接多個，但只要中間失敗，後續的 then() 都不會執行，直接跳到 catch()。

finally 則不需要帶參數，在最後結束時執行。

```javascript
promise
  .then((success) => {
    console.log(success);
    return promise;
  })
  .then((success) => {
    console.log(success);
  })
  .catch((err) => {
    console.log(err);
  }).finally(()=>{
    console.log("finally")
  })
```

## Promise API
看一下 `Promise` 其他方法 :

### Promise.all(iterable)
參數接受陣列，陣列中可放多個 promise。

所有 `promise` 完成後會回傳一個陣列，陣列裝著各個 `promise` 的 `callback`
只要其中一個變成 rejected，則回傳第一個 `rejected` 的 `promise`

### Promise.race(iterable)

參數一樣接受陣列，只要任一個 promise 狀態改變，則回傳該個 promise 的 callback

### Promise.resolve(value)

Promise.resolve() 函數用來將一個物件轉型為 Promise (如果它不是一個 Promise 物件)，然後立刻 resolve 它。

### Promise.reject(reason)

Promise.reject() 函數用來將一個物件轉型為 Promise (如果它不是一個 Promise 物件)，然後立刻 reject 它。

## 參考資料
* JavaScript Promise 全介紹 JavaScript ES6 Promise Object 物件