---
title: 從零建立 iOS 自動發版：GitHub Actions + fastlane
date: 2026-09-26
summary: '一直都是直接打開 Xcode，並且手動 Archive、Distribute，也沒什麼不行，就是最近越來越懶惰了，於是把它改成比較方便發版的模式...'
category: 前端
tags: [ios, ci, fastlane, expo]
---

[Chordex](https://apps.apple.com/us/app/chordex-guitar-chords/id6797829912) 是一個我用 React Native + Expo 做的 APP，因為這專案也沒跟其他人協作，我一直都是直接打開 Xcode，並且手動 Archive、Distribute，也沒什麼不行，就是最近越來越懶惰了，於是把它改成比較方便發版的模式、順便把 Github Action 一起建立好。

## 我期望的發版流程

因為我只處理 iOS，所以 Android 的各項配置都不在思考範圍。

理想是我在 `package.json` 改完版本，commit 之後打一個 tag 推到遠端，就自動觸發發版流程。整個流程分成三段：

**本機，我要做的只有兩件事**

1. 改 `package.json` 的版本號，commit 並 push
2. 打 tag，例如 `v1.7.2-1`，推到遠端

**接著 GitHub Actions 自動接手**

- push 到 main 時跑 `ci.yml`（ubuntu）：lint、型別檢查、單元測試
- 推上 tag 時跑 `ios-release.yml`（macOS），執行 `bundle exec fastlane ios release`：
  1. 檢查 tag 的版號等於 `package.json`
  2. 向 App Store Connect 確認這個 build number 沒用過
  3. `expo prebuild` 生出 `ios/`
  4. `pod install`
  5. 用 fastlane 的 match 從憑證 repo 拉憑證與 profile
  6. 把專案改成手動簽名
  7. `xcodebuild archive` 產出 `Chordex.ipa`
  8. 上傳到 TestFlight
- 最後建一個 GitHub Release，附上 dSYM

**Apple 那邊**

- build 出現在 TestFlight，處理完就能測試
- 要上架時，到 App Store Connect 的「發佈」分頁選這個 build 送審，跟以前一樣手動

理解後開始動工：

## 第一步：把程式碼放上 GitHub，寫第一個 workflow

先建立 yml 檔，workflow 寫在資料夾的 `.github/workflows/*.yml`

以下是用來每次 push 都跑 lint、型別檢查、單元測試：

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
jobs:
  check:
    runs-on: ubuntu-latest # 這些檢查不需要 macOS，用最便宜的機器
    steps:
      - uses: actions/checkout@v4 # uses = 用別人寫好的動作；這個是把程式碼 clone 下來
      - uses: pnpm/action-setup@v4 # 裝 pnpm，版本讀 package.json 的 packageManager 欄位
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile # run = 直接跑 shell 指令
      - run: pnpm lint
      - run: pnpm exec tsc --noEmit
      - run: pnpm test
```

下面這個才是真正部署用的 yml，裡面有 fastlane 的東西，先別管上車就對了，之後再解釋：

```yaml
# 打 tag（v1.8.0）觸發：跑 fastlane release lane，建置 iOS 並上傳 TestFlight，再建 GitHub Release 附 dSYM。
# macOS runner 分鐘數以 10 倍計費，所以只在 tag 時跑；平常的檢查在 ci.yml。
name: iOS Release

on:
  push:
    tags: ['v*.*.*-*'] # 一律 v1.7.2-1、v1.7.2-2…；沒有 -N 的 tag 不觸發

# 同一時間只跑一個發版，避免 build number 撞號
concurrency: ios-release

permissions:
  contents: write # 建 GitHub Release 需要

jobs:
  testflight:
    runs-on: macos-26
    timeout-minutes: 60
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      # 讀 .ruby-version；bundler-cache 會跑 bundle install 並快取 gems（fastlane、cocoapods）
      - uses: ruby/setup-ruby@v1
        with:
          bundler-cache: true

      # 對齊本機 Xcode 版本；找不到該版本就用 runner 預設的 Xcode 26.x
      - name: Select Xcode
        run: |
          sudo xcode-select -s /Applications/Xcode_26.3.app || echo "Xcode 26.3 不在 runner 上，使用預設版本"
          xcodebuild -version

      # Pod 原始碼下載快取（Podfile.lock 不進版控，所以用 pnpm-lock 當 key）
      - uses: actions/cache@v4
        with:
          path: ~/Library/Caches/CocoaPods
          key: cocoapods-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}
          restore-keys: cocoapods-${{ runner.os }}-

      # tag 格式 v<version>-<build>：v1.7.2-1 → 版本 1.7.2、build 1；同版本補傳就 v1.7.2-2、v1.7.2-3…
      - name: Build and upload to TestFlight
        run: |
          TAG="${GITHUB_REF_NAME#v}"
          VERSION="${TAG%%-*}"
          BUILD="${TAG##*-}"
          [[ "$BUILD" =~ ^[0-9]+$ ]] || { echo "tag 必須是 v<version>-<build>，例如 v1.7.2-1，收到：$GITHUB_REF_NAME"; exit 1; }
          bundle exec fastlane ios release version:"$VERSION" build_number:"$BUILD"
        env:
          ASC_KEY_ID: ${{ secrets.ASC_KEY_ID }}
          ASC_ISSUER_ID: ${{ secrets.ASC_ISSUER_ID }}
          ASC_KEY_CONTENT: ${{ secrets.ASC_KEY_CONTENT }}
          MATCH_PASSWORD: ${{ secrets.MATCH_PASSWORD }}
          MATCH_GIT_BASIC_AUTHORIZATION: ${{ secrets.MATCH_GIT_BASIC_AUTHORIZATION }}

      - name: GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          generate_release_notes: true
          files: build/*.dSYM.zip
```

但為什麼分成兩個 workflow？

因為 iOS 建置只能在 macOS 上跑，而 GitHub 的 macOS runner 以 **10 倍**計費，就是錢的問題，能省則省。

## 第二步：prebuild 之前的確認

一開始建立 /ios 檔案後，我又手動去裡面改了一些東西，App 名稱、語言等設定，所以一旦再次 prebuild 的話可能會導致專案不一致。最後當然就用 AI 幫我 prebuild 後比對兩個檔案，在 `app.config.js` 進行調整。

> 補充一下 Expo 官方推的做法，叫 **CNG（Continuous Native Generation）**，EAS 內部也是這樣做。

比對確認後，真正的問題只剩三項：

**1. entitlements 裡多了一條要刪的：`aps-environment`**

entitlements 是 App 向系統宣告「我要用哪些能力」的清單，這一條代表「我要用 Apple 推播」。

Chordex 只用本機通知、沒有推播伺服器，Apple 後台的 App ID 也沒開推播。但 `expo-notifications` 的 plugin 會自動加這條，簽名時 App 宣告的能力跟 provisioning profile 對不上就會失敗，**以前解法是手動刪掉**的。

現在要跑 CI 所以要寫一個自訂 config plugin，每次 prebuild 自動刪。

**2. Info.plist 裡少了一個要加的：`RCTRootViewBackgroundColor`**

這是 React Native 根畫面的底色，開屏消失到首頁畫完之間會露出這一層，沒設就白閃一下。

`app.config.js` 早就寫了 `backgroundColor`，但 Expo 只在裝了 `expo-system-ui` 時才會寫進 Info.plist。解法是裝這個套件。

**3. Splash 圖片尺寸不同**

新版 expo-splash-screen 會把圖補成正方形，舊版不會。實際看過兩張圖，logo 大小和位置一樣，不用處理。

### 補充：config plugin 是什麼

Expo 在 prebuild 時會依序執行一串「plugin」，每個 plugin 修改原生專案的一部分：改 Info.plist、改 entitlements、加 target 等。套件自帶的 plugin（例如 expo-notifications）會自動套用，我們也可以自己寫一個。

Chordex 的 `plugins/withoutPushEntitlement.js` 就是這樣：

```js
const { withEntitlementsPlist } = require('expo/config-plugins')

module.exports = function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, (c) => {
    delete c.modResults['aps-environment'] // 如同上述一，需要拿掉 expo-notifications 加的 key
    return c
  })
}
```

然後在 `app.config.js` 的 `plugins` 陣列裡加上 `'./plugins/withoutPushEntitlement'`。

```js
// .......
    plugins: [
      // 拿掉 expo-notifications 自動加的 aps-environment（只用本機通知，App ID 沒開推播）
      './plugins/withoutPushEntitlement',
// .......
```

一個容易踩的坑是執行順序：我的 plugin 要在 expo-notifications 加完 key 之後才跑，否則刪不到。查了 config-plugins 的原始碼才確定：套件內建的 plugin 排在使用者 plugin 之後加入鏈，而執行時後加入的先跑，所以使用者 plugin 一定在內建 plugin 之後執行。

寫 plugin 前先確認這件事，不然會不明所以地失效。

### 版號也順便統一

原本 version 散在四個地方（package.json、app.config.js、pbxproj、Info.plist），build number 還互相不一致。改成 CNG 之後只剩一個來源：

```js
// app.config.js
const pkg = require('./package.json')
export default {
  expo: {
    version: pkg.version, // 唯一來源
    ios: {
      buildNumber: process.env.BUILD_NUMBER ?? '1', // CI 透過環境變數傳入
    },
  },
}
```

## 第三步：用 fastlane 把發版流程寫成一條指令

build number、拿憑證、簽名、archive、上傳，每一步都是 Apple 的命令列工具，參數多、錯誤訊息難懂，直接寫在 yml 裡會變成幾十行 shell，在 CI 上除錯每次都要等十幾分鐘，超麻煩，因此使用 [fastlane](https://fastlane.tools/)。

如果不用 fastlane 的話，你會需要做：

- 查 TestFlight 最新 build：自己呼叫 App Store Connect REST API、處理 JWT 簽章
- 把憑證放進 CI 的鑰匙圈：security create-keychain、security import、security set-key-partition-list
- 產生 `provisioning profile`：到 Developer Portal 手動建、下載、放到指定路徑
- 改專案簽名設定：直接編輯 pbxproj
- archive + export：`xcodebuild archive ...` 加 `xcodebuild -exportArchive ...` 加一份 ExportOptions.plist
- 上傳： `xcrun altool`

### fastlane 是什麼

- 一個用 Ruby 寫的工具，把 iOS 發版的每個動作包成可以直接呼叫的函式，名為 **action**。
- 把要做的事寫在專案內的 `fastlane/Fastfile`。這個檔案是一段 Ruby 程式，裡面定義的每一條流程叫 **lane**。

我一開始以為 `fastlane ios release` 這種指令是 fastlane 內建的，其實不是。fastlane 內建的只有**零件**，流程是自己組的：

| 層級       | 誰提供                | 例子                                                                                        |
| ---------- | --------------------- | ------------------------------------------------------------------------------------------- |
| **action** | fastlane 內建，幾百個 | `match`、`build_app`、`upload_to_testflight`、`cocoapods`、`latest_testflight_build_number` |
| **lane**   | 自己寫在 Fastfile     | `release`、`certs`、`prebuild`                                                              |
| **指令**   | 由 lane 的名字決定    | `fastlane ios release` 就是執行叫 `release` 的 lane                                         |

所以 `fastlane ios release` 在這個專案存在，換一個專案不一定有，因為那個專案的 Fastfile 可能取別的名字或根本沒寫。可以類比 npm scripts：`pnpm test` 能跑是因為 package.json 的 `scripts` 裡有一行 `"test": "vitest run"`，`vitest` 是別人提供的工具，`test` 這個名字和它要做什麼是你定的。Fastfile 就是 fastlane 版的 `scripts`，只是能寫的邏輯更多。

這個專案的 Fastfile 有三條 lane：

| lane       | 指令                    | 做什麼                                                                                        | 誰跑                         |
| ---------- | ----------------------- | --------------------------------------------------------------------------------------------- | ---------------------------- |
| `release`  | `fastlane ios release`  | 完整發版：檢查版號 → prebuild → pod install → match 拉憑證 → 簽名 → archive → 上傳 TestFlight | CI 每次打 tag；本機也能跑    |
| `certs`    | `fastlane ios certs`    | 建憑證和 profile，推到憑證 repo                                                               | 本機，一次                   |
| `prebuild` | `fastlane ios prebuild` | 只生 `ios/`，不建置                                                                           | 本機，想檢查 prebuild 結果時 |

最大的好處是**本機與 CI 跑的是同一條 lane**。本機先跑通再上 CI，省掉在 CI 上反覆除錯的時間與費用。

### 安裝

fastlane 是 Ruby 套件，用 `Gemfile` 宣告、`bundle install` 指令安裝，之後一律 `bundle exec fastlane ...` 執行。

確保本機和 CI 同版本。這三個檔案對 Ruby 的角色，等於 package.json、pnpm-lock.yaml、`.nvmrc` 對 Node：

```ruby
# Gemfile
source "https://rubygems.org"
gem "fastlane"
gem "cocoapods", "~> 1.17.0"   # 與現有 Podfile.lock 對齊
```

```
# .ruby-version
3.2.2
```

### release lane 逐段解釋

```ruby
lane :release do |opts|
  # 1. 版號：tag 的版號必須等於 package.json，打錯直接失敗
  pkg_version = sh("node -p \"require('../package.json').version\"").strip
  version = opts[:version] || pkg_version
  UI.user_error!("...") unless version == pkg_version

  # 2. 登入 Apple：CI 無法輸入 Apple ID 密碼與 2FA，改用 API 金鑰
  api_key = app_store_connect_api_key(key_id: ..., issuer_id: ..., key_content: ...)

  # 3. build number：由 tag 的 -N 指定；先查 TestFlight，號碼用過就直接失敗
  latest = latest_testflight_build_number(api_key: api_key, version: version, ...)
  build_number = (opts[:build_number] || latest + 1).to_i
  UI.user_error!("已用過") if build_number <= latest

  # 4. 生出 ios/ 並裝 Pods
  sh("cd .. && CI=1 BUILD_NUMBER=#{build_number} npx expo prebuild --platform ios --clean --no-install")
  cocoapods(podfile: "ios/Podfile")

  # 5. 簽名材料：CI 上開臨時鑰匙圈，從憑證 repo 拉憑證與兩個 profile
  setup_ci
  match(type: "appstore", app_identifier: [APP_ID, WIDGET_ID], readonly: true)

  # 6. prebuild 生出的專案是「自動簽名」（要登入 Apple ID），改成用 match 的 profile 手動簽
  update_code_signing_settings(...)   # 主 App
  update_code_signing_settings(...)   # widget

  # 7. archive + export .ipa
  build_app(workspace: "ios/Chordex.xcworkspace", scheme: "Chordex", export_method: "app-store")

  # 8. 上傳，不等 Apple 處理完（可能數十分鐘），省 CI 時間
  upload_to_testflight(api_key: api_key, skip_waiting_for_build_processing: true)
end
```

1 到 3 是「決定版號」，4 是「生出可編譯的專案」，5 到 6 是「解決簽名」，7 到 8 是「打包上傳」。第 5、6 步是整個流程最難懂的地方，下一步專門講。

`upload_to_testflight` 這個名字容易誤會。它和 Xcode 的 Distribute App → Upload 做的完全一樣：把 ipa 傳到 App Store Connect 的**建置版本池**。build 沒有分「給 TestFlight 的」或「給上架的」，之前用 Xcode 傳的版本也全部列在 TestFlight 頁面裡。差別只在上傳之後要不要送審，那一步照以前一樣到後台的「發佈」分頁手動做

## 第四步：解決簽名

沒有簽名的 ipa，App Store 不收。我們的 Mac 上簽名是 Xcode 自動處理的：登入 Apple ID、勾 Automatically manage signing，它就默默把憑證和 profile 弄好。

runner 上沒有 Apple ID、鑰匙圈是空的，這些都要自己準備

這一段名詞很多，先用一句話定位：**CI 要做兩件事，「跟 Apple 講話」和「在 App 上蓋章」，每件事各需要一把鑰匙。**

### 鑰匙一：App Store Connect API 金鑰（跟 Apple 對話）

**目的**：讓 CI 能以你的身分呼叫 Apple 的後台 API。整個流程裡有三個地方會用到它：

1. 查 TestFlight 目前的 build number
2. 建立與下載 provisioning profile (Apple 簽的許可證)
3. 把 ipa 上傳到 App Store Connect。

白話文就是 runner 上沒人能輸入 Apple ID 密碼和雙重驗證碼，所以要一把不需要人在場的鑰匙

這把鑰匙的名稱為 `AuthKey_XXXXXXXX.p8`，在後台的整合頁面 -> App Store Connect API 可以產生，建立的時候存取權限要選「管理（Admin）」，因為需要動 Certificates, Identifiers & Profiles，開發者或 App 管理權限不夠。

> 要注意 **.p8 只能下載一次**。且它綁在**團隊**上，其他專案可以共用。

![](https://i.meee.com.tw/XeexXFg.jpg '後台頁面')

### 鑰匙二：發佈憑證與它的私鑰

**目的**：對 ipa 簽名。沒有簽名的 ipa，App Store Connect 直接拒收；簽名證明這個 App 是你的團隊做的、上傳途中沒被竄改。

這裡會出現三個東西，先認識它們：

- **私鑰**：一個金鑰檔，用來產生簽章。只有你有，存在 Mac 鑰匙圈，以及加密後備份在憑證 repo。
- **公鑰**：跟私鑰同時產生的另一半，用來驗證私鑰產生的簽章。可以公開，Apple 手上有。
- **憑證**：Apple 簽發的檔案，內容是「這把公鑰屬於團隊 XXXXXXXXXX」。可以公開，會打包進 App。

私鑰和公鑰是一組：私鑰算出來的簽章，只有對應的公鑰驗得過。憑證則是 Apple 替你的公鑰做的背書，讓別人相信這把公鑰真的是你的。

整件事分兩個階段，發生的時間不同：

**階段一：建立，只做一次**（就是後面跑 `fastlane ios certs` 那次）

1. 在你的 Mac 產生一對鑰匙：私鑰 + 公鑰。
2. 把公鑰送去 Apple、私鑰不送。
3. Apple 把公鑰和你的團隊資訊包在一起、簽上 Apple 自己的章，回傳給你，這就是憑證。
4. 私鑰和憑證存進 Mac 的鑰匙圈；match 再把它們加密後備份到憑證 repo。

**階段二：簽名，每次 build 都做**

1. 用私鑰對 App 內容產生一段簽章。
2. 把簽章和 **Apple 給的憑證** 一起打包進 ipa。

**Apple 收到 ipa 後怎麼驗**

1. 先檢查憑證上 Apple 的章是不是真的。這一步確認「憑證是 Apple 發的，裡面的公鑰屬於團隊 XXXXXXXXXX」。
2. 再從憑證裡取出公鑰，驗 App 的簽章。這一步確認「簽章是對應的私鑰簽的，內容沒被改過」。

所以私鑰負責簽，憑證負責讓別人驗，兩個一起才是一個有效的簽名。缺私鑰簽不出來，缺憑證別人驗不了。

以前用 Xcode 自動簽名時，這四步 Xcode 在背景做掉了，所以沒感覺。

**它和 `.p8` 是兩個不相干的東西。** `.p8` 是呼叫 App Store Connect API 用的，負責查 build number、建 profile、上傳；私鑰和憑證負責簽名。CI 兩者都需要。

### 鑰匙三：provisioning profile

**目的**：告訴 Apple「這個 App 被允許以什麼方式發佈、能用哪些系統功能」。

它和鑰匙二的憑證是兩個不同的檔案。憑證回答「你是誰」，profile 回答「你被允許做什麼」。

profile 是一個 `.mobileprovision` 檔，由 Apple 簽發，裡面寫了四件事：

- **bundle id**：這份 profile 對應哪個 App，例如 `XXX.XXXXX.chordex`
- **憑證**：允許用哪張憑證簽這個 App，這裡會列出鑰匙二那張
- **capability**：這個 App 被允許使用的系統功能，例如 App Group、推播
- **發佈方式**：App Store、Ad Hoc 或開發用

簽名時 profile 會一起打包進 ipa。Apple 收到後會核對：App 的 bundle id、簽名用的憑證、App 宣告要用的功能（entitlements），這三樣是不是都跟 profile 上寫的一致。任何一項對不上就拒收。

因為 profile 綁 bundle id，每個 bundle id 要一份。Chordex 有 widget，所以需要兩份：`XXX.XXXXX.chordex` 和 `XXX.XXXXX.chordex.widget`。

回頭看第二步為什麼要拿掉 `aps-environment`，就是這個核對：App 的 entitlements 宣告要用推播，但 Apple 後台的 App ID 沒開推播功能，Apple 產生的 profile 裡就沒有推播，兩邊對不上，簽名失敗。

另外在之後輸入指令的時候，fastlane 會跟 Apple 申請這份 profile 並推到 repo。

### 用 match 管理鑰匙二和三

**match** 是 fastlane 的簽名管理工具。它的想法是：憑證與 profile 不該散在每個人的電腦裡，而是加密後集中放在一個地方，任何電腦（包含 CI）要簽名就從那裡拉。

那個「地方」是一個**私有 git repo**，名字自訂。為什麼要多開一個、不直接放主 repo：

- 私鑰是機密：主 repo 若哪天開源或加協作者，他們不該拿到簽名私鑰。
- 權限可以分開給：CI 讀憑證 repo 的 token 只給那一個 repo 的唯讀權。
- 憑證幾乎不變動：不需要跟程式碼一起演進。

接下來分四段：準備、執行、結果、之後怎麼用。

#### 準備：兩件事

**1. 在 GitHub 建一個私有的空 repo**，例如 `XXX-certificates`。不勾 README，什麼都不放，match 會自己 push 東西進去。

**2. 寫 `fastlane/Matchfile`**，告訴 match repo 在哪、要替哪些 bundle id 建 profile：

```ruby
# fastlane/Matchfile
git_url("https://github.com/你的帳號/chordex-certificates.git")
storage_mode("git")
type("appstore")
app_identifier(["XXX.XXXXX.chordex", "XXX.XXXXX.chordex.widget"])
team_id("XXXXXXXXXX")
```

另外要先想好一組密碼，match 會用它加密 repo 裡的東西，這就是**鑰匙四：MATCH_PASSWORD**。CI 之後要用同一組解密，弄丟就只能重建憑證。

#### 執行：本機跑一次

跑之前，終端機要有鑰匙一的三個值（`ASC_KEY_ID`、`ASC_ISSUER_ID`、`ASC_KEY_CONTENT`）和 `MATCH_PASSWORD`。我當時是用 `export` 設的，後來改成放 `fastlane/.env`，第五步會講。然後：

```bash
bundle exec fastlane ios certs
```

這一個指令會依序做五件事：

1. 用鑰匙一登入 Apple。
2. 在你的 Mac 產生私鑰，向 Apple 申請憑證（鑰匙二）。
3. 向 Apple 替兩個 bundle id 各申請一份 profile（鑰匙三）。
4. 私鑰、憑證裝進 Mac 鑰匙圈，profile 裝進本機。
5. 全部用 `MATCH_PASSWORD` 加密，push 到憑證 repo。

終端機的重點輸出，可以對照上面五步：

```
[22:13:21]: 🔓  Successfully decrypted certificates repo
[22:13:22]: Couldn't find a valid code signing identity for distribution... creating one for you now
[22:13:23]: Password for login keychain: *****        ← 問的是 Mac 登入密碼，要把私鑰放進鑰匙圈；不是 MATCH_PASSWORD
[22:14:55]: Successfully generated 3Q272FH6MK which was imported to the local machine.
[22:14:56]: 🔒  Successfully encrypted certificates repo
[22:14:58]: Finished uploading files to Git Repo [https://github.com/xxx/chordex-certificates.git]
[22:15:01]: Creating new provisioning profile for 'XXX.XXXXX.chordex' with name 'match AppStore XXX.XXXXX.chordex'
[22:15:03]: Creating new provisioning profile for 'XXX.XXXXX.chordex.widget' with name 'match AppStore XXX.XXXXX.chordex.widget'
[22:15:06]: All required keys, certificates and provisioning profiles are installed 🙌
[22:15:06]: fastlane.tools finished successfully 🎉
```

#### 結果：材料全部備齊

憑證 repo 裡多了這些：

```
certs/distribution/   ← 加密後的憑證與私鑰
profiles/appstore/    ← 加密後的兩份 profile
match_version.txt
```

![](https://i.meee.com.tw/sQ0oEDi.png 'repo 的模樣')

本機也有一份：私鑰和憑證在鑰匙圈（Keychain Access 搜「Apple Distribution」看得到），profile 在 `~/Library/Developer/Xcode/UserData/Provisioning Profiles/`。

#### 補充：`certs` 這條指令背後是什麼

`certs` 不是 fastlane 內建的指令，是我們在 Fastfile 裡自訂的 lane，`fastlane ios certs` 會去找同名的 lane 執行。fastlane 內建的是 `match` 這個 action，直接用的話要自己把鑰匙一的三個值拼成它要的格式傳進去，很麻煩；包成 lane 之後，讀 `.env`、組登入資訊、呼叫 match 這幾步都寫死在裡面。

下面的程式碼，白話文就是把 api_key 封裝後傳給 match 使用：

```ruby
lane :certs do                                   # 定義一個叫 certs 的流程，之後用 fastlane ios certs 呼叫

  api_key = app_store_connect_api_key(           # 把鑰匙一（.p8）組成 fastlane 能用的登入資訊
    key_id: ENV.fetch("ASC_KEY_ID"),             #   從環境變數拿 Key ID
    issuer_id: ENV.fetch("ASC_ISSUER_ID"),       #   拿 Issuer ID
    key_content: ENV.fetch("ASC_KEY_CONTENT"),   #   拿 .p8 的內容
    is_key_content_base64: true                  #   告訴它內容是 base64 編碼過的
  )

  match(                                         # 呼叫 match
    type: "appstore",                            #   要 App Store 發佈用的憑證與 profile
    app_identifier: [APP_ID, WIDGET_ID],         #   替這兩個 bundle id 各建一份 profile
    api_key: api_key,                            #   用上面組好的登入資訊跟 Apple 講話
    readonly: false                              #   允許「建立新的」
  )
end
```

我們自己寫的 `release` lane 裡也有一句 `match(...)`，參數幾乎一樣，唯一的差別是 `readonly`：

- `certs` 用 `readonly: false`：允許 match 建立新的憑證和 profile。只在本機跑、只跑一次。
- `release` 用 `readonly: true`：match 只能把 repo 裡現成的東西拉下來用，找不到就直接失敗，不會自己去 Apple 建新的。

這樣分的原因是 CI 每次發版都會跑 `release`，如果它有權限建憑證，哪天設定出錯就可能默默多建一張，三張上限很快被撞滿，還不知道是誰建的。把「建」的權限鎖在只有人手動執行的 `certs`，出事時才好追。

#### 之後怎麼用

CI 或新電腦只要跑 `match`（唯讀模式）把 repo 拉下來、用 `MATCH_PASSWORD` 解密、裝進鑰匙圈就能簽名，不用再跟 Apple 申請任何東西。

repo 裡的東西分兩層：憑證整個團隊一張、所有專案共用；profile 每個 bundle id 各一份。因此：

- 某個 App 改了 capability，只有它的 profile 失效，在那個專案重跑 `certs` 就會重建那一份，憑證和其他專案不受影響。
- 憑證一年到期，重跑 `certs` 會建新憑證並重建所有 profile。
- 其他專案要用，Matchfile 指向同一個 repo，跑 `certs` 時 match 會沿用憑證、只替新 bundle id 建 profile，不會撞到三張的上限。

### 為什麼 lane 裡要把專案改成手動簽名

Xcode 的簽名有兩種模式。

- **Automatic**：登入 Apple ID，Xcode 自己去找或建憑證和 profile，本機開發最方便，prebuild 生出的專案預設就是這個。
- **Manual**：明確指定用哪張憑證、哪份 profile。

runner 上沒有登入 Apple ID，Automatic 模式一到 archive 就會失敗。但前一步 match 已經把憑證和兩份 profile 裝進 runner 的鑰匙圈了，所以 lane 第 6 步用 `update_code_signing_settings` 把專案改成 Manual，直接指定用那些：

## 第五步：把鑰匙交給 CI

### 問題

四把鑰匙都在你的 Mac 上了，runner 上還是沒有。而且不能明文寫進 yml，因為 yml 在 git 裡。

### 做法：GitHub Secrets

repo 的 Settings → Secrets and variables → Actions → **Repository secrets**（不是 Environment secrets，那是給有分 staging/production 環境的 workflow 用的）。

workflow 用 `${{ secrets.NAME }}` 讀，值不會出現在 log 這邊要輸入有五個：

| Secret                          | 是什麼                       | 怎麼得到                   |
| ------------------------------- | ---------------------------- | -------------------------- |
| `ASC_KEY_ID`                    | 鑰匙一的 Key ID              | App Store Connect 金鑰列表 |
| `ASC_ISSUER_ID`                 | 團隊的 Issuer ID             | 同一頁表格上方那串 UUID    |
| `ASC_KEY_CONTENT`               | 鑰匙一的 .p8 內容            | `base64 -i AuthKey_XXX.p8` |
| `MATCH_PASSWORD`                | 鑰匙四                       | 自訂                       |
| `MATCH_GIT_BASIC_AUTHORIZATION` | 讓 CI 能 clone 私有憑證 repo | 見下方                     |

### 關於 MATCH_GIT_BASIC_AUTHORIZATION

runner clone 憑證 repo 時等於陌生人，因此私有 repo 會拒絕，所以要給它一把「只能讀那個 repo」的鑰匙。再來我們要建一個 GitHub **fine-grained PAT**（Personal Access Token，可限定 repo 與權限的替代密碼）：

Github 照著此路徑頁面：`Settings → Developer settings → Personal access tokens → Fine-grained tokens`，建立的時候可以自行留意：

- 只允許指定 Repo
- 權限只開 Contents → Read

此外 `match` 要求「帳號:密碼」的 base64 格式，所以終端機輸入：

```bash
echo -n "你的 github 名稱:github_pat_xxxxxxxx" | base64
```

印出的字串就是 secret 的值。本機不需要它，因為我們的 Mac 已經登入過 GitHub

### 本機也要一份：fastlane/.env

本機跑 lane 同樣需要前四個值。`export` 只在當下那個終端機視窗有效，換視窗就沒了，所以寫進 `fastlane/.env`，fastlane 會自動讀：

```bash
cat > fastlane/.env <<EOF
ASC_KEY_ID=你的KeyID
ASC_ISSUER_ID=你的IssuerID
ASC_KEY_CONTENT=$(base64 -i ~/.private_keys/AuthKey_你的KeyID.p8)
MATCH_PASSWORD=你自訂的密碼
EOF
```

這個檔案只對這個專案生效、不是全域，而且一定要在 `.gitignore` 裡。

到這邊這個資料夾應該會長這樣：

![](https://i.meee.com.tw/JoHbLjl.png)

## 第六步：決定版號和 tag 的規則

一開始 lane 是「查 TestFlight 最新 build，+1」，全自動。但這樣看不出 tag 和 build 的對應，同一版本補傳時 tag 也會重複。最後改成 **tag 一律帶 build number**：

也就是打 tag 的時候會需要寫成 `v1.7.2-1`、`v1.7.2-2` 的形式而不是單純 `v1.7.2`

workflow 把 tag 拆成兩段傳給 lane：

```yaml
on:
  push:
    tags: ['v*.*.*-*'] # 只有 v1.7.2-1 這種格式才觸發
---
- run: |
    TAG="${GITHUB_REF_NAME#v}"     # v1.7.2-1 → 1.7.2-1
    VERSION="${TAG%%-*}"           # → 1.7.2
    BUILD="${TAG##*-}"             # → 1
    bundle exec fastlane ios release version:"$VERSION" build_number:"$BUILD"
```

lane 先確認 version 等於 package.json，再問 TestFlight 這個 build 用過沒，用過就在 archive 之前失敗，不浪費五分鐘。

本機直接打指令的話，就用參數 `pnpm release:ios build_number:3`；不帶參數則退回「最新 +1」，乾淨又衛生

## 踩過的坑

1. **bundle install 畫面完全沒動靜。** fastlane 相依一百多個 gem，第一次會先抓 rubygems.org 的整份索引（約 24 MB），這段完全不印字，網路慢要好幾分鐘。判斷是否卡死可以看程序有沒有持續收資料。我第一次真的卡在最後 167 bytes 斷線，Ctrl-C 重跑並清掉 `~/.bundle/cache/compact_index` 就過了。

2. **`key not found: "ASC_KEY_ID"`。** `export` 的變數只在那一個終端機視窗有效。解法是寫進 `fastlane/.env`。

3. **prebuild 炸出 `Cannot read properties of undefined (reading 'removeFromProject')`。** 本機已經有 `ios/` 時，prebuild 沒加 `--clean` 會嘗試「更新」既有專案，@bacons/apple-targets 更新既有 widget target 時有 bug。CI 上沒有 `ios/` 不會遇到，但本機和 CI 行為應該一致，所以 lane 一律 `--clean` 從零重生。

4. **CI 上 `Your bundle only supports platforms ["arm64-darwin-24"]`。** `Gemfile.lock` 只記錄了本機的平台，runner 上 setup-ruby 用的預編 Ruby 回報 `arm64-darwin-22`，bundler 在 deployment 模式下拒絕。解法只改 lockfile、不裝東西：

```bash
bundle lock --add-platform arm64-darwin-22 arm64-darwin-23 arm64-darwin-25 x86_64-darwin-22
```

5. **終端機問密碼，是 MATCH_PASSWORD 嗎？** 不是。`Password for login keychain` 是 Mac 登入密碼。log 裡有 `Successfully decrypted certificates repo` 就代表 MATCH_PASSWORD 有生效。

6. **TestFlight 上新 build 沒有 icon。** 狀態「處理中」時是灰色佔位圖，Apple 處理完才會抽出 icon。

7. **tag 跑失敗要重來。** build number 沒被用掉時可以刪掉重打同一個號碼：

```bash
git tag -d v1.7.1-3 && git push origin :refs/tags/v1.7.1-3
git tag v1.7.1-3 && git push origin v1.7.1-3
```

已經上傳成功才發現要補東西，就用下一個號碼。

## 日常發版流程

**新版本**：改 package.json 的 version，commit、push，然後：

```bash
git tag v1.7.2-1 && git push origin v1.7.2-1
```

到 Actions 看 iOS Release；成功後 TestFlight 出現 1.7.2 (1)，Releases 頁有 dSYM。要上架就到 App Store Connect 的「發佈」分頁選這個 build 送審，跟以前一樣。

**同版本補東西**：改完 commit、push，package.json 不用動：

```bash
git tag v1.7.2-2 && git push origin v1.7.2-2
```

**本機直接上傳、不經過 CI**：

```bash
pnpm release:ios build_number:2
```

**原生設定要改**：改 `app.config.js`、`plugins/` 或 `targets/widget/`，不要手改 `ios/`。想看結果就 `bundle exec fastlane ios prebuild`。

## 時間與費用

GitHub 免費方案每月 2000 分鐘，是**帳號**層級、所有私有 repo 共用；公開 repo 免費不限。macOS runner 以 10 倍計費，2000 分鐘等於 200 分鐘 macOS，一次 16 分鐘的發版扣 160 分鐘。超過額度不會被扣錢，workflow 直接不跑，等下個月重置。

所以最有效的省法不是優化 yml，而是**別亂打 tag**：正式發版前先在本機跑，CI 只跑真的要上 TestFlight 的那一次。若之後要壓時間，依划算程度：快取 RN 預編譯包（省約 1 分鐘、無風險）、快取 ios/Pods（省 1 到 2 分鐘、要重排流程）、ccache（省 1 到 3 分鐘、偶爾出怪問題）、大台 runner（archive 減半、但要付費）。

## 附錄一：每個檔案的用意

| 檔案                                         | 用意                                                                                        |
| -------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `.github/workflows/ci.yml`                   | 每次 push / PR 在 ubuntu 跑 lint、tsc、vitest                                               |
| `.github/workflows/ios-release.yml`          | 推 `v*.*.*-*` tag 時在 macOS runner 跑 fastlane release lane，之後建 GitHub Release 附 dSYM |
| `fastlane/Fastfile`                          | 發版流程本體。三條 lane：`release`、`certs`（一次性建憑證）、`prebuild`（只生 ios/ 供檢查） |
| `fastlane/Appfile`                           | app id 與 team id，各 action 的預設值                                                       |
| `fastlane/Matchfile`                         | 憑證 repo 網址、儲存方式、兩個 bundle id                                                    |
| `fastlane/.env`（不進版控）                  | 本機跑 lane 用的四個環境變數                                                                |
| `Gemfile` / `Gemfile.lock` / `.ruby-version` | Ruby 相依與版本，本機和 CI 同版                                                             |
| `plugins/withoutPushEntitlement.js`          | 自訂 config plugin，拿掉 `aps-environment`                                                  |
| `app.config.js`（修改）                      | version 讀 package.json、buildNumber 讀環境變數、掛上自訂 plugin                            |
| `package.json`（修改）                       | 加 `expo-system-ui`、`packageManager`、`release:ios` script                                 |
| `.gitignore`（修改）                         | 加 `ios_backup*/`、`fastlane/.env`、`build/`、`*.ipa`、`*.dSYM.zip`                         |

## 附錄二：ios-release.yml 逐行

```yaml
on:
  push:
    tags: ['v*.*.*-*']        # 只有 v1.7.2-1 這種格式的 tag 才觸發
