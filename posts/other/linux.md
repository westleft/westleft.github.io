---
title: 簡易 Linux 指令
date: 2023-12-25
tag: 學習
---

# Linux 筆記

## 指令

* `pwd`：印出當前目錄
* `ls`：當前目錄下的文件（夾）
* `ls -l`：當前目錄下的文件（夾）屬性
* `ls -a`：當前目錄下的文件（夾）包含隱藏文件 `all`

![image.png](https://hackmd-prod-images.s3-ap-northeast-1.amazonaws.com/uploads/upload_2c44f2850c6b4e65c484620a93f9c1b5.png?AWSAccessKeyId=AKIA3XSAAW6AWSKNINWO&Expires=1703501039&Signature=C%2BIJWIjK8e9J%2BjY9KKlhZ7byxZc%3D)

* `ls --help`：印出 ls 提供的方法
* `ls -t`：照修改順序
* `touch deom.txt`：新增 deom.txt
* `rm deom.txt`：刪除 deom.txt
* `re -rf demo`：強制刪除 deom 資料夾&裡面的東西
* `mkdir -p deom/deom2/deom3`：依序創建 `deom/deom2/deom3`
* * 如果沒有 `-p` 又沒有該資料夾 會出錯
* `history`：印出歷史紀錄
* 
![image.png](https://hackmd-prod-images.s3-ap-northeast-1.amazonaws.com/uploads/upload_3477ed38040f825a249c614f8aa7cbfb.png?AWSAccessKeyId=AKIA3XSAAW6AWSKNINWO&Expires=1703501070&Signature=wlcYq%2BXjvw8yymJg%2BM4aaGCWZfI%3D)

* `cat etc/profile`：印出 `etc/profile` 的檔案內容
* * `cat -b etc/profile`：印出 `etc/profile` 的檔案內容 + 行數

![image.png](https://hackmd-prod-images.s3-ap-northeast-1.amazonaws.com/uploads/upload_b4962d8bf6013e6dc919d3b87fe2bfa4.png?AWSAccessKeyId=AKIA3XSAAW6AWSKNINWO&Expires=1703501078&Signature=G96j0UuOhD1pOwmeNw8U8i229dk%3D)

* `cat test1.txt test2.txt`：印出 test1.txt 和 test2.txt 的內容
* `cat test1.txt test2.txt >> test3.txt`：將兩個檔案合併成 test3.txt
* `more test.txt`：印出 `test.txt` 的檔案 按照%數
* * `b` 往前 `f` 往後

## VI/VIM

![image.png](https://hackmd-prod-images.s3-ap-northeast-1.amazonaws.com/uploads/upload_6e9c89d65dd16364881f6ffeaa06cdd8.png?AWSAccessKeyId=AKIA3XSAAW6AWSKNINWO&Expires=1703501085&Signature=e4z7uV6wXe4Xjvs00yEzjEevL4k%3D)

`HJKL` 可以上下左右移動

![image.png](https://hackmd-prod-images.s3-ap-northeast-1.amazonaws.com/uploads/upload_6b38ecd04ce6ad5a6c38c1c0d9bf39b3.png?AWSAccessKeyId=AKIA3XSAAW6AWSKNINWO&Expires=1703501091&Signature=PoAl07K5pltcaHex6r39xSwFZko%3D)

* `:set nu`：顯示行號
* `:17`：移動到 17 行
* `e` or `b`：移動單字的結尾或開頭

### insert

![image.png](https://hackmd-prod-images.s3-ap-northeast-1.amazonaws.com/uploads/upload_92d4a1f5bdbe7818392ef4f1c4fdfa62.png?AWSAccessKeyId=AKIA3XSAAW6AWSKNINWO&Expires=1703501097&Signature=RjRObbIK7D%2BilDOPNIGEBiRIDYY%3D)

![image.png](https://hackmd-prod-images.s3-ap-northeast-1.amazonaws.com/uploads/upload_73ed3d8ff046ec5792069d5436e3d429.png?AWSAccessKeyId=AKIA3XSAAW6AWSKNINWO&Expires=1703501102&Signature=D6oGD4XzXfYWOXcC4XBjsklXLhI%3D)

![image.png](https://hackmd-prod-images.s3-ap-northeast-1.amazonaws.com/uploads/upload_2852e790ce0ca406a3d3f54853029380.png?AWSAccessKeyId=AKIA3XSAAW6AWSKNINWO&Expires=1703501107&Signature=gFH6Z4GrJ%2BBUOUGWLmrKzQXyX60%3D)

![image.png](https://hackmd-prod-images.s3-ap-northeast-1.amazonaws.com/uploads/upload_7801f4e19af7c482c80dee322dd8e15f.png?AWSAccessKeyId=AKIA3XSAAW6AWSKNINWO&Expires=1703501113&Signature=%2FlDksIAYGL0eiflAMWrXNXGhrH0%3D)

![image.png](https://hackmd-prod-images.s3-ap-northeast-1.amazonaws.com/uploads/upload_6ec654e8c476ef7f9e15dc2abfd85903.png?AWSAccessKeyId=AKIA3XSAAW6AWSKNINWO&Expires=1703501118&Signature=REdgOn8yogU1KD7C%2FnN%2FaPjuXn4%3D)

![image.png](https://hackmd-prod-images.s3-ap-northeast-1.amazonaws.com/uploads/upload_56ca7f1ae3cdc246ef3befb292da2451.png?AWSAccessKeyId=AKIA3XSAAW6AWSKNINWO&Expires=1703501123&Signature=xxHnQZJGIiE79C75NIQcPJtoxIM%3D)



## user

system user & reglaur user

前面有 # 代表是 root 使用者

* `/etc/password`  查看用戶
* `/etc/group`
* `su demo`: 切換成 demo 使用者
* `su`: 切換成 root 使用者


[Ubuntu] 解決 xxx is not in the sudoers file
https://jerrynest.io/xxx-is-not-in-the-sudoers-file/

![image.png](https://hackmd-prod-images.s3-ap-northeast-1.amazonaws.com/uploads/upload_08e0bb8cf64c163fbd4292ee6402e0f8.png?AWSAccessKeyId=AKIA3XSAAW6AWSKNINWO&Expires=1703501132&Signature=y4LYf3f5z90d9VYMuOJNqTWGTgs%3D)


![image.png](https://hackmd-prod-images.s3-ap-northeast-1.amazonaws.com/uploads/upload_021ddb4e4abfc0821496b46911e7d750.png?AWSAccessKeyId=AKIA3XSAAW6AWSKNINWO&Expires=1703501137&Signature=QP60cYThlRq4nTD%2BnExwjjsKNh4%3D)


![image.png](https://hackmd-prod-images.s3-ap-northeast-1.amazonaws.com/uploads/upload_4beb1f6ceafeed3f53b4cb2cd3dde85c.png?AWSAccessKeyId=AKIA3XSAAW6AWSKNINWO&Expires=1703501146&Signature=7336q1c0e27pTL84ZjaTXQpXlEk%3D)

* d 文件夾
* rwx 代表 可讀、可寫、可執行

![image.png](https://hackmd-prod-images.s3-ap-northeast-1.amazonaws.com/uploads/upload_0c2f7e0e5954d9132959a7c52ab258da.png?AWSAccessKeyId=AKIA3XSAAW6AWSKNINWO&Expires=1703501153&Signature=uZeF9aoieYf3BVZB3bdYYTVYFEE%3D)

* `chmod` 修改權限


## 網路

* DNS
* GATEWAY
* DHCP
* NAT 網路地址轉換

![image.png](https://hackmd-prod-images.s3-ap-northeast-1.amazonaws.com/uploads/upload_acea046fb50c90b1d8aa088a29012869.png?AWSAccessKeyId=AKIA3XSAAW6AWSKNINWO&Expires=1703501159&Signature=1z8BvBfMVSBSDpjkF7sH0PZDbcU%3D)


* `apt install vim`：安裝 vim

## ssh 建立安全連接

輸入 `ifconfig`

ubuntu
安裝 `sudo apt-get install openssh-server`

連線 `ssh xxx576@192.168.56.101`


## ssh public key

開 `git bash` 生成  `ssh public key` & `private key`
```
ssh-keygen
```

傳到 linux

```
 ssh-copy-id xxx576@192.168.56.101
```

接著輸入密碼後，開始連線

```
 ssh xxx576@192.168.56.101
```

exit 離開

### scp

![image.png](https://hackmd-prod-images.s3-ap-northeast-1.amazonaws.com/uploads/upload_864aa2dce4a8814cc99c332ac1ae7971.png?AWSAccessKeyId=AKIA3XSAAW6AWSKNINWO&Expires=1703501168&Signature=PerEUnQYgGWuN5%2B65PKxvIEICAg%3D)

```
scp tmp/test.txt xxx576@192.168.56.101:/hone/demo
```
