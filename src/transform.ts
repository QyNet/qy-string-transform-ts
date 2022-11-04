/*
This module implements a simple conversion and localization between simplified and traditional Chinese using tables from MediaWiki.
It doesn't contains a segmentation function and uses maximal forward matching, so it's simple.
For a complete and accurate solution, see OpenCC.
For Chinese segmentation, see Jieba.
    >>> console.log(convert('我幹什麼不干你事。', 'zh-cn'))
    我干什么不干你事。
    >>> console.log(convert('人体内存在很多微生物', 'zh-tw'))
    人體內存在很多微生物
Support MediaWiki's convertion format:
    >>> console.log(convert_for_mw('在现代，机械计算-{}-机的应用已经完全被电子计算-{}-机所取代', 'zh-hk'))
    在現代，機械計算機的應用已經完全被電子計算機所取代
    >>> console.log(convert_for_mw('-{zh-hant:資訊工程;zh-hans:计算机工程学;}-是电子工程的一个分支，主要研究计算机软硬件和二者间的彼此联系。', 'zh-tw'))
    資訊工程是電子工程的一個分支，主要研究計算機軟硬體和二者間的彼此聯繫。
    >>> console.log(convert_for_mw('張國榮曾在英國-{zh:利兹;zh-hans:利兹;zh-hk:列斯;zh-tw:里茲}-大学學習。', 'zh-sg'))
    张国荣曾在英国利兹大学学习。
*/
// Only Python3 can pass the doctest here due to unicode problems.

// import os
// import sys
// import re
// import json

// Locale fallback order lookup dictionary
const Locales: any = {
    'zh-cn': ['zh-cn', 'zh-hans', 'zh-sg', 'zh'],
    'zh-hk': ['zh-hk', 'zh-hant', 'zh-tw', 'zh'],
    'zh-tw': ['zh-tw', 'zh-hant', 'zh-hk', 'zh'],
    'zh-sg': ['zh-sg', 'zh-hans', 'zh-cn', 'zh'],
    'zh-my': ['zh-my', 'zh-sg', 'zh-hans', 'zh-cn', 'zh'],
    'zh-mo': ['zh-mo', 'zh-hk', 'zh-hant', 'zh-tw', 'zh'],
    'zh-hant': ['zh-hant', 'zh-tw', 'zh-hk', 'zh'],
    'zh-hans': ['zh-hans', 'zh-cn', 'zh-sg', 'zh'],
    'zh': ['zh',] // special value for no conversion
}

const _DEFAULT_DICT = "zhcdict.json"
import { Set } from './set'
import * as variable from './zhcdict.json'
const DICTIONARY = _DEFAULT_DICT

let zhcdicts: any = variable
let dict_zhcn: any = null
let dict_zhsg: any = null
let dict_zhtw: any = null
let dict_zhhk: any = null
let pfsdict: any = {}

const RE_langconv = /(-\{|\}-)/
const RE_splitflag = /\s*\|\s*/
const RE_splitmap = /\s*;\s*/
const RE_splituni = /\s*=>\s*/
const RE_splitpair = /\s*:\s*/

function range(value: number) {
    return [...new Array(value).keys()]
}

function any(flag: any) {
    for (let ch in 'ATRD-HN'.split("")) {
        if (flag.includes(ch)) {
            return true
        }
    }
    return false
}

/**
 * 生成或获取特定地区的转换字典缓存。
 * @date 11/4/2022 - 11:10:24 AM
 *
 * @param {string} locale
 * @returns {*}
 */
