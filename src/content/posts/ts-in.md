---
title: Typescript 中的 in
date: 2025-09-11
summary: 在 JavaScript 裡，in 常被拿來判斷物件是否有某個屬性...
category: 前端
tags: [typescript]
---

在 JavaScript 裡，in 常被拿來判斷物件是否有某個屬性，例如：

```ts
if ('name' in user) {
  console.log(user.name)
}
```

## in 在 Mapped Types 中的使用

TypeScript 的 in 可以用來建立 Mapped Type（對每個 key 做型別變換）：

```ts
type Person = {
  name: string
  age: number
}

type ReadonlyPerson = {
  readonly [K in keyof Person]: Person[K]
}
// 相當於：{ readonly name: string; readonly age: number }
```

## 動態生成型別

in 也可以搭配字串聯集動態建立型別：

```ts
type Keys = 'id' | 'title' | 'done'

type Todo = {
  [K in Keys]: string
}
// 結果為：{ id: string; title: string; done: string }
```

這用法在從外部資料（例如 API schema）動態產生型別時特別實用。

## 結合條件型別

也可以搭配條件型別來根據 key 的條件做不同處理：

```ts
type Keys = 'id' | 'title' | 'done'

type FieldTypes = {
  [K in Keys]: K extends 'done' ? boolean : string
}
// 結果：{ id: string; title: string; done: boolean }
```

## 用 in 建立所有可能的物件結構

可以搭配泛型與條件型別，產生結構更彈性的物件型別：

```ts
type Options<T extends string> = {
  [K in T]: {
    label: string
    value: K
  }
}

type Status = Options<'draft' | 'published' | 'archived'>
/*
{
  draft: { label: string; value: 'draft' },
  published: { label: string; value: 'published' },
  archived: { label: string; value: 'archived' }
}
*/
```

## ⚠️ 常見陷阱：in 無法保證物件存在某 key

別搞混 JS 中的 runtime in 與 TS 中的 type-level in。
前者是執行階段的操作，後者純粹是型別結構的映射。

```ts
// 錯誤地以為這樣能保證 key 存在
function get<T, K extends string>(obj: T, key: K) {
  if (key in obj) {
    // 這裡 TS 其實不知道 obj[key] 存在
    return obj[key] // 錯誤：T 上不保證有 key 屬性
  }
}
```

因為 `string` 型別太寬了，可以改成：

```ts
function get<T extends Object, K extends keyof T>(obj: T, key: K)
// ...
```

---

- 使用 in 搭配 keyof 是設計物件型別變換的強大工具
- Mapped Types 是打造 reusable 型別邏輯（如：DeepPartial<T>）的基礎
- 避免混淆 runtime 的 in 和型別層級的 in，它們語法相同但意圖不同
