import {
	assertHasValidFieldNames,
	assertIsValidFieldName,
	isBinary,
	clone,
	isNumericKey,
	isPlainObject,
	isIndexable,
	equals,
	isEmptyArray,
} from './common';

describe('assertIsValidFieldName', () => {
	it('should not throw for valid field names', () => {
		expect(() => assertIsValidFieldName('validName')).not.toThrow();
		expect(() => assertIsValidFieldName('valid_name_with_underscores')).not.toThrow();
		expect(() => assertIsValidFieldName('validNameWithNumbers123')).not.toThrow();
		expect(() => assertIsValidFieldName('')).not.toThrow();
	});

	it('should throw for fields starting with $', () => {
		expect(() => assertIsValidFieldName('$invalidName')).toThrow("Key $invalidName must not start with '$'");
	});

	it('should throw for fields containing .', () => {
		expect(() => assertIsValidFieldName('invalid.name')).toThrow("Key invalid.name must not contain '.'");
	});

	it('should throw for fields containing null bytes', () => {
		expect(() => assertIsValidFieldName('invalid\0name')).toThrow('Key invalid\0name must not contain null bytes');
	});

	it('should return undefined for non-string keys', () => {
		// @ts-expect-error - Testing with invalid input
		expect(assertIsValidFieldName(123)).toBeUndefined();
		// @ts-expect-error - Testing with invalid input
		expect(assertIsValidFieldName(null)).toBeUndefined();
		// @ts-expect-error - Testing with invalid input
		expect(assertIsValidFieldName(undefined)).toBeUndefined();
	});
});

describe('assertHasValidFieldNames', () => {
	it('should not throw for documents with valid field names', () => {
		expect(() => assertHasValidFieldNames({ validField: 'value' })).not.toThrow();
		expect(() => assertHasValidFieldNames({ nested: { valid: 'value' } })).not.toThrow();
		expect(() => assertHasValidFieldNames([{ valid: 'value' }])).not.toThrow();
		expect(() => assertHasValidFieldNames(null)).not.toThrow();
		expect(() => assertHasValidFieldNames(undefined)).not.toThrow();
		expect(() => assertHasValidFieldNames(123)).not.toThrow();
		expect(() => assertHasValidFieldNames('string')).not.toThrow();
	});

	it('should throw for documents with invalid field names', () => {
		expect(() => assertHasValidFieldNames({ $invalid: 'value' })).toThrow("Key $invalid must not start with '$'");
		expect(() => assertHasValidFieldNames({ 'invalid.field': 'value' })).toThrow("Key invalid.field must not contain '.'");
		expect(() => assertHasValidFieldNames({ 'invalid\0field': 'value' })).toThrow('Key invalid\0field must not contain null bytes');
		expect(() => assertHasValidFieldNames({ valid: { $invalid: 'value' } })).toThrow("Key $invalid must not start with '$'");
	});
});

describe('isBinary', () => {
	it('should return true for Uint8Array instances', () => {
		expect(isBinary(new Uint8Array())).toBe(true);
		expect(isBinary(new Uint8Array([1, 2, 3]))).toBe(true);
	});

	it('should return false for non-Uint8Array values', () => {
		expect(isBinary(null)).toBe(false);
		expect(isBinary(undefined)).toBe(false);
		expect(isBinary('string')).toBe(false);
		expect(isBinary(123)).toBe(false);
		expect(isBinary({})).toBe(false);
		expect(isBinary([])).toBe(false);
		expect(isBinary(new Date())).toBe(false);
		expect(isBinary(new RegExp(''))).toBe(false);
	});
});

