---
title: Flutter 筆記
date: 2025-05-30
summary: 久久寫一次 Flutter，專案初始化的時候每次都忘記套件要怎麼用，這篇記錄一下。
category: 前端
tags: [flutter]
---

久久寫一次 Flutter，專案初始化的時候每次都忘記套件要怎麼用，這篇記錄一下。

- flutter_screenutil
- riverpod

## flutter_screenutil

`flutter_screenutil` 能讓 App 根據不同裝置的螢幕尺寸自動縮放尺寸、字體大小、邊距等等，避免在小螢幕上擠在一起、大螢幕上太小的問題。

> 中文文件：[點我](https://github.com/OpenFlutter/flutter_screenutil/blob/master/README_CN.md)

首先安裝 `flutter_screenutil`。

```sh
flutter pub add flutter_screenutil
```

打開模擬器並執行：

```sh
open -a Simulator
```

```sh
flutter run
```

### flutter_screenutil 使用

在 designSize 的地方傳入設計稿尺寸：

```dart
import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      designSize: const Size(375, 812), // 這裡
      builder: (context, child) => const MaterialApp(
        home: CupertinoPageScaffold(
          child: Center(
            child: Text('Hello, World!'),
          ),
        ),
      ),
    );
  }
}

```

### 設定寬高

上面已經設定好了 `Size(375, 812)`，因此如果把元件的寬度指定為 `375.w` 就能達到寬度滿版的狀態，高度同理，如下會得到一個滿版的灰色 `Container`。

```dart

/// 上略 ...

home: CupertinoPageScaffold(
  child: Container(
    width: 375.w,
    height: 812.h,
    color: Colors.grey,
  ),
),

// 下略 ...
```

![](https://i.meee.com.tw/Rld9UWn.png)

如果只是要取得螢幕寬的一半：

```dart
Container(
  width: 0.5.sw,
  height: 812.h, // 高度要改的話 0.5.sh
  color: Colors.grey,
),
```

![](https://i.meee.com.tw/yryvsDh.png)

### 定義設計稿文字大小

設計稿拿到的字體大小直接填入定義：

```dart
class AppFontSizes {
  static final double h1 = 40.sp;
  static final double h2 = 36.sp;
  static final double h3 = 32.sp;
  static final double h4 = 28.sp;
  static final double h5 = 24.sp;
  static final double h6 = 20.sp;

  static final double large = 17.sp;
  static final double medium = 15.sp;
  static final double small = 13.sp;
  static final double extraSmall = 11.sp;
}

// 略 ...

Text(
  'Hello, World!',
  style: TextStyle(fontSize: AppFontSizes.h1),
)

// 略 ...
```

未完...
