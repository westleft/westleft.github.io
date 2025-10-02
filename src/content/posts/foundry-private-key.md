---
title: 在 Foundry 中安全的使用私鑰
date: 2025-10-02
summary: 在開發與部署階段，我們都會需要用到錢包地址跟私鑰，常見的方式有寫在 foundry.toml 或是 .env 中...
category: 區塊鏈
tags: [foundry]
---

在開發與部署階段，我們都會需要用到錢包地址跟私鑰，常見的方式有寫在 `foundry.toml` 或是 `.env` 中，看似安全，但即使是寫在這裡面，私鑰仍然會以明文形式儲存，為了能更安全的使用，這篇文章會實作用 Foundry Cast 內建的功能將私鑰加密為 JSON 檔案，此加密方式基於 [ERC-2335](https://eips.ethereum.org/EIPS/eip-2335) 協議。

## 什麼是 ERC-2335

> ERC-2335 是一個以 BLS12-381 為基礎的密鑰儲存標準，旨在提供安全且標準化的私鑰加密與儲存方式，特別適用於以太坊共識層（如質押）和去中心化應用（dApp）的開發與部署。

簡單來說，該協議允許使用者用一組密碼對私鑰進行加密，利用鏈上和鏈下過程來保障私鑰的安全性。

## cast 指令進行加密

理解過後，我們來用 foundry 中 cast 的指令來加密看看：

```shell
cast wallet import <key-name> --interactive
```

- `cast`：Foundry 套件裡的 CLI 工具。
- `wallet import`：cast 的子命令，意思是「匯入錢包」。
- `<key-name>`：你想給這個錢包起的本地識別名稱（alias）。
- `--interactive`：不把私鑰寫在終端機上。

下面嘗試在終端機輸入後，會出現：

```shell
west@Mac test-foundry % cast wallet import defaultKey --interactive
Enter private key:
Enter password:
`defaultKey` keystore was saved successfully. Address: 0xf39fd6e51aad88f6f4ce6ab8827279cfffxxxxxx
```

可以看到他會要你輸入一組密碼 `Enter password`，這就是 ERC-2335 協議中用這組密碼進行加密，未來在部署的時候也會需要用到這組密碼。

再來看 `keystore was saved successfully` 這段，已經加密過的 json 檔案，預設會在 `~/.foundry/keystores/` 的資料夾中，剛剛我將其命名為 `defaultKey`，所以我會有下面這個檔案：

```
~/.foundry/keystores/defaultKey
```

開啟後會看到：

```json
"crypto": {
  "cipher": "aes-128-ctr",
  "ciphertext": "d0e1f2…",
  "kdf": "scrypt",
  "kdfparams": { "n": 262144, "r": 8, "p": 1, "dklen": 32, "salt": "…" },
  "mac": "…"
}
```

一開始建立的時候可以看到，終端機已經顯示我們的地址出來，這是因為 Ethereum 地址是從私鑰推算出來的，共經歷三個步驟：

1. 先拿到私鑰（32 byte）
2. 對私鑰做 椭圆曲线乘法（secp256k1） → 得到公鑰
3. 對公鑰做 keccak256 → 取最後 20 byte → 就是 Ethereum 地址

## 嘗試部署

假設已經建立好一個 foundry 專案，接著終端機先打上 `anvil` 開啟本地節點：

```shell
west@Mac test-foundry % anvil
                             _   _
                            (_) | |
      __ _   _ __   __   __  _  | |
     / _` | | '_ \  \ \ / / | | | |
    | (_| | | | | |  \ V /  | | | |
     \__,_| |_| |_|   \_/   |_| |_|

    1.2.3-stable (a813a2cee7 2025-06-08T15:42:50.507050000Z)
    https://github.com/foundry-rs/foundry

Available Accounts
==================
...

Private Keys
==================
...

```

RPC-URL 預設是 `http://127.0.0.1:8545`，接著再開一個終端機部署看看：

```shell
forge script script/Counter.s.sol --rpc-url http://127.0.0.1:8545 --account defaultKey --broadcast
```

這邊注意到是使用 `--account defaultKey` 的方式，如果沒有用 `--account defaultKey`，取而代之的則是要在終端機打上 `--private-key xxxx --sender xxxx`。

輸入過後，他會要求輸入剛剛加密過的那組密碼 `Enter keystore password`：

```
west@Mac test-foundry % forge script script/Counter.s.sol --rpc-url http://127.0.0.1:8545 --account defaultKey --broadcast
[⠊] Compiling...
No files changed, compilation skipped
Enter keystore password:
Script ran successfully.

下略 ......
```

可以發現我們連 `--sender` 都沒有打，原因是剛剛說的他可以回推地址出來。

如果密碼錯誤，則會出現：

```shell
Error: script failed: vm.startBroadcast: Failed to decrypt keystore: incorrect password
```

以上就是這次的示範！
