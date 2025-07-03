import { equals, isEmptyArray } from './comparisons';

describe('equals', () => {
	it('should return true if two numbers are equal', () => {
		expect(equals(1, 1)).toBe(true);
	});

	it('should return false if arguments are null or undefined', () => {
		expect(equals(undefined, null)).toBe(false);
		expect(equals(null, undefined)).toBe(false);
	});

	it('should return false if arguments arent objects and they are not the same', () => {
		expect(equals('not', 'thesame')).toBe(false);
	});

	it('should return true if date objects provided have the same value', () => {
		const currentDate = new Date();

		expect(equals(currentDate, currentDate)).toBe(true);
	});

	it('should return true if 2 equal UInt8Array are provided', () => {
		const arr1 = new Uint8Array([1, 2]);
		const arr2 = new Uint8Array([1, 2]);

		expect(equals(arr1, arr2)).toBe(true);
	});

	it('should return true if 2 equal arrays are provided', () => {
		const arr1 = [1, 2, 4];
		const arr2 = [1, 2, 4];

		expect(equals(arr1, arr2)).toBe(true);
	});

	it('should return false if 2 arrays with different length are provided', () => {
		const arr1 = [1, 4, 5];
		const arr2 = [1, 4, 5, 7];

		expect(equals(arr1, arr2)).toBe(false);
	});

	it('should return true if the objects provided are "equal"', () => {
		const obj = { a: 1 };
		const obj2 = obj;

		expect(equals(obj, obj2)).toBe(true);
	});

	it('should return true if both objects have the same keys', () => {
		const obj = { a: 1 };
		const obj2 = { a: 1 };

		expect(equals(obj, obj2)).toBe(true);
	});
});

describe('isEmptyArray', () => {
	it('should return true if array is empty', () => {
		expect(isEmptyArray([])).toBe(true);
	});

	it('should return false if value is not an array', () => {
		expect(isEmptyArray(1)).toBe(false);
	});

	it('should return false if array is not empty', () => {
		expect(isEmptyArray([1, 2])).toBe(false);
	});
});
