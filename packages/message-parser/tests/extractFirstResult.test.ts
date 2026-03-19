import { extractFirstResult } from '../src/utils';

describe('extractFirstResult', () => {
	it('returns value directly when it is not an array', () => {
		expect(extractFirstResult('hello')).toBe('hello');
	});

	it('returns first truthy value from array', () => {
		expect(extractFirstResult([null, undefined, 'value'])).toBe('value');
	});

	it('returns undefined when array has no truthy values', () => {
		expect(extractFirstResult([null, undefined, false])).toBeUndefined();
	});

	it('returns first element when array contains valid value first', () => {
		expect(extractFirstResult(['first', 'second'])).toBe('first');
	});
});