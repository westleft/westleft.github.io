---
title: 練習 TS 中的 class
date: 2022-10-11
---

# 練習 TS 中的 class

因為對於 `class` 還是有點陌生，所以再花個篇幅把 `class` 摸熟一點。

開始之前要先了解物件導向 OOP 有兩種類型，基於類別 (class-based) 以及基於原型 (prototype-based) ，JS 屬於基於原型的語言。

另外 class 在 JS 中只是語法糖。

## 基本寫法
使用關鍵字 `class` 建立類別後，再用 `new` 建構出來。
直接看例子：

```ts
class Department {
    name: string;

    constructor(n: string){
        this.name = n
    }
}

const accounting = new Department('accounting');
```

使用 `new` 建立新的物件時，所執行的函式稱為建構式。用來初始化物件以及建立初始化屬性。

上方程式碼中的 `constructor` 稱為建構子，可以透過傳入不同的參數建立出不同的 `Instance`。

當然我們可以在 `class` 中建立函式並呼叫：

```ts
class Department {
    name: string;
    employees: string[] = []

    constructor(n: string){
        this.name = n
    }

    addEmployee(){
        // 略...
    }
}

const accounting = new Department('accounting')
accounting.addEmployee() // 呼叫函式
```

## private

我們把上面的 code 改一下，使用 `addEmployee` 函式就可以新增員工。

```ts
class Department {
    employees: string[] = []

    addEmployee(employee: string){
        this.employees.push(employee)
    }
}

const accounting = new Department()
accounting.addEmployee('Tim') // 新增員工 'Tim'
```

但這邊會有個問題，因為你可以用下面的方法新增員工：

accounting.employees[2] = 'Peter' // 好像哪裡怪怪的?
所以我們可以使用 private 關鍵字，讓外部無法訪問。這代表只能透過 addEmployee 來新增員工。

```ts
class Department {
    private employees: string[] = []

    // 略...
}
```

## public
為什麼能像一開始就訪問 `class` 中的屬性，因為它是 `private` 的相反： `public`。

```ts
class Department {
    public employees: string[] = []

    // 等同於下面
    employees: string[] = []
}
```

`class` 中的 `Property` 預設都是 `public。`

## constructor 簡短寫法
原本的寫法如下：

```ts
class Department {
    id: string;

    constructor(id: string){
        this.id = id
}
```

簡短寫法改成：

```ts
class Department {
    constructor(private id: number, public gg: string){
        // ...
    }
}
```

這種寫法見仁見智，個人覺得上面還是比較清楚一些。

## readonly
`readonly` 能確保我們在 `class` 中的值是僅可讀、不可修改。

```ts
class Department {
    private readonly id: string
    constructor(id: string){
        this.id = id
    }

    changeID(){
        this.id = "123" // error
    }
}

const accounting = new Department('1012')
```

## extends 繼承

接著來繼承上面的 `Department：`
基本寫法如下：

```ts
class Department {
    private id: string;
    constructor(id: string){
        this.id = id
    }
}

// 繼承 Department
class ITDepartment extends Department {
    constructor(id: string){
        super(id)
    }
}

const itDepartment = new ITDepartment("2")
```

注意 `super` 等同於父 `class` 的 `constructor`。

## protected
當我們使用繼承時，如果想讓子類別能讀取到父類別的值，可以使用 `protected`

```ts
class Department {
    id: string;
    
    // 使用 protected 
    protected employees: string[] = ['Peter'] 
    constructor(id: string){
        this.id = id
    }
}

class ITDepartment extends Department {
    constructor(id: string){
        super(id)
    }

    // 這邊能讀取父類別的 employees
    printEmployees(){
        console.log(this.employees)
    }
}
```

可以嘗試將 `protected` 改成 `private` 就會發生錯誤。

## abstract 抽象類別

繼承時我們往往會想要子類別一定要新增某個屬性，這時候可以使用 `abstract`。

```ts
abstract class Department {
    // 略 ...

    // 繼承的子類別一定要有這個
    abstract printHello(): void
}

class ITDepartment extends Department {
    // 略 ...

    printHello(): void{
        console.log("Hello")
    }
}
```

需要注意的是父類別前方要加關鍵字 abstract，且這個父類別沒辦法再使用 `new` 建構出來。

```ts
abstract class Department {
    // 略 ...
    abstract printHello(): void
}

const Ddpartment = new Department(); // error
```

## static

使用 static 可以不先 `new` 一波就能使用。

```ts
class Department {
    // 略 ...

    static printHello(){
        console.log("Hello")
    }
}

// 直接使用 static 的 function
Department.printHello()
```

這篇文寫到約 3/4 的時候，發現 神Q超人大大已經在 2019 年寫過類似的文章，而且內容幾乎跟這篇一模一樣，讓我覺得自己好像在抄襲 XD，因為文章更完整啊啊啊啊啊啊啊！

如果有興趣的請服用下面的參考資料！

## 參考資料
* TypeScript | 從 TS 開始學習物件導向 - Class 用法
* 類別- TypeScript 新手指南 - GitBook
