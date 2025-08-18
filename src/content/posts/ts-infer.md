---
title: Typescript 中的 infer
date: 2025-08-18
summary: infer 的作用是：在條件型別中，讓 TypeScript 推導出某個型別的一部分，並給它一個名稱...
category: 前端
tags: [typescript]
---

`infer` 的作用是：

> 在條件型別中，讓 TypeScript 推導出某個型別的一部分，並給它一個名稱。

可以想像成 TypeScript 正在對你說：「你給我一個型別，我來比對一下是不是某個模式。如果是，那我就從裡面幫你推測出某個子型別。」

```ts
type Box<T> = { value: T }

// 我要寫一個型別工具，幫我把 T 拿出來
type Unbox<T> = T extends Box<infer U> ? U : never
```

接著帶入：

```ts
type A = Unbox<Box<string>> // A 是什麼？
```

我們把 `Box<string>` 套進 `Unbox<T>`：

- T 是 `Box<string>`
- 套進 `T extends Box<infer U>` → 成立，因為型別對得起來
- 所以 infer U 這裡就等於 string
- 整個結果就會回傳 U，也就是 string

反之如果這邊傳進去的不是 `Box<T>` 的話，就會回傳 `never`。

## 換個實例

先來定義函式型別：

```ts
type Fn = (a: number, b: string) => boolean
```

再來寫一個型別工具，把回傳值 boolean 拿出來：

```ts
type Return<T> = T extends (...args: any[]) => infer R ? R : never
```

這代表如果 T 是「某種函式」，我就把它的「回傳型別」抓出來叫做 R。

```ts
type A = Return<Fn> // A 是 boolean
```

## infer 只能用在條件型別中

正確用法必須在 `extends ... ? ... : ...` 條件型別裡面才行。

```ts
type Wrong = infer T // ❌ 不能這樣寫
```

## infer 不只能用一次，也可以用多次！

可以在同一個型別裡用多個 infer，推導多個參數型別。

```ts
type ExtractParams<T> = T extends (a: infer A, b: infer B) => any ? [A, B] : never

type Fn = (id: number, name: string) => boolean
type Params = ExtractParams<Fn> // [number, string]
```