describe('clone', () => {
	it('should return primitives as is', () => {
		expect(clone(1)).toBe(1);
		expect(clone('string')).toBe('string');
		expect(clone(true)).toBe(true);
		expect(clone(false)).toBe(false);
		expect(clone(undefined)).toBe(undefined);
		expect(clone(null)).toBe(null);
	});

	it('should clone Date objects', () => {
		const date = new Date();
		const cloned = clone(date);

		expect(cloned).toEqual(date);
		expect(cloned).not.toBe(date); // Different reference
		expect(cloned.getTime()).toBe(date.getTime());
	});

	it('should return RegExp objects as is (same reference)', () => {
		const regex = /test/g;
		const cloned = clone(regex);

		expect(cloned).toBe(regex); // Same reference
	});

	it('should clone Uint8Array objects', () => {
		const binary = new Uint8Array([1, 2, 3]);
		const cloned = clone(binary);

		expect(cloned).toEqual(binary);
		expect(cloned).not.toBe(binary); // Different reference
		expect(cloned.buffer).not.toBe(binary.buffer); // Different buffer
	});

	it('should clone arrays with nested objects', () => {
		const array = [1, { a: 2 }, [3]];
		const cloned = clone(array);

		expect(cloned).toEqual(array);
		expect(cloned).not.toBe(array);
		expect(cloned[1]).not.toBe(array[1]);
		expect(cloned[2]).not.toBe(array[2]);
	});

	it('should clone objects with nested objects', () => {
		const obj = { a: 1, b: { c: 2 }, d: [3] };
		const cloned = clone(obj);

		expect(cloned).toEqual(obj);
		expect(cloned).not.toBe(obj);
		expect(cloned.b).not.toBe(obj.b);
		expect(cloned.d).not.toBe(obj.d);
	});

	it('should handle Arguments objects', () => {
		function getArgs(..._: any) {
			// eslint-disable-next-line prefer-rest-params
			return arguments;
		}

		const args = getArgs(1, 'two', { three: 3 });
		const cloned = clone(args);

		expect(cloned).toEqual([1, 'two', { three: 3 }]);
		expect(Array.isArray(cloned)).toBe(true);
	});

	it('should handle objects with clone method', () => {
		const obj = {
			value: 42,
			clone() {
				return { value: this.value * 2 };
			},
		};

		const cloned = clone(obj);
		expect(cloned).toEqual({ value: 84 });
		expect(cloned).not.toBe(obj);
	});
});

describe('isNumericKey', () => {
	it('should return true for strings containing only digits', () => {
		expect(isNumericKey('0')).toBe(true);
		expect(isNumericKey('1')).toBe(true);
		expect(isNumericKey('123')).toBe(true);
		expect(isNumericKey('01')).toBe(true); // Leading zeros are fine
	});

	it('should return false for strings not containing only digits', () => {
		expect(isNumericKey('')).toBe(false);
		expect(isNumericKey('a')).toBe(false);
		expect(isNumericKey('1a')).toBe(false);
		expect(isNumericKey('a1')).toBe(false);
		expect(isNumericKey('1.0')).toBe(false);
		expect(isNumericKey('1,000')).toBe(false);
		expect(isNumericKey('-1')).toBe(false);
		expect(isNumericKey('+1')).toBe(false);
		expect(isNumericKey(' 1')).toBe(false);
		expect(isNumericKey('1 ')).toBe(false);
	});
});

describe('isPlainObject', () => {
	it('should return true for plain objects', () => {
		expect(isPlainObject({})).toBe(true);
		expect(isPlainObject({ a: 1 })).toBe(true);
		expect(isPlainObject(Object.create(null))).toBe(true);
	});

	it('should return false for non-objects', () => {
		expect(isPlainObject(null)).toBe(false);
		expect(isPlainObject(undefined)).toBe(false);
		expect(isPlainObject(1)).toBe(false);
		expect(isPlainObject('string')).toBe(false);
		expect(isPlainObject(true)).toBe(false);
	});

	it('should return false for non-plain objects', () => {
		expect(isPlainObject([])).toBe(false);
		expect(isPlainObject(new Date())).toBe(false);
		expect(isPlainObject(/test/)).toBe(false);
		expect(isPlainObject(new Uint8Array())).toBe(false);
	});
});

describe('isIndexable', () => {
	it('should return true for arrays', () => {
		expect(isIndexable([])).toBe(true);
		expect(isIndexable([1, 2, 3])).toBe(true);
	});

	it('should return true for plain objects', () => {
		expect(isIndexable({})).toBe(true);
		expect(isIndexable({ a: 1 })).toBe(true);
	});

	it('should return false for non-indexable values', () => {
		expect(isIndexable(null)).toBe(false);
		expect(isIndexable(undefined)).toBe(false);
		expect(isIndexable(1)).toBe(false);
		expect(isIndexable('string')).toBe(false);
		expect(isIndexable(true)).toBe(false);
		expect(isIndexable(new Date())).toBe(false);
		expect(isIndexable(/test/)).toBe(false);
		expect(isIndexable(new Uint8Array())).toBe(false);
	});
});

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
