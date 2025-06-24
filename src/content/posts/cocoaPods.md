---
title: 解決 CocoaPods not installed
date: 2025-06-24
summary: 最近因為換了新的 Mac，flutter 當要裝一下，但開發到一半又遇到老問題 CocoaPods not installed
category: 前端
tags: [flutter]
---

最近因為換了新的 Mac，`flutter` 當要裝一下，但開發到一半又遇到老問題 `CocoaPods not installed`。

這真的頗煩每次都要重搞一次，記錄一下下次遇到可以快速解決。

```
Launching lib/main.dart on iPhone 16 Plus in debug mode...
Warning: CocoaPods not installed. Skipping pod install.
  CocoaPods is a package manager for iOS or macOS platform code.
  Without CocoaPods, plugins will not work on iOS or macOS.
  For more info, see https://flutter.dev/to/platform-plugins
For installation instructions, see https://guides.cocoapods.org/using/getting-started.html#installation

CocoaPods not installed or not in valid state.
Error launching application on iPhone 16 Plus.

Exited (1).
```

## 直接安裝

遇到後可以直接先跑安裝試試看：

```shell
sudo gem install cocoapods
```

我這邊遇到版本不夠，新版 cocoapods 需要的 securerandom gem 最低要 Ruby 3.1.0，所以繼續往下安裝。

```shell
ERROR:  Error installing cocoapods:
	The last version of securerandom (>= 0.3) to support your Ruby & RubyGems was 0.3.2. Try installing it with gem install securerandom -v 0.3.2 and then running the current command again
	securerandom requires Ruby version >= 3.1.0. The current ruby version is
```

## 升級 Ruby

沒有 homebrew 先安裝一下，其他東西也跑一跑：

```shell
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

```shell
brew install rbenv ruby-build
```

下載並安裝 Ruby 3.2.2 到你的電腦中。

```shell
rbenv install 3.2.2
```

設定你電腦「預設要用」的 Ruby 版本。

```shell
rbenv global 3.2.2
```

上面搞好後打打看 `ruby -v` 可以看到版本號碼，出現 3.2.2 就可以繼續安裝 cocoapods，如果你這邊跟我一樣上面跑完後，`ruby -v` 還是舊的版本，可以執行（zsh）：

```bash
echo 'eval "$(rbenv init - zsh)"' >> ~/.zshrc
source ~/.zshrc
```

如過用的是 bash：

```bash
echo 'eval "$(rbenv init - bash)"' >> ~/.bash_profile
source ~/.bash_profile
```

這邊搞定後終端機重開一下，確認 ruby 版本有沒有正確。

都正確接著下指令 `sudo gem install cocoapods` 再安裝看看，我到這邊就可以重新打開 flutter 專案了，有遇到其他問題可以嘗試詢問 AI 或爬文。
