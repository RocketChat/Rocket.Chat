import { expect } from 'chai';
import { describe, it } from 'mocha';

import { equals, isObject, flatSome, some, isEmptyArray } from '../../../../../client/lib/minimongo/comparisons';

describe('Comparisons service', () => {
	describe('equals', () => {
		it('should return true if two numbers are equal', () => {
			expect(equals(1, 1)).to.be.equal(true);
		});

		it('should return false if arguments are null or undefined', () => {
			expect(equals(undefined, null)).to.be.equal(false);
			expect(equals(null, undefined)).to.be.equal(false);
		});

		it('should return false if arguments arent objects and they are not the same', () => {
			expect(equals('not', 'thesame')).to.be.equal(false);
		});

		it('should return true if date objects provided have the same value', () => {
			const currentDate = new Date();

			expect(equals(currentDate, currentDate)).to.be.equal(true);
		});

		it('should return true if 2 equal UInt8Array are provided', () => {
			const arr1 = new Uint8Array([1, 2]);
			const arr2 = new Uint8Array([1, 2]);

			expect(equals(arr1, arr2)).to.be.equal(true);
		});

		it('should return true if 2 equal arrays are provided', () => {
			const arr1 = [1, 2, 4];
			const arr2 = [1, 2, 4];

			expect(equals(arr1, arr2)).to.be.equal(true);
		});

		it('should return false if 2 arrays with different length are provided', () => {
			const arr1 = [1, 4, 5];
			const arr2 = [1, 4, 5, 7];

			expect(equals(arr1, arr2)).to.be.equal(false);
		});

		it('should return true if the objects provided are "equal"', () => {
			const obj = { a: 1 };
			const obj2 = obj;

			expect(equals(obj, obj2)).to.be.equal(true);
		});

		it('should return true if both objects have the same keys', () => {
			const obj = { a: 1 };
			const obj2 = { a: 1 };

			expect(equals(obj, obj2)).to.be.equal(true);
		});
	});

	describe('isObject', () => {
		it('should return true if value is an object or function', () => {
			const obj = {};
			const func = (a: any): any => a;

			expect(isObject(obj)).to.be.equal(true);
			expect(isObject(func)).to.be.equal(true);
		});

		it('should return false for other data types', () => {
			expect(isObject(1)).to.be.equal(false);
			expect(isObject(true)).to.be.equal(false);
			expect(isObject('212')).to.be.equal(false);
		});
	});

	describe('flatSome', () => {
		it('should run .some on array', () => {
			const arr = [1, 2, 4, 6, 9];
			const isEven = (v: number): boolean => v % 2 === 0;

			expect(flatSome(arr, isEven)).to.be.equal(true);
		});

		it('should run the function on the value when its not an array', () => {
			const val = 1;
			const isEven = (v: number): boolean => v % 2 === 0;

			expect(flatSome(val, isEven)).to.be.equal(false);
		});
	});

	describe('some', () => {
		it('should run .some on array', () => {
			const arr = [1, 2, 4, 6, 9];
			const isEven = (v: number | number[]): boolean => {
				if (Array.isArray(v)) {
					return false;
				}
				return v % 2 === 0;
			};

			expect(some(arr, isEven)).to.be.equal(true);
		});

		it('should run the function on the value when its not an array', () => {
			const val = 1;
			const isEven = (v: number | number[]): boolean => {
				if (Array.isArray(v)) {
					return false;
				}
				return v % 2 === 0;
			};

			expect(some(val, isEven)).to.be.equal(false);
		});
	});

	describe('isEmptyArray', () => {
		it('should return true if array is empty', () => {
			expect(isEmptyArray([])).to.be.equal(true);
		});

		it('should return false if value is not an array', () => {
			expect(isEmptyArray(1)).to.be.equal(false);
		});

		it('should return false if array is not empty', () => {
			expect(isEmptyArray([1, 2])).to.be.equal(false);
		});
	});
});
