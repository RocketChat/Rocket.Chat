import { getBSONType, compareBSONValues } from './bson';
import { BSONType } from './types';

describe('getBSONType', () => {
	it('should work', () => {
		expect(getBSONType(1)).toBe(BSONType.Double);
		expect(getBSONType('xyz')).toBe(BSONType.String);
		expect(getBSONType({})).toBe(BSONType.Object);
		expect(getBSONType([])).toBe(BSONType.Array);
		expect(getBSONType(new Uint8Array())).toBe(BSONType.BinData);
		expect(getBSONType(undefined)).toBe(BSONType.Object);
		expect(getBSONType(null)).toBe(BSONType.Null);
		expect(getBSONType(false)).toBe(BSONType.Boolean);
		expect(getBSONType(/.*/)).toBe(BSONType.Regex);
		expect(getBSONType(() => true)).toBe(BSONType.JavaScript);
		expect(getBSONType(new Date(0))).toBe(BSONType.Date);
	});
});

describe('compareBSONValues', () => {
	it('should work for the same types', () => {
		expect(compareBSONValues(2, 3)).toBe(-1);
		expect(compareBSONValues('xyz', 'abc')).toBe(1);
		expect(compareBSONValues({}, {})).toBe(0);
		expect(compareBSONValues(true, false)).toBe(1);
		expect(compareBSONValues(new Date(0), new Date(1))).toBe(-1);
	});

	it('should work for different types', () => {
		expect(compareBSONValues(2, null)).toBe(1);
		expect(compareBSONValues('xyz', {})).toBe(-1);
		expect(compareBSONValues(false, 3)).toBe(1);
	});
});
