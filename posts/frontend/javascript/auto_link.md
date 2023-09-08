---
title: 聊天室增加超連結
date: 2023-09-08
tag: 前端
---

# 聊天室增加超連結

最近在開發公司專案的時候，有個需求是需要在聊天室增加超連結，就是輸入完網址後，這個網址是要可以點擊的。

網路上大部分的方法是用 bbcode、或是 Markdown 來處理，或是直接用套件避免 XSS 攻擊的發生。

我使用的方法是使用正則表達式判斷後，再用 `document.createElement("a")` 和 `appendChild` 的方法將超連結插入。

因為這個功能感覺頗常見，之後應該會用在其他地方，所以我直接在 Vue 中封裝成 `directive`。

## 建立 `directive`

直接去看官網文件 [Custom Directive](https://vuejs.org/guide/reusability/custom-directives.html#directive-hooks)，有詳細的解說。

下面建立一個名為 `auto-link` 的指令，先上程式碼：

```javascript
const hyperlinkRegex = /(https?:\/\/[^\s]+)/;
function containsHyperlink(str) {
  return hyperlinkRegex.test(str);
}

app.directive("auto-link", {
  created(el, binding) {
    // 包含超連結的文字
    if (!containsHyperlink(el.textContent)) return;

    const splitText = el.textContent.split(hyperlinkRegex);
    
    el.textContent = ""; // 清空元素的文本内容
    
    splitText.forEach(text => {
      if (containsHyperlink(text)) {
        const link = document.createElement("a");
        link.href = text;
        link.textContent = text;
        link.target = "_blank";
    
        el.appendChild(link); // 使用 appendChild 添加超链接元素
      } else {
        const textNode = document.createTextNode(text);
        el.appendChild(textNode);
      }
    });
  }
})
```

## 這段糞 code 的邏輯是這樣：

1. 使用 `v-auto-link` 取得 `textContent`

```vue
<p v-auto-link>Hello World</p>
```

2. 使用 `split` 將 `textContent` 的內容切開，以正則表達式為基準 `/(https?:\/\/[^\s]+)/`

所以字串「Hello world https://google.com」會切成 ["Hello world ", "https://google.com"]

3. 跑迴圈將內容加到原本的 DOM

首先把原本的 `textContent` 清空，接著判斷之後的元素是不是超連結，如果是超連結的話，新增一個 a tag 並插入到原本的 DOM。

```javascript
const link = document.createElement("a");
link.href = text;
link.textContent = text;
link.target = "_blank";

el.appendChild(link);
```

如果不是超連結的話，直接插入文字就好 :

```javascript
const textNode = document.createTextNode(text);
el.appendChild(textNode);
```