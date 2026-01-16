import { parseQueryParams } from './parseQueryParams';

describe('parseQueryParams', () => {
	it('should parse simple query string', () => {
		const result = parseQueryParams('foo=bar');
		expect(result).toEqual({ foo: 'bar' });
	});

	it('should parse multiple query parameters', () => {
		const result = parseQueryParams('foo=bar&baz=qux');
		expect(result).toEqual({ foo: 'bar', baz: 'qux' });
	});

	it('should parse array parameters', () => {
		const result = parseQueryParams('ids[]=1&ids[]=2&ids[]=3');
		expect(result).toEqual({ ids: ['1', '2', '3'] });
	});

	it('should parse nested objects', () => {
		const result = parseQueryParams('user[name]=john&user[age]=30');
		expect(result).toEqual({ user: { name: 'john', age: '30' } });
	});

	it('should handle empty query string', () => {
		const result = parseQueryParams('');
		expect(result).toEqual({});
	});

	it('should decode URL encoded values', () => {
		const result = parseQueryParams('name=John%20Doe');
		expect(result).toEqual({ name: 'John Doe' });
	});

	it('should handle boolean-like values as strings', () => {
		const result = parseQueryParams('active=true&disabled=false');
		expect(result).toEqual({ active: 'true', disabled: 'false' });
	});

	it('should throw error when array limit is exceeded', () => {
		const largeArray = Array(501)
			.fill(0)
			.map((_, i) => `ids[]=${i}`)
			.join('&');
		expect(() => parseQueryParams(largeArray)).toThrow();
	});

	it('should parse arrays within the limit', () => {
		const array = Array(500)
			.fill(0)
			.map((_, i) => `ids[]=${i}`)
			.join('&');
		const result = parseQueryParams(array);
		expect(result.ids).toHaveLength(500);
	});
});
