# qy-string-transform-ts
简易字符串内容转换TypeScript

## 如何安装

```
npm install qy-string-transform-ts
```
或者
```
yarn qy-string-transform-ts
```

## 如何使用

将英文转大小驼峰和下划线链接

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