function getdict(locale: string) {
    let got
    if (locale == 'zh-cn') {
        // if (dict_zhcn) {
        //     got = dict_zhcn
        // } else {
        //     dict_zhcn = JSON.parse(JSON.stringify(zhcdicts['zh2Hans']))
        //     got = { ...dict_zhcn, ...zhcdicts['zh2CN'] }
        // }
        dict_zhcn = JSON.parse(JSON.stringify(zhcdicts['zh2Hans']))
        got = { ...dict_zhcn, ...zhcdicts['zh2CN'] }
    } else if (locale == 'zh-tw') {
        // TODO 第二次调用异常：got.hasOwnProperty('硬件') 为false
        // if (dict_zhtw) {
        //     got = dict_zhtw
        // } else {
        //     dict_zhtw = JSON.parse(JSON.stringify(zhcdicts['zh2Hant']))
        //     got = { ...dict_zhtw, ...zhcdicts['zh2TW'] }
        // }
        dict_zhtw = JSON.parse(JSON.stringify(zhcdicts['zh2Hant']))
        got = { ...dict_zhtw, ...zhcdicts['zh2TW'] }
    } else if (locale == 'zh-hk' || locale == 'zh-mo') {
        // if (dict_zhhk) {
        //     got = dict_zhhk
        // } else {
        //     dict_zhhk = JSON.parse(JSON.stringify(zhcdicts['zh2Hant']))
        //     got = { ...dict_zhhk, ...zhcdicts['zh2HK'] }
        // }
        dict_zhhk = JSON.parse(JSON.stringify(zhcdicts['zh2Hant']))
        got = { ...dict_zhhk, ...zhcdicts['zh2HK'] }
    } else if (locale == 'zh-sg' || locale == 'zh-my') {
        // if (dict_zhsg) {
        //     got = dict_zhsg
        // } else {
        //     dict_zhsg = JSON.parse(JSON.stringify(zhcdicts['zh2Hans']))
        //     got = { ...dict_zhsg, ...zhcdicts['zh2SG'] }
        // }
        dict_zhsg = JSON.parse(JSON.stringify(zhcdicts['zh2Hans']))
        got = { ...dict_zhsg, ...zhcdicts['zh2SG'] }
    } else if (locale == 'zh-hans') {
        got = zhcdicts['zh2Hans']
    } else if (locale == 'zh-hant') {
        got = zhcdicts['zh2Hant']
    } else {
        got = {}
    }
    if (!pfsdict.hasOwnProperty(locale)) {
        pfsdict[locale] = getpfset(got)
    }
    return got
}

function getpfset(convdict: any) {
    let pfset = []
    for (let word in convdict) {
        for (let ch of range(word.length)) {
            pfset.push(word.slice(0, ch + 1))
        }
    }
    return pfset
}

// function issimp(s, full=false) {
//     /*
//     Detect text is whether Simplified Chinese or Traditional Chinese.
//     Returns true for Simplified; false for Traditional; null for unknown.
//     If full=false, it returns once first simplified- or traditional-only
//     character is encountered, so it's for quick and rough identification;
//     else, it compares the count and returns the most likely one.
//     Use `is` (true/false/null) to check the result.
//     `s` must be unicode (Python 2) or str (Python 3), or you'll get null.
//     */

//     let simp = 0, trad = 0
//     if (full) {
//         for (let ch in s) {
//             if (ch in zhcdicts['SIMPONLY']) {
//                 simp += 1
//             } else if (ch in zhcdicts['TRADONLY']) {
//                 trad += 1
//             }
//         }
//         if (simp > trad) {
//             return true
//         } else if (simp < trad) {
//             return false
//         } else {
//             return null
//         }
//     } else {
//         for (let ch in s) {
//             if (ch in zhcdicts['SIMPONLY']) {
//                 return true
//             } else if (ch in zhcdicts['TRADONLY']) {
//                 return false
//             }
//         }
//         return null
//     }
// }

function fallback(locale: string, mapping: any) {
    for (let l of Locales[locale]) {
        if (mapping.hasOwnProperty(l)) {
            return mapping[l]
        }
    }
    let value = Object.values(mapping)
    if (value && value.length) {
        return convert(String(value[0]), locale)
    }
    return ''
}

function convtable2dict(convtable: any, locale: string, update = null) {
    /*
    Convert a list of conversion dict to a dict for a certain locale.
    >>> sorted(convtable2dict([{'zh-hk': '列斯', 'zh-hans': '利兹', 'zh': '利兹', 'zh-tw': '里茲'}, {':uni': '巨集', 'zh-cn': '宏'}], 'zh-cn').items())
    [('列斯', '利兹'), ('利兹', '利兹'), ('巨集', '宏'), ('里茲', '利兹')]
    */
    let rdict = update ? JSON.parse(JSON.stringify(update)) : {}
    for (let r of convtable) {
        if (r.hasOwnProperty(':uni')) {
            if (r.hasOwnProperty(locale)) {
                rdict[r[':uni']] = r[locale]
            }
        } else if (locale.slice(0, -1) == 'zh-han') {
            if (r.hasOwnProperty(locale)) {
                for (let word in r.values()) {
                    rdict[word] = r[locale]
                }
            }
        } else {
            let v = fallback(locale, r)
            for (let word in r.values()) {
                rdict[word] = v
            }
        }
    }
    return rdict
}

