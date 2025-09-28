---
title: Typescript 中的 as const
date: 2025-09-28
summary: as const 是 TypeScript 3.4 引入的一項功能，稱為 const assertion...
category: 前端
tags: [typescript]
---

`as const` 是 TypeScript 3.4 引入的一項功能，稱為 const assertion（常數斷言）。

預設情況下，TypeScript 會將字面量擴寬成較寬泛的類型，例如：

```ts
const color = “red”;
// color 的型別為 string，而不是字面量類型 “red”
```

使用 as const 後，型別會被鎖定為字面量：

```ts
const color = “red” as const;
// color 的型別為字面量類型 “red”
```

這可用於提高型別的精準度與安全性。

## as const 的三大特性

### 阻止型別擴寬（Prevent Type Widening）

```ts
const status = “success” as const;
// status 的型別是字面量 “success”
```

不使用時，status 會是 string，有 as const 才保持字面量型別。

### 將陣列轉成 readonly tuple

```ts
const tuple = [1, 2, 3] as const
// tuple 的型別是 readonly [1, 2, 3]
```

一般陣列會變成 number[]，使用 as const 後固定長度與元素值。

### 將物件屬性轉成 readonly 且屬性值為字面量

```ts
const config = { mode: “production”, debug: false } as const;
// config 的型別是 { readonly mode: “production”; readonly debug: false }
```

## as const 的實用場合

用於狀態列舉（Enum-like）型別

```ts
const statuses = [“success”, “error”, “loading”] as const;
type Status = typeof statuses[number];
// Status = “success” | “error” | “loading”
```

這種寫法可避免寫真正 enum，方便且型別安全。

## 常見問題

Q: const 與 as const 差在哪？

- const 是 JavaScript 的變數宣告，保證不能被重新賦值。
- as const 是 TypeScript 的型別斷言，讓值保持字面量型別且變為 readonly。

Q: 執行時能保證不被修改嗎？

- `as const` 僅作用於編譯時型別，執行時不會自動凍結物件。
- 如需執行時保護，需搭配 Object.freeze。

Q: 能用於函式回傳嗎？

- 可以，特別是需要回傳物件或陣列且保持精確型別時非常常用。
