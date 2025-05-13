---
title: 在 Hardhat 中測試 UUPS 合約
date: 2023-07-14
lastMod: 2024-08-10T03:58:16.758Z
summary: 區塊鏈因為不可去中心化、不可竄改的特性，只要我們的智能合約上鏈後，就不能再更動了...
tags: [區塊鏈]
---

# 在 Hardhat 中測試 UUPS 合約

區塊鏈因為不可去中心化、不可竄改的特性，只要我們的智能合約上鏈後，就不能再更動了，對於開法者來說是非常麻煩的事情，就算將合約測試到極致，也難免會有沒測試到的地方，而且如果老闆說想要追加某個功能的話...

> 老闆：我管你什麼去中心化，這個功能下班前給我。

這時候我們可以使用 `Transparent Proxy` 或是 `UUPS Proxy` 來讓合約能夠「升級」。下文會使用 `Hardhat` 來測試 UUPS 功能是否能正常運作。

## UUPS 是什麼

在 UUPS 的架構中，我們的合約會拆成兩個部分：`Proxy` 和 `Implementation`，我們調用 `Proxy` 合約後，`Porxy` 會接著調用 `Implementation` 合約。

因為 `delegatecall` 的特性，雖然執行了 `Implementation` 合約中的函數，但上下文依然是屬於 `Proxy` 合約的，也就是說修改過後的變數仍會在 `Proxy` 當中，未來如果我們想要修改某個 function 的功能，只要更新 `Implementation` 合約就可以了。

## 建立 UUPS 合約

這邊我們使用 openzeppelin 的 [Wizard](https://docs.openzeppelin.com/contracts/4.x/wizard) 來快速建立合約，程式碼如下：

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract MyToken is Initializable, ERC1155Upgradeable, OwnableUpgradeable, UUPSUpgradeable {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() initializer public {
        __ERC1155_init("");
        __Ownable_init();
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}
}
```

## 設定 Hadrhat

接著使用以太坊的智能合約開框架 Hardhat 來測試，跟著文件上的 [Quick Start](https://hardhat.org/hardhat-runner/docs/getting-started#quick-start) 指南來走：

```shell
npx hardhat
```

該選的東西選一選，我這邊選原生 JS 就好。

```shell
$ npx hardhat
888    888                      888 888               888
888    888                      888 888               888
888    888                      888 888               888
8888888888  8888b.  888d888 .d88888 88888b.   8888b.  888888
888    888     "88b 888P"  d88" 888 888 "88b     "88b 888
888    888 .d888888 888    888  888 888  888 .d888888 888
888    888 888  888 888    Y88b 888 888  888 888  888 Y88b.
888    888 "Y888888 888     "Y88888 888  888 "Y888888  "Y888

👷 Welcome to Hardhat v2.16.1 👷‍

? What do you want to do? …
❯ Create a JavaScript project
  Create a TypeScript project
  Create an empty hardhat.config.js
  Quit
```

如果有顯示叫你裝其他東西就裝一裝：

```shell
You need to install these dependencies to run the sample project:
  npm install --save-dev "hardhat@^2.16.1" "@nomicfoundation/hardhat-toolbox@^3.0.0"
```

另外還需要安裝 `@openzeppelin/contracts-upgradeable` 以及 `@openzeppelin/hardhat-upgrades` 。

好了之後資料夾會長這樣：

![hardhat資料夾](https://i.imgur.com/HT1Dl9U.png)

因為只是要寫單元測試，所以專注在 `/contract`、`/test` 兩個資料夾就好，這兩個資料夾內的檔案也可以直接刪掉，我們用不到，或是要留著當參考用也可以。

## 建立合約

我們來建立兩個合約：`Uups.sol` 和 `UupsV2.sol`，在合約內的程式碼加上

::: code-group

```solidity [Uups.sol]
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract Uups is Initializable, ERC1155Upgradeable, OwnableUpgradeable, UUPSUpgradeable {
    uint256 public myNumber;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() initializer public {
        __ERC1155_init("");
        __Ownable_init();
        __UUPSUpgradeable_init();
        myNumber = 1;
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}

    function addMyNumber() public {
        myNumber += 1;
    }
}

```

```solidity [UupsV2.sol]
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract UupsV2 is Initializable, ERC1155Upgradeable, OwnableUpgradeable, UUPSUpgradeable {
    uint256 public myNumber;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() initializer public {
        __ERC1155_init("");
        __Ownable_init();
        __UUPSUpgradeable_init();
        myNumber = 1;
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}

    function addMyNumber() public {
        myNumber += 10;
    }
}
```

:::

合約內加上變數 `myNumber` 以及 function `addMyNumber`，兩個 `addMyNumber` 增加的值不一樣，在合約升級後，每次增加的數字會是 10。

接著先嘗試編譯看看，終端機打上 `npx hardhat compile`，應該會看到編譯成功：

```
Compiled 18 Solidity files successfully
```

## 測試合約

首先到 `hardhat.config.js` 加一下剛剛新增的套件，不然無法使用

```js
require('@openzeppelin/hardhat-upgrades') // [!code  warning]
```

回到 `/test` 資料夾內，建立 `uups.test.js` 貼上下面的程式碼：

::: code-group

```js[./test/uups.test.js]
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");


describe("Uups test", function () {
  const deployFixture = async () => {
    const [owner, otherAccount] = await ethers.getSigners();
    const Contract = await ethers.getContractFactory("Uups");
    const contract = await upgrades.deployProxy(Contract, [], { initializer: 'initialize' });
    return { contract, owner, otherAccount };
  }

  describe("升級合約", async () => {
    it("測試 myNumber 為 1", async () => {
      const { contract } = await loadFixture(deployFixture);
      const myNumber = await contract.myNumber();
      expect(myNumber).to.equal(1);
    })

    it("測試 addNumber", async () => {
      const { contract } = await loadFixture(deployFixture);
      await contract.addMyNumber();
      const myNumber = await contract.myNumber();
      expect(myNumber).to.equal(2);
    })

    it("升級成 UUPS V2、並測試 addMyNumber", async () => {
      const { contract } = await loadFixture(deployFixture);
      const ContractV2 = await ethers.getContractFactory("UupsV2");
      const contractV2 = await upgrades.upgradeProxy(contract, ContractV2);

      await contractV2.addMyNumber();
      const myNumber = await contractV2.myNumber();
      expect(myNumber).to.equal(11);
    })
  });
});


```

:::

在「deployFixture」中，首先使用 `ethers.getContractFactory("Uups")` 取得合約，並用會先透過 `upgrades.deployProxy` 建立 `Proxy Contract`，在之後我們都是調用它。Hardhat 建議我們在每次測試都調用 `deployFixture` ，因此把裡面的合約，或是其他東西 return 出來，在其他單元測試中解構就好。

調用 abi 是屬於非同步行為，所以都會使用 async function，`contract.addMyNumber()` 則是調用我們在合約中建立的 function addMyNumber。

最後要將合約升級為 V2，使用 `upgrades.upgradeProxy(合約, 合約 V2)` 即可。在「升級成 UUPS V2、並測試 addMyNumber」這段中，升級合約後，成功透過 `addMyNumber()` 將 `myNumber` 變成 11。

### 如果出現...

```shell
contracts\Uups.sol:13: Contract `Uups` has a constructor
Define an initializer instead
https://zpl.in/upgrades/error-001
```

請確認這行有沒有放在 constructor 上面

```solidity
/// @custom:oz-upgrades-unsafe-allow constructor
```
