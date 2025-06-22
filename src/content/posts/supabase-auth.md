---
title: Supabase 讀取使用者的資料表
date: 2025-06-22
summary: sss
category: 前端
tags: [javascript]
---

[Supabase](https://supabase.com/) 提供了非常方便的登入功能，而且還整合了許多第三方登入，前端在註冊成功後會新增到 Supabase 內建的 Auth 這張資料表，不過這張資料表並沒辦法透過 API 去操作，也就是 CRUD 都不允許。

如果是一般服務可能還好，但如果你的服務是需要看到其他人的資料，例如交友軟體這種，這時候就沒辦法看到別人資料。

因此解決方法就是在註冊成功後，再把資料寫進我們建立的 Public 資料表中。

## 建立 profile 表

先建立這張 public 的表。

```sql
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  name text,
  primary key (id)
);

alter table public.profiles enable row level security;
```

如果是用網頁介面建立，記得要開 `RLS` 不然等等拿不到資料

## 建立 Database Functions

```sql
-- 插入到 public.profiles 這張表
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id, new.raw_user_meta_data ->> 'name',
  );
  return new;
end;
$$;

-- 有新增使用者時觸發
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

後續要修改這個 `handle_new_user`，例如新增欄位的話，可以打開左邊選單的 `Database` > `Functions` > schema 選擇 `public`。

## 前端調用

不管用第三方登入，或是內建的 email 登入都會觸發。

```javascript
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)

const { data, error } = await supabase.auth.signUp({
  email: 'test666@gmail.com',
  password: '12345678',
})
```