// function tokenize(s, locale, update=null) {
//     /*
//     Tokenize `s` according to corresponding locale dictionary.
//     Don't use this for serious text processing.
//     */
//     let zhdict = getdict(locale)
//     let pfset = pfsdict[locale]
//     if (update) {
//         zhdict = JSON.parse(JSON.stringify(zhdict))
//         zhdict.update(update)
//         let newset = new Set()
//         for (let word in update) {
//             for (let ch of range(word.length)) {
//                 newset.add(word[:ch+1])
//             }
//         }
//         pfset = pfset | newset
//     }
//     let ch = []
//     let N = s.length
//     let pos = 0
//     while (pos < N) {
//         let i = pos
//         let frag = s[pos]
//         let maxword = null
//         let maxpos = 0
//         while (i < N && frag in pfset) {
//             if (frag in zhdict) {
//                 maxword = frag
//                 maxpos = i
//             }
//             i += 1
//             frag = s[pos:i+1]
//         }
//         if (maxword is null) {
//             maxword = s[pos]
//             pos += 1
//         } else {
//             pos = maxpos + 1
//         }
//         ch.push(maxword)
//     }
//     return ch
// }



/**
 * 主要的转换方法
 * @date 11/4/2022 - 11:00:10 AM
 *
 * @param {string} str
 * @param {string} locale ('zh-hans', 'zh-hant', 'zh-cn', 'zh-sg', 'zh-tw', 'zh-hk', 'zh-my', 'zh-mo')
 * @param {*} [update=null] 更新转换表 {'from1': 'to1', 'from2': 'to2'}
 * @returns {*}
 * console.log(convert('我幹什麼不干你事。', 'zh-cn'))
 * // 我干什么不干你事。
 * console.log(convert('我幹什麼不干你事。', 'zh-cn', {'不干': '不幹'}))
 * // 我干什么不幹你事。
 * console.log(convert('人体内存在很多微生物', 'zh-tw', {'不干': '不幹'}))
 * // 人體內存在很多微生物
 */
function convert(str: string, locale: string, update: any = null) {
    if (locale == 'zh' || !Locales.hasOwnProperty(locale)) {
        // "no conversion"
        return str
    }
    let zhdict = getdict(locale)
    let pfset = pfsdict[locale]
    let newset = new Set()
    if (update) {
        // TODO: some sort of caching
        //zhdict = JSON.parse(JSON.stringify(zhdict))
        //zhdict.update(update)
        newset = new Set()
        for (let word in update) {
            if (update.hasOwnProperty(word)) {
                for (let ch of range(word.length)) {
                    newset.add(word.slice(0, ch + 1))
                }
            }
        }
        //pfset = pfset | newset
    }
    let ch: any[] = []
    let N = str.length
    let pos = 0
    while (pos < N) {
        let i = pos
        let frag = str[pos]
        let maxword = null
        let maxpos = 0
        while (i < N && (pfset.includes(frag) || newset.contains(frag))) {
            if (update && update.hasOwnProperty(frag)) {
                maxword = update[frag]
                maxpos = i
            } else if (zhdict.hasOwnProperty(frag)) {
                maxword = zhdict[frag]
                maxpos = i
            }
            i += 1
            frag = str.slice(pos, i + 1)
        }
        if (maxword == null) {
            maxword = str[pos]
            pos += 1
        } else {
            pos = maxpos + 1
        }
        ch.push(maxword)
    }
    return ch.join('')
}

export {
    convert,
    convert_for_mw
}


