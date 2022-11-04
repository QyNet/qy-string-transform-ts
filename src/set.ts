export class Set {
    values: any = {} // values 以键值对的形式表示集合的数据
    n = 0 // n 集合中值的个数
    // 在 Set._v2s.next 方法上定义一个自定义属性 next，初始值为 100
    // 这样做的好处是，避免了全局变量污染，并且将该属性与对应的方法绑定在一起
    static next = 100

    constructor(...aa: []) {
        // arguments 是实际参数的一个类数组对象
        // 保证在 new Set(1,'sarah',{}) 初始化构造函数时调用原型上的 add 方法，将传入的参数添加到集合中
        this.add.apply(this, aa);
    }

    // 将每个参数添加至集合中
    add(...vals: any[]) {
        // 遍历每一个参数
        for (let val of vals) {
            let str = Set._v2s(val); // 键：通过值得到相应的键
            // 保证集合无重复值
            if (!this.values.hasOwnProperty(str)) {
                this.values[str] = val;
                this.n++; // 集合中值的计数加一
            }
        }
        return this; // 支持链式调用
    }

    // 删除元素
    remove() {
        // 遍历每一个参数
        for (var i = 0; i < arguments.length; i++) {
            var str = Set._v2s(arguments[i]); // 通过值得到相应的键
            if (this.values.hasOwnProperty(str)) { // 若 values 集合中存在该属性
                delete this.values[str];  // 删除元素
                this.n--; // 集合中值的计数减一
            }
        }
        return this; // 支持链式调用
    }

    // 检测是否包含某个值
    contains(value: string) {
        return this.values.hasOwnProperty(Set._v2s(value));
    }

    // 返回集合的大小
    size() {
        return this.n;
    }

    // 遍历集合中的所有元素，在指定的上下文中调用回调函数 f
    foreach(f: any, context: any) {
        for (var s in this.values) {
            if (this.values.hasOwnProperty(s)) {
                f.call(context, this.values[s]);
            }
        }
    }

    // 在 Set 方法上定义一个自定义属性 _v2s
    // 该属性的值是一个方法，用于将传入的值转成对应的字符串（其实就像是打标签）
    static _v2s(val: any) {
        switch (val) {
            case undefined: return 'u';  // 如果是 undefined，就返回 'u'
            case null: return 'n';
            case true: return 't';
            case false: return 'f';
            default: switch (typeof val) {
                case 'number': return '#' + val;  // 如果是数字，就添加 # 前缀 ,例如 #123, #0.5
                case 'string': return '"' + val;  // 如果是字符串，就添加 " 前缀 , 例如 "hello, "world
                default: return '@' + objectId(val); // 如果是数组、函数、对象等，就添加 @ 前缀，objectId 方法会返回一个特定数字，如：@100
            }
        }

        function objectId(o: any) {
            var prop = "|**objectid**|";  // 给数组/ 函数/ 对象定义一个私有属性，用以存放 id
            if (!o.hasOwnProperty(prop)) { // 添加该属性前先判断该对象是否已经存在该属性
                o[prop] = Set.next++; // 不存在则添加该属性，值为 next
            }
            return o[prop];
        }
    }
}
