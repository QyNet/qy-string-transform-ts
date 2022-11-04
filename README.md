# qy-string-transform-ts
简易字符串内容转换TypeScript版本

## 如何安装

```
npm install qy-string-transform-ts
```
或者
```
yarn qy-string-transform-ts
```

## 如何使用

### 将英文转大小驼峰和下划线链接

```
import { Loader } from "qy-string-transform-ts";

let title = 'Products | Services'
console.log(Loader.parse_name(title, 0, true))
// "products_services"
console.log(Loader.parse_name(title, 1, true))
// "ProductsServices"
console.log(Loader.parse_name(title, 1, false))
// "productsServices"
```

### 简易中文简繁转换
提供基于 MediaWiki 和 OpenCC 词汇表的最大正向匹配简繁转换，支持地区词转换：zh-cn, zh-tw, zh-hk, zh-sg, zh-hans, zh-hant。TypeScript、node、React通用。

```
console.log(convert(u'我幹什麼不干你事。', 'zh-cn'))
// "我干什么不干你事。"
console.log(convert(u'人体内存在很多微生物', 'zh-tw'))
// "人體內存在很多微生物"

```
其中，zh-hans, zh-hant 仅转换简繁，不转换地区词。

完整支持 MediaWiki 人工转换语法：

```
console.log(convert_for_mw(u'在现代，机械计算-{}-机的应用已经完全被电子计算-{}-机所取代', 'zh-hk'))
// 在現代，機械計算機的應用已經完全被電子計算機所取代
console.log(convert_for_mw(u'-{zh-hant:資訊工程;zh-hans:计算机工程学;}-是电子工程的一个分支，主要研究计算机软硬件和二者间的彼此联系。', 'zh-tw'))
// 資訊工程是電子工程的一個分支，主要研究計算機軟硬體和二者間的彼此聯繫。
console.log(convert_for_mw(u'張國榮曾在英國-{zh:利兹;zh-hans:利兹;zh-hk:列斯;zh-tw:里茲}-大学學習。', 'zh-sg'))
// 张国荣曾在英国利兹大学学习。
console.log(convert_for_mw('毫米(毫公分)，符號mm，是長度單位和降雨量單位，-{zh-hans:台湾作-{公釐}-或-{公厘}-;zh-hant:港澳和大陸稱為-{毫米}-（台灣亦有使用，但較常使用名稱為毫公分）;zh-mo:台灣作-{公釐}-或-{公厘}-;zh-hk:台灣作-{公釐}-或-{公厘}-;}-。', 'zh-cn'))
// 毫米(毫公分)，符号mm，是长度单位和降雨量单位，台湾作公釐或公厘。
```

和其他[高级字词转换语法](https://zh.wikipedia.org/wiki/Help:%E9%AB%98%E7%BA%A7%E5%AD%97%E8%AF%8D%E8%BD%AC%E6%8D%A2%E8%AF%AD%E6%B3%95)。

转换字典可下载 [MediaWiki 源码包](https://www.mediawiki.org/wiki/Download)中的 includes/ZhConversion.php，使用 convmwdict.py 可转换成 json 格式。

代码授权协议采用 Apache-2.0 协议；转换表由于来自 MediaWiki，为 GPLv2+ 协议。