/**
 * 识别MediaWiki的人工转换格式。
 * 使用locale='zh'不进行转换。
 * 参考:(所有测试都通过)
 * https://zh.wikipedia.org/wiki/Help:高级字词转换语法
 * https://www.mediawiki.org/wiki/Writing_systems/Syntax
 * @date 11/4/2022 - 1:54:37 PM
 *
 * @param {string} str
 * @param {string} locale
 * @param {*} [update=null]
 * @returns {*}
 * console.log(convert_for_mw('在现代，机械计算-{}-机的应用已经完全被电子计算-{}-机所取代', 'zh-hk'))
 * // 在現代，機械計算機的應用已經完全被電子計算機所取代
 * console.log(convert_for_mw('-{zh-hant:資訊工程;zh-hans:计算机工程学;}-是电子工程的一个分支，主要研究计算机软硬件和二者间的彼此联系。', 'zh-tw'))
 * // 資訊工程是電子工程的一個分支，主要研究計算機軟硬體和二者間的彼此聯繫。
 * console.log(convert_for_mw('張國榮曾在英國-{zh:利兹;zh-hans:利兹;zh-hk:列斯;zh-tw:里茲}-大学學習。', 'zh-hant'))
 * // 張國榮曾在英國里茲大學學習。
 * console.log(convert_for_mw('張國榮曾在英國-{zh:利兹;zh-hans:利兹;zh-hk:列斯;zh-tw:里茲}-大学學習。', 'zh-sg'))
 * // 张国荣曾在英国利兹大学学习。
 * convert_for_mw('-{zh-hant:;\\nzh-cn:}-', 'zh-tw') == ''
 * // true
 * console.log(convert_for_mw('毫米(毫公分)，符號mm，是長度單位和降雨量單位，-{zh-hans:台湾作-{公釐}-或-{公厘}-;zh-hant:港澳和大陸稱為-{毫米}-（台灣亦有使用，但較常使用名稱為毫公分）;zh-mo:台灣作-{公釐}-或-{公厘}-;zh-hk:台灣作-{公釐}-或-{公厘}-;}-。', 'zh-tw'))
 * // 毫米(毫公分)，符號mm，是長度單位和降雨量單位，港澳和大陸稱為毫米（台灣亦有使用，但較常使用名稱為毫公分）。
 * console.log(convert_for_mw('毫米(毫公分)，符號mm，是長度單位和降雨量單位，-{zh-hans:台湾作-{公釐}-或-{公厘}-;zh-hant:港澳和大陸稱為-{毫米}-（台灣亦有使用，但較常使用名稱為毫公分）;zh-mo:台灣作-{公釐}-或-{公厘}-;zh-hk:台灣作-{公釐}-或-{公厘}-;}-。', 'zh-cn'))
 * // 毫米(毫公分)，符号mm，是长度单位和降雨量单位，台湾作公釐或公厘。
 * console.log(convert_for_mw('毫米(毫公分)，符號mm，是長度單位和降雨量單位，-{zh-hans:台湾作-{公釐}-或-{公厘}-;zh-hant:港澳和大陸稱為-{毫米}-（台灣亦有使用，但較常使用名稱為毫公分）;zh-mo:台灣作-{公釐}-或-{公厘}-;zh-hk:台灣作-{公釐}-或-{公厘', 'zh-hk'))  // unbalanced test
 * // 毫米(毫公分)，符號mm，是長度單位和降雨量單位，台灣作公釐或公厘
 * console.log(convert_for_mw('报头的“-{參攷消息}-”四字摘自鲁迅笔迹-{zh-hans:，“-{參}-”是“-{参}-”的繁体字，读音cān，与简体的“-{参}-”字相同；;zh-hant:，;}-“-{攷}-”是“考”的异体字，读音kǎo，与“考”字相同。', 'zh-tw'))
 * // 報頭的「參攷消息」四字摘自魯迅筆跡，「攷」是「考」的異體字，讀音kǎo，與「考」字相同。
 * console.log(convert_for_mw('报头的“-{參攷消息}-”四字摘自鲁迅笔迹-{zh-hans:，“-{參}-”是“-{参}-”的繁体字，读音cān，与简体的“-{参}-”字相同；;zh-hant:，;}-“-{攷}-”是“考”的异体字，读音kǎo，与“考”字相同。', 'zh-cn'))
 * // 报头的“參攷消息”四字摘自鲁迅笔迹，“參”是“参”的繁体字，读音cān，与简体的“参”字相同；“攷”是“考”的异体字，读音kǎo，与“考”字相同。
 * console.log(convert_for_mw('{{Col-break}}--&gt;', 'zh-hant'))
 * // {{Col-break}}--&gt;
 */
