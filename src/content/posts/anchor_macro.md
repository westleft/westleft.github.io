---
title: Anchor macro
date: 2025-06-14
summary: ' s'
category: 前端
tags: [solana]
---

## #[program]

`#[program]` 是 Anchor 提供的一個 Macro，它會告訴 Anchor：

1. 定義指令（Instruction）的對外 API：自定義對外公開的程式碼（function），如下程式碼範例。
2. 與 Solana SDK 互動：Anchor 幫我們封裝了 `declared_id`、`Account` 等，不需要寫底層的 Solana 互動程式碼。
3. 自動產生介面定義語言 (IDL)

以下是範例：

```rust
#[program]
mod anchor_counter {
    pub fn instruction_one(ctx: Context<InstructionAccounts>, data: u64) -> Result<()> {
        ctx.accounts.counter.data = data;
        Ok(())
    }
}

```

> 備註：`mod anchor_counter` 命名是自定義的，前端在呼叫不會用到 `anchor_counter` 該詞。

### IDL 是什麼？

當你跑 `anchor build`，Anchor 會自動幫你產出一個 `target/idl/your_project_name.json` 檔案。

這個檔案就像是告訴前端：「這個智能合約有哪幾個可以呼叫的 function，名稱是什麼，要傳什麼帳戶、參數。」

上面的合約中，我們就可以這樣在前端調用：

```javascript
await program.methods
  .instructionOne(new BN(999)) // 你要寫進鏈上的數字
  .accounts({
    counter: counterPda, // 對應 InstructionAccounts.counter
    user: wallet.publicKey, // InstructionAccounts.user
    systemProgram: SystemProgram.programId, // InstructionAccounts.system_program
  })
  .signers([wallet.payer]) // 有需要時要簽名
  .rpc() // 執行這個指令！
```

## 關於 Context 型別

在 Anchor 中，每個 `instruction function` 都會有一個參數 `ctx: Context<XXXAccounts>`。這個 Context 是一個泛型結構，代表「這次執行指令的上下文」

```rust
#[program]
mod anchor_counter {
    pub fn initialize(ctx: Context<InitializeAccounts>, instruction_data: u64) -> Result<()> {
        ctx.accounts.counter.count = instruction_data;
        Ok(())
    }
}
```

實際的操作會在 `Context` 後面接上泛型，是由開發者自己定義的 `struct`，例如下面的 `InitializeAccounts`。

```rust
pub struct InitializeAccounts<'info> {
    #[account(
        init,  // 初始化帳戶的動作（第一次創這個帳戶）。
        seeds = [b"my_seed", user.key.to_bytes().as_ref()], // 帳戶的「種子資料」，Anchor 會用它來算出一個 PDA
        payer = user, // 代表這個帳戶要初始化，而誰來付 SOL？ ➜ 是 user。
        space = 8 + 8 // 這個帳戶佔多少空間（byte）
    )]

    // 這是一個 PDA 帳戶，裡面存的是 Counter 資料結構，這帳戶在這次指令執行中有效。
    pub pda_counter: Account<'info, Counter>,

    // 使用者錢包帳戶，會幫這筆交易簽名，用來當 payer，也會作為 PDA 的種子之一。
    #[account(mut)]
    pub user: Signer<'info>,

    // 這是 Solana 內建的系統程式帳戶，負責建立帳戶、轉帳、初始化等功能。
    pub system_program: Program<'info, System>,
}
```

回到 Context，他可以取到以下資料：

1. `ctx.program_id`：目前正在執行這個指令的 program（合約）地址，通常拿來比對帳戶 owner 是不是你自己寫的合約。
2. `ctx.accounts`：這是 Anchor 幫你解析後、型別化的帳戶清單。不用再手動解析帳戶、驗證權限，Anchor 會自動幫你做（根據你在 #[account(...)] 上標註的規則）。
3. `ctx.remaining_accounts`：除了你在 ctx.accounts 中列出的帳戶以外，前端「額外傳進來」的帳戶。例如一些需要動態處理的帳戶（像是轉帳給多個人）。

## #[derive(Accounts)]

`#[derive(Accounts)]` 實現了序列化/反序列化、和執行程式時的安全檢查。

```rust
#[derive(Accounts)]
pub struct InitializeAccounts<'info> {
    #[account(init, seeds = [b"my_seed", user.key.to_bytes().as_ref()], payer = user, space = 8 + 8)]
    pub pda_counter: Account<'info, Counter>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}
```

執行時，會去檢查兩件事情：

1. 帳號類型驗證：檢查傳遞進來的 Account 是否符合型別。
2. 帳號權限驗證

如果任何一項檢查失敗，都會導致指令執行失敗並產生錯誤。

## #[account]

在 Anchor 中，#[account] 是一個特殊的宏，用於處理序列化（反）操作、帳戶鑑別器以及帳戶所有權驗證。該巨集顯著簡化了開發流程，使開發人員能夠更加專注於業務邏輯，而不是底層帳戶處理。

```rust
// #[account] macro on the account struct
#[account]
pub struct MyAccount {
    pub my_data: u64,
}
```

> https://docs.rs/anchor-lang/latest/anchor_lang/derive.Accounts.html
