function capitalize(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1)
}

export class Loader {
    
    /**
     * 解析名称
     * 可解析为大驼峰/小驼峰/下划线链接
     * @date 11/4/2022 - 10:46:21 AM
     *
     * @static
     * @param {string} name
     * @param {number} [parse_type=0]
     * @param {boolean} [ucfirst=true]
     * @returns {*}
     */
    static parse_name(name: string, parse_type = 0, ucfirst = true) {
        if (name.indexOf('|') > 0) {
            let arrs = name.split('|').filter(item => item.trim())
            arrs = arrs.map((item) => { return item.trim() })
            name = arrs.join('_')
        }
        if (name.indexOf('-') > 0) {
            let arrs = name.split('-').filter(item => item.trim())
            arrs = arrs.map((item) => { return item.trim() })
            name = arrs.join('_')
        }
        if (name.indexOf('/') > 0) {
            let arrs = name.split('/').filter(item => item.trim())
            arrs = arrs.map((item) => { return item.trim() })
            name = arrs.join('_')
        }
        if (name.indexOf(' ') > 0) {
            let arrs = name.split(' ').filter(item => item.trim())
            arrs = arrs.map((item) => { return item.trim() })
            name = arrs.join('_')
        }
        if (!name) {
            return name
        }
        if (parse_type) {
            if (ucfirst) {
                return name.split("_").map((x) => { return capitalize(x) }).join("")
            } else {
                let src = []
                let src_list: string[] = name.split("_")
                for (let value of src_list) {
                    if (src_list.indexOf(value) == 0) {
                        src.push(value.toLowerCase())
                    } else {
                        src.push(capitalize(value))
                    }
                }
                return src.join("")
            }
        } else {
            return name.toLowerCase().replace(" ", "_")
        }
    }
}
