import { Loader } from '../loader';
import { convert, convert_for_mw } from '../transform';

describe('parse_name', () => {
    let title = 'Products | Services';
    test('转为下划线链接', () => {
        expect(Loader.parse_name(title, 0, true)).toEqual('products_services');
    });
    test('转为大驼峰', () => {
        expect(Loader.parse_name(title, 1, true)).toEqual('ProductsServices');
    });
    test('转为小驼峰', () => {
        expect(Loader.parse_name(title, 1, false)).toEqual('productsServices');
    });
});

describe('convert', () => {
    test('转为简体中文', () => {
        expect(convert('我幹什麼不干你事。', 'zh-cn')).toEqual('我干什么不干你事。');
    });
    test('转为简体中文，自定义字典', () => {
        expect(convert('我幹什麼不干你事。', 'zh-cn', {'不干': '不幹'})).toEqual('我干什么不幹你事。');
    });
    test('转为台湾繁体中文', () => {
        expect(convert('人体内存在很多微生物', 'zh-tw')).toEqual('人體內存在很多微生物');
    });
});

describe('convert_for_mw', () => {
    test('转为香港繁体中文', () => {
        expect(convert_for_mw('在现代，机械计算-{}-机的应用已经完全被电子计算-{}-机所取代', 'zh-hk')).toEqual('在現代，機械計算機的應用已經完全被電子計算機所取代');
    });
    test('转为香港繁体中文', () => {
        expect(convert_for_mw('-{zh-hant:資訊工程;zh-hans:计算机工程学;}-是电子工程的一个分支，主要研究计算机软硬件和二者间的彼此联系。', 'zh-tw')).toEqual('資訊工程是電子工程的一個分支，主要研究計算機軟硬體和二者間的彼此聯繫。');
    });
    test('转为香港繁体中文', () => {
        expect(convert_for_mw('張國榮曾在英國-{zh:利兹;zh-hans:利兹;zh-hk:列斯;zh-tw:里茲}-大学學習。', 'zh-hant')).toEqual('張國榮曾在英國里茲大學學習。');
    });
    test('转为香港繁体中文', () => {
        expect(convert_for_mw('張國榮曾在英國-{zh:利兹;zh-hans:利兹;zh-hk:列斯;zh-tw:里茲}-大学學習。', 'zh-sg')).toEqual('张国荣曾在英国利兹大学学习。');
    });
    test('转为香港繁体中文', () => {
        expect(convert_for_mw('-{zh-hant:;\\nzh-cn:}-', 'zh-tw')).toEqual(true);
    });
    test('转为香港繁体中文', () => {
        expect(convert_for_mw('毫米(毫公分)，符號mm，是長度單位和降雨量單位，-{zh-hans:台湾作-{公釐}-或-{公厘}-;zh-hant:港澳和大陸稱為-{毫米}-（台灣亦有使用，但較常使用名稱為毫公分）;zh-mo:台灣作-{公釐}-或-{公厘}-;zh-hk:台灣作-{公釐}-或-{公厘}-;}-。', 'zh-tw')).toEqual('毫米(毫公分)，符號mm，是長度單位和降雨量單位，港澳和大陸稱為毫米（台灣亦有使用，但較常使用名稱為毫公分）。');
    });
    test('转为香港繁体中文', () => {
        expect(convert_for_mw('毫米(毫公分)，符號mm，是長度單位和降雨量單位，-{zh-hans:台湾作-{公釐}-或-{公厘}-;zh-hant:港澳和大陸稱為-{毫米}-（台灣亦有使用，但較常使用名稱為毫公分）;zh-mo:台灣作-{公釐}-或-{公厘}-;zh-hk:台灣作-{公釐}-或-{公厘}-;}-。', 'zh-cn')).toEqual('毫米(毫公分)，符号mm，是长度单位和降雨量单位，台湾作公釐或公厘。');
    });
    test('转为香港繁体中文', () => {
        expect(convert_for_mw('毫米(毫公分)，符號mm，是長度單位和降雨量單位，-{zh-hans:台湾作-{公釐}-或-{公厘}-;zh-hant:港澳和大陸稱為-{毫米}-（台灣亦有使用，但較常使用名稱為毫公分）;zh-mo:台灣作-{公釐}-或-{公厘}-;zh-hk:台灣作-{公釐}-或-{公厘', 'zh-hk')).toEqual('毫米(毫公分)，符號mm，是長度單位和降雨量單位，台灣作公釐或公厘');
    });
    test('转为香港繁体中文', () => {
        expect(convert_for_mw('报头的“-{參攷消息}-”四字摘自鲁迅笔迹-{zh-hans:，“-{參}-”是“-{参}-”的繁体字，读音cān，与简体的“-{参}-”字相同；;zh-hant:，;}-“-{攷}-”是“考”的异体字，读音kǎo，与“考”字相同。', 'zh-tw')).toEqual('報頭的「參攷消息」四字摘自魯迅筆跡，「攷」是「考」的異體字，讀音kǎo，與「考」字相同。');
    });
    test('转为香港繁体中文', () => {
        expect(convert_for_mw('报头的“-{參攷消息}-”四字摘自鲁迅笔迹-{zh-hans:，“-{參}-”是“-{参}-”的繁体字，读音cān，与简体的“-{参}-”字相同；;zh-hant:，;}-“-{攷}-”是“考”的异体字，读音kǎo，与“考”字相同。', 'zh-cn')).toEqual('报头的“參攷消息”四字摘自鲁迅笔迹，“參”是“参”的繁体字，读音cān，与简体的“参”字相同；“攷”是“考”的异体字，读音kǎo，与“考”字相同。');
    });
    test('转为香港繁体中文', () => {
        expect(convert_for_mw('{{Col-break}}--&gt;', 'zh-hant')).toEqual('{{Col-break}}--&gt;');
    });
});