import { Loader } from '../loader';

describe('parse_name', () => {
    let title = 'Products | Services';
    test('第一种情况', () => {
        expect(Loader.parse_name(title, 0, true)).toEqual('products_services');
    });
    test('第二种情况', () => {
        expect(Loader.parse_name(title, 1, true)).toEqual('ProductsServices');
    });
    test('第三种情况', () => {
        expect(Loader.parse_name(title, 1, false)).toEqual('productsServices');
    });
});