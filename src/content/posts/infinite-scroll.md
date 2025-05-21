---
title: 關於無限載入的二三事
date: 2025-05-21
summary: infinite scroll 是非常常見的一個功能，舉凡 Dacrd、Facebook、或是電商平台都可以看到他的身影...
category: 前端
tags: [javascript]
---

infinite scroll 是非常常見的一個功能，舉凡 Dacrd、Facebook、或是電商平台都可以看到他的身影。

## scroll event

[scroll event](https://developer.mozilla.org/en-US/docs/Web/API/Document/scroll_event) 是在判斷是否加載更多資料的選項之一。

```js
addEventListener('scroll', (event) => {})
```

但因為會頻繁觸發事件，通常會搭配 `debounce` 來服用。另外一點麻煩的地方，就是需要去計算在哪個高度時觸發，要自己實作是稍嫌麻煩了點。

## intersectionobserver

[intersectionobserver](https://developer.mozilla.org/zh-CN/docs/Web/API/IntersectionObserver) 是製作無限載入的不二人選，該功能可以在目標元素與 viewport 交集時觸發事件，同時涵蓋監聽多個目標、放大或縮小範圍等屬性能控制。

```js
const options = {
  root: document.querySelector('#scrollArea'),
  rootMargin: '0px',
  threshold: 1.0,
}

const observer = new IntersectionObserver(callback, options)
```

像是 react-use 和 vue-use 都有將 intersectionobserver 二次封裝，讓開發者能更方便調用：

- [React-use 的 useIntersectionObserver](https://www.reactuse.com/element/useIntersectionObserver)
- [Vue-use 的 useIntersectionObserver](https://vueuse.org/core/useIntersectionObserver/)

```js
// Vue-use 的範例
const { stop } = useIntersectionObserver(target, ([entry], observerElement) => {
  targetIsVisible.value = entry?.isIntersecting || false
})
```

## virtual scroll

載入一定的資料後，頁面上的 DOM 一定會越來越多，大量的元素可能會造成網頁卡頓、渲染速度也會跟著降低，這時候 `virtual scroll` 就扮演著重要的角色。

`virtual scroll` 也被稱為 `virtual list` 或 `windowing`，指的是只渲染出 viewport 上的元素，當元素離開視線外則不進行渲染，所以不會有大量 DOM 存在的問題。

```js
// vueuse 的 useVirtualList
import { useVirtualList } from '@vueuse/core'

const { list, containerProps, wrapperProps } = useVirtualList(
  Array.from(Array.from({ length: 99999 }).keys()),
  {
    // Keep `itemHeight` in sync with the item's row.
    itemHeight: 22,
  },
)
```

通常 `virtual scroll` 都會搭配無限滾動來服用，因此不少套件其實都有延伸出這功能，像是 `react-window` 另一個系列的 [react-window-infinite-loader](https://www.npmjs.com/package/react-window-infinite-loader)。

## Skeleton

Skeleton 就屬於 UIUX 的範疇了。一般在網頁上如果正在等待資料載入時，通常會使用 Skeleton 佔版，也能告訴使用者這目前是 loading 狀態。如果在無限載入的時候其實也可以直接將 Skeleton 放在最底，在交集的時候就載入更多資料。

![naive ui Skeleton](https://i.meee.com.tw/ovqTCiu.png '圖片取自 naive ui')