concurrency: ios-release      # 同時只跑一個，避免 build number 撞號
permissions:
  contents: write             # 建 GitHub Release 需要寫入權限

jobs:
  testflight:
    runs-on: macos-26         # iOS 建置只能在 macOS；26 是映像檔版本，內建 Xcode 26.x
    timeout-minutes: 60
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - uses: ruby/setup-ruby@v1           # 讀 .ruby-version 裝 Ruby，bundle install，gems 有快取
        with: { bundler-cache: true }
      - name: Select Xcode                 # 對齊本機 Xcode 版本，找不到就用預設
        run: sudo xcode-select -s /Applications/Xcode_26.3.app || echo "用預設版本"
      - uses: actions/cache@v4             # 快取 CocoaPods 下載的原始碼
        with: { path: ~/Library/Caches/CocoaPods, key: cocoapods-${{ hashFiles('pnpm-lock.yaml') }} }
      - name: Build and upload to TestFlight
        run: |
          TAG="${GITHUB_REF_NAME#v}"
          VERSION="${TAG%%-*}"
          BUILD="${TAG##*-}"
          bundle exec fastlane ios release version:"$VERSION" build_number:"$BUILD"
        env:                               # 五個 secrets 以環境變數交給 fastlane
          ASC_KEY_ID: ${{ secrets.ASC_KEY_ID }}
          ASC_ISSUER_ID: ${{ secrets.ASC_ISSUER_ID }}
          ASC_KEY_CONTENT: ${{ secrets.ASC_KEY_CONTENT }}
          MATCH_PASSWORD: ${{ secrets.MATCH_PASSWORD }}
          MATCH_GIT_BASIC_AUTHORIZATION: ${{ secrets.MATCH_GIT_BASIC_AUTHORIZATION }}
      - uses: softprops/action-gh-release@v2   # 建 GitHub Release，附 dSYM
        with: { generate_release_notes: true, files: build/*.dSYM.zip }
```

## 附錄三：完整 Fastfile

正文是節錄，這是可以直接複製的完整版（Team ID 與 bundle id 已遮掉）：

```ruby
# Chordex iOS 發版流程（Ruby，由 fastlane 執行）。
#
#   bundle exec fastlane ios release version:1.8.0 build_number:1
#
# 版號來自 git tag `v1.8.0-1`：`-` 前是 version（必須等於 package.json），`-` 後是 build number。
# 流程：檢查版號 → 確認 build number 沒在 TestFlight 用過 → expo prebuild 生出 ios/
#      → pod install → match 取憑證/profile → 改成手動簽名 → archive → 上傳 TestFlight。
# CI（.github/workflows/ios-release.yml）與本機跑的是同一條 lane，本機先跑通再上 CI 省 macOS 額度。
#
# 需要的環境變數：
#   ASC_KEY_ID / ASC_ISSUER_ID / ASC_KEY_CONTENT（.p8 內容 base64）— App Store Connect API 金鑰
#   MATCH_PASSWORD — 憑證 repo 的加密密碼
#   MATCH_GIT_BASIC_AUTHORIZATION — CI 讀憑證 repo 用（base64("帳號:PAT")），本機有 git 權限可不設

default_platform(:ios)

APP_ID    = "XXX.XXXXX.chordex"
WIDGET_ID = "XXX.XXXXX.chordex.widget"
TEAM_ID   = "XXXXXXXXXX"
WORKSPACE = "ios/Chordex.xcworkspace"
PROJECT   = "ios/Chordex.xcodeproj"

platform :ios do
  desc "tag 觸發：prebuild → match → archive → 上傳 TestFlight"
  lane :release do |opts|
    # 1. 版號：以 git tag 為準，必須等於 package.json（app.config.js 也是讀 package.json）
    pkg_version = sh("node -p \"require('../package.json').version\"").strip
    version = opts[:version] || pkg_version
    UI.user_error!("tag 版號 #{version} 與 package.json 的 #{pkg_version} 不一致") unless version == pkg_version

    # 2. App Store Connect API 金鑰（CI 無法輸入 Apple ID 密碼與 2FA）
    api_key = app_store_connect_api_key(
      key_id: ENV.fetch("ASC_KEY_ID"),
      issuer_id: ENV.fetch("ASC_ISSUER_ID"),
      key_content: ENV.fetch("ASC_KEY_CONTENT"),
      is_key_content_base64: true
    )

    # 3. build number：由 tag 的 `-N` 指定（CI 從 workflow 傳入）。先查 TestFlight 同版本最新 build，
    #    號碼已用過就直接失敗，不浪費五分鐘 archive。本機沒帶參數時退回「最新 +1」。
    latest = latest_testflight_build_number(
      api_key: api_key,
      app_identifier: APP_ID,
      version: version,
      initial_build_number: 0
    )
    build_number = (opts[:build_number] || latest + 1).to_i
    if build_number <= latest
      UI.user_error!("build #{build_number} 已用過：#{version} 在 TestFlight 最新是 build #{latest}，請打 v#{version}-#{latest + 1}")
    end
    UI.message("版本 #{version}（build #{build_number}）")

    # 4. 從 app.config.js 生出 ios/（ios/ 不進版控）。BUILD_NUMBER 由 app.config.js 讀取
    ensure_prebuild(build_number: build_number)
    cocoapods(podfile: "ios/Podfile")

    # 5. 簽名：CI 上開臨時 keychain，再從憑證 repo 拉發佈憑證與兩個 profile
    setup_ci
    match(
      type: "appstore",
      app_identifier: [APP_ID, WIDGET_ID],
      api_key: api_key,
      readonly: true # CI 只讀；要新增或更新憑證請在本機跑 `fastlane match appstore`
    )
    profiles = lane_context[SharedValues::MATCH_PROVISIONING_PROFILE_MAPPING]

    # 6. prebuild 生出的專案是 Xcode 自動簽名（需登入 Apple ID），改成用 match 拿到的 profile 手動簽
    { "Chordex" => APP_ID, "widget" => WIDGET_ID }.each do |target, bundle_id|
      update_code_signing_settings(
        path: PROJECT,
        targets: [target],
        bundle_identifier: bundle_id,
        use_automatic_signing: false,
        team_id: TEAM_ID,
        code_sign_identity: "Apple Distribution",
        profile_name: profiles[bundle_id]
      )
    end

    # 7. archive + export .ipa（同時產出 dSYM zip 供 GitHub Release 附檔）
    build_app(
      workspace: WORKSPACE,
      scheme: "Chordex",
      configuration: "Release",
      export_method: "app-store",
      export_options: { provisioningProfiles: profiles },
      output_directory: "build",
      output_name: "Chordex.ipa"
    )

    # 8. 上傳 TestFlight；不等 Apple 處理完（可能數十分鐘），省 CI 分鐘數
    upload_to_testflight(
      api_key: api_key,
      ipa: lane_context[SharedValues::IPA_OUTPUT_PATH],
      skip_waiting_for_build_processing: true
    )

    UI.success("已上傳 Chordex #{version} (#{build_number}) 到 TestFlight")
  end

  desc "一次性：建立發佈憑證與兩個 App Store profile 並推到憑證 repo（本機執行，需要 Admin 權限的 API 金鑰）"
  lane :certs do
    api_key = app_store_connect_api_key(
      key_id: ENV.fetch("ASC_KEY_ID"),
      issuer_id: ENV.fetch("ASC_ISSUER_ID"),
      key_content: ENV.fetch("ASC_KEY_CONTENT"),
      is_key_content_base64: true
    )
    match(type: "appstore", app_identifier: [APP_ID, WIDGET_ID], api_key: api_key, readonly: false)
  end

  desc "只跑 expo prebuild 生出 ios/（本機驗證用）：fastlane ios prebuild build_number:1"
  lane :prebuild do |opts|
    ensure_prebuild(build_number: opts[:build_number] || "1")
  end

  # `sh` 的工作目錄是 fastlane/，所以先 cd 回專案根目錄。
  # CI=1 讓 expo 不進互動模式；--no-install 是因為 pod install 由 cocoapods action 負責。
  # --clean 每次都刪掉 ios/ 從零重生：本機與 CI 行為一致，也避開 apple-targets 更新既有 widget target 的 bug
  #（代價是本機每次都會重新 pod install）。
  private_lane :ensure_prebuild do |opts|
    sh("cd .. && CI=1 BUILD_NUMBER=#{opts[:build_number]} npx expo prebuild --platform ios --clean --no-install")
  end
end
```

## 附錄四：名詞小辭典

| 名詞                           | 一句話                                                                                 |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| CI                             | 程式碼一變動就自動在機器上跑檢查或建置                                                 |
| GitHub Actions                 | GitHub 的 CI 服務，設定寫在 `.github/workflows/*.yml`                                  |
| runner                         | 執行 workflow 的那台全新、用完即丟的機器                                               |
| workflow / job / step          | 一個 yml 檔 / 裡面的一項工作 / 工作裡的一個動作                                        |
| secret                         | 存在 GitHub、workflow 可讀但不會顯示的機密值                                           |
| prebuild / CNG                 | 從 `app.config.js` 生出 `ios/` 的動作；每次都重生的做法叫 Continuous Native Generation |
| config plugin                  | prebuild 時修改原生專案的一段程式，套件自帶或自己寫                                    |
| fastlane / lane / action       | Ruby 寫的發版自動化工具 / Fastfile 裡的一個流程 / fastlane 提供的一個現成動作          |
| Gemfile / bundler              | Ruby 的套件清單 / 安裝工具，等於 package.json / pnpm                                   |
| App Store Connect API 金鑰     | 讓程式以你的身分操作 Apple 後台的 .p8 檔                                               |
| 發佈憑證（Apple Distribution） | Apple 簽發的身分證明，私鑰在你手上，用來簽 App                                         |
| provisioning profile           | Apple 簽的許可證：這個 bundle id 用這張憑證、有這些 capability、可這樣發佈             |
| entitlement                    | App 宣告自己要用的系統能力（推播、App Group 等），必須與 profile 一致                  |
| match                          | fastlane 的簽名管理：憑證與 profile 加密後集中存在 git repo                            |
| PAT                            | GitHub 的個人存取權杖，可限定 repo 與權限的替代密碼                                    |
| TestFlight                     | Apple 的測試發佈平台；上傳到 App Store Connect 的 build 都會出現在這裡                 |
| dSYM                           | 建置產生的除錯符號檔，用來把崩潰報告還原成可讀的程式位置                               |
| version / build number         | 使用者看得到的版號 / 同版本內區分每次上傳的流水號                                      |
