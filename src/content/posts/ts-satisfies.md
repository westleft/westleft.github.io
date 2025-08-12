---
title: Typescript 中的 satisfies
date: 2025-08-12
summary: TypeScript 自 4.9 起引入了 satisfies 運算子，它能夠在保持變數精確推斷類型的同時，又強制檢查值符合指定型別。這避免了傳統標註或 as 斷言可能導致的過度寬鬆或錯誤隱藏問題...
category: 前端
tags: [javascript]
---

# satisfies

TypeScript 自 4.9 起引入了 `satisfies` 運算子，它能夠在保持變數精確推斷類型的同時，又強制檢查值符合指定型別。這避免了傳統標註或 as 斷言可能導致的過度寬鬆或錯誤隱藏問題。

- `satisfies` 檢查值是否符合某型別，但不強制變數型別為該型別，而是保留「最窄的推論型別」。
- 與傳統型別標注或 `as` 斷言相比，`satisfies` 提供更安全、精確的型別檢查方式。

## 為什麼要使用 satisfies？（Why use satisfies）

1. 當你用 satisfies，推論出的型別僅限實際物件的屬性，而不會用廣泛的型別覆蓋。例如 routes 物件仍然記住確切的 key 而不是 `Record<string, {}>`。
2. 編譯器會檢查物件是否真的滿足型別要求，若缺少屬性或值型別錯誤即報錯，例如 typo、數值型別不符等。

## 如何使用 satisfies？

```ts
interface User {
  name: string
  age: number
}

const user = {
  name: 'Alice',
  age: 30,
  email: 'alice@example.com',
} satisfies User
// 同時保留 email 屬性推論，name 與 age 檢查正確
```

### 配合 Utility Types（Record、Partial）

若漏寫屬性或型別錯誤，即能被即時偵測。

```ts
type Keys = 'id' | 'name' | 'email'

const person = {
  id: 1,
  name: 'Jack',
  email: 'jack@example.com',
} satisfies Record<Keys, string | number>
```

### 推論 tuple 而不是簡陣列

讓 TypeScript 判斷為固定長度的 tuple，超出 index 即報錯。

```ts
type Tuple3 = [number, number, number]

const arr = [1, 2, 3] satisfies Tuple3
```

### 強型別參數或 POST body 結構

缺少 body 就會報錯，確保 API 關鍵欄位完整性。

```ts
type Params = {
  title: string
  body: string
}

fetch('/api', {
  body: JSON.stringify({
    title: 'HI',
    content: '…',
  } satisfies Params),
})
```

## satisfies 無法取代所有型別標注

在運行時需要強制斷言特定型別（如使用 `document.querySelector` 取 DOM 元素時），還是得使用 `as`，而不是 `satisfies`。因為 `satisfies` 是編譯時用來檢查靜態資料結構是否符合型別，而不是做型別轉換。

```ts
const el = document.querySelector('#my-input') as HTMLInputElement

// 如果你不加 `as`，TS 會推斷 el 的型別是 `Element | null`，你就不能使用 el.value
el.value = 'Hello'
```

> `satisfies` 只能用在「宣告變數的同時」，且對「靜態結構」檢查型別正確性。

例如以下會錯誤，因為右邊是一個執行結果（function call expression），而非物件字面值。

```ts
const el = document.querySelector('#my-input') satisfies HTMLInputElement
// Error: 'satisfies' can only be used in a declaration context.
```

## : 與 satisfies 如何選擇？

若你希望變數型別保持較寬鬆以便後續重新賦值（如 union 容許多種型別），用 `:` 比較好；若你想讓型別精確反映初始值並強制檢查，就選 `satisfies`。

### : 的情境

這邊我們直接使用型別標註 : Theme，這讓 theme 是一個寬鬆的變數，可以重複賦予多種值（這是我們希望之後還能變更的情況）。

```ts
type Theme = 'light' | 'dark' | 'system'

const config: { theme: Theme } = {
  theme: 'light',
}

config.theme = 'system'
```

### satisfies 的情境

這裡 config.theme 的型別是 `light`，`satisfies` 保留了最窄字面量型別（Literal Type）。不能把 config.theme 改成 `dark`，除非你直接改 config 的值。

```ts
type Theme = 'light' | 'dark' | 'system'

const config = {
  theme: 'light',
} satisfies { theme: Theme }

// 錯誤：Type '"system"' is not assignable to type '"light"'.
config.theme = 'system'
```

---

satisfies 是一個非常實用的工具，適合用在設定檔、配置物件、API 模型等場景：它能強制檢查結構正確性，同時保有最窄的推論型別。