function convert_for_mw(str: string, locale: string, update: any = null): string {
    let ch = []
    let rules: any = []
    let ruledict = update ? JSON.parse(JSON.stringify(update)) : {}
    let nested = 0
    let block = ''
    for (let frag of str.split(RE_langconv)) {
        if (frag == '-{') {
            nested += 1
            block += frag
        } else if (frag == '}-') {
            if (!nested) {
                // bogus }-
                ch.push(frag)
                continue
            }
            block += frag
            nested -= 1
            if (nested) {
                continue
            }
            let newrules = []
            let delim = strip(block.slice(2, -2), ' \t\n\r\f\v;').split(RE_splitflag)
            let flag: any = null
            let mapping
            if (delim.length == 1) {
                mapping = delim[0].split(RE_splitmap)
            } else {
                flag = strip(delim[0], ' \t\n\r\f\v;').split(RE_splitmap)
                mapping = delim[1].split(RE_splitmap)
            }
            let rule: any = {}
            for (let m of mapping) {
                let uni = m.split(RE_splituni)
                let pair
                if (uni.length == 1) {
                    pair = uni[0].split(RE_splitpair)
                } else {
                    if (rule) {
                        newrules.push(rule)
                        rule = { ':uni': uni[0] }
                    } else {
                        rule[':uni'] = uni[0]
                    }
                    pair = uni[1].split(RE_splitpair)
                }
                if (pair.length == 1) {
                    rule['zh'] = convert_for_mw(pair[0], 'zh', ruledict)
                } else {
                    rule[pair[0]] = convert_for_mw(pair[1], pair[0], ruledict)
                }
            }
            newrules.push(rule)
            if (!flag) {
                ch.push(fallback(locale, newrules[0]))
            } else if (any(flag)) {
                for (let f in flag) {
                    // A: add rule for convert code (all text convert)
                    // H: Insert a conversion rule without output
                    if (['A', 'H'].includes(f)) {
                        let r
                        for (r of newrules) {
                            if (!rules.includes(r)) {
                                rules.push(r)
                            }
                        }
                        if (f == 'A') {
                            if (r.includes(':uni')) {
                                if (locale in r) {
                                    ch.push(r[locale])
                                } else {
                                    ch.push(convert(r[':uni'], locale))
                                }
                            } else {
                                ch.push(fallback(locale, newrules[0]))
                            }
                        }
                        // -: remove convert
                    } else if (f == '-') {
                        for (let r in newrules) {
                            try {
                                rules.remove(r)
                            } catch (e) {
                                console.log('---error', e)
                            }
                        }
                    }
                    // D: convert description (useless)
                    //} else if (f == 'D') {
                    //ch.push('; '.join(': '.join(x) for x in newrules[0].items()))
                    // T: title convert (useless)
                    // R: raw content (implied above)
                    // N: current variant name (useless)
                    //} else if (f == 'N') {
                    //ch.push(locale)
                    //}
                }
                ruledict = convtable2dict(rules, locale, update)
            } else {
                let fblimit = flag
                let limitedruledict = update ? JSON.parse(JSON.stringify(update)) : {}
                for (let r of rules) {
                    if (':uni' in r) {
                        if (locale in r) {
                            limitedruledict[r[':uni']] = r[locale]
                        }
                    } else {
                        let v = null
                        for (let l in Locales[locale]) {
                            if (l in r && l in fblimit) {
                                v = r[l]
                                break
                            }
                        }
                        for (let word in r.values()) {
                            limitedruledict[word] = v ? v : convert(word, locale)
                        }
                    }
                }
                ch.push(convert(delim[1], locale, limitedruledict))
            }
            block = ''
        } else if (nested) {
            block += frag
        } else {
            ch.push(convert(frag, locale, ruledict))
        }
    }
    if (nested) {
        // unbalanced
        ch.push(convert_for_mw(block + '}-'.repeat(nested), locale, ruledict))
    }
    return ch.join('')
}

function strip(str: string, reg_value: string) {
    let regStart = new RegExp("^[" + reg_value + "]+");
    let regend = new RegExp("[" + reg_value + "]+$");
    return str.replace(regStart, "").replace(regend, "");
}

// function test_convert_mw(locale, update=null) {
//     s = ('英國-{zh:利兹;zh-hans:利兹;zh-hk:列斯;zh-tw:里茲}-大学\n'
//         '-{zh-hans:计算机; zh-hant:電腦;}-\n'
//         '-{H|巨集=>zh-cn:宏;}-\n'
//         '测试：巨集、宏\n'
//         '-{简体字繁體字}-\n'
//         '北-{}-韓、北朝-{}-鲜\n'
//         '-{H|zh-cn:博客; zh-hk:網誌; zh-tw:部落格;}-\n'
//         '测试：博客、網誌、部落格\n'
//         '-{A|zh-cn:博客; zh-hk:網誌; zh-tw:部落格;}-\n'
//         '测试：博客、網誌、部落格\n'
//         '-{H|zh-cn:博客; zh-hk:網誌; zh-tw:部落格;}-\n'
//         '测试1：博客、網誌、部落格\n'
//         '-{-|zh-cn:博客; zh-hk:網誌; zh-tw:部落格;}-\n'
//         '测试2：博客、網誌、部落格\n'
//         '-{T|zh-cn:汤姆·汉克斯; zh-hk:湯·漢斯; zh-tw:湯姆·漢克斯;}-\n'
//         '-{D|zh-cn:汤姆·汉克斯; zh-hk:湯·漢斯; zh-tw:湯姆·漢克斯;}-\n'
//         '-{H|zh-cn:博客; zh-hk:網誌; zh-tw:部落格;}-\n'
//         '测试1：-{zh;zh-hans;zh-hant|博客、網誌、部落格}-\n'
//         '测试2：-{zh;zh-cn;zh-hk|博客、網誌、部落格}-')
//     return convert_for_mw(s, locale, update)
// }
