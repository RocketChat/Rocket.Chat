import { expect } from 'chai';
import { describe, it } from 'mocha';

import { getBSONType, compareBSONValues } from '../../../../../client/lib/minimongo/bson';
import { BSONType } from '../../../../../client/lib/minimongo/types';

describe('getBSONType', () => {
	it('should work', () => {
		expect(getBSONType(1)).to.be.equals(BSONType.Double);
		expect(getBSONType('xyz')).to.be.equals(BSONType.String);
		expect(getBSONType({})).to.be.equals(BSONType.Object);
		expect(getBSONType([])).to.be.equals(BSONType.Array);
		expect(getBSONType(new Uint8Array())).to.be.equals(BSONType.BinData);
		expect(getBSONType(undefined)).to.be.equals(BSONType.Object);
		expect(getBSONType(null)).to.be.equals(BSONType.Null);
		expect(getBSONType(false)).to.be.equals(BSONType.Boolean);
		expect(getBSONType(/.*/)).to.be.equals(BSONType.Regex);
		expect(getBSONType(() => true)).to.be.equals(BSONType.JavaScript);
		expect(getBSONType(new Date(0))).to.be.equals(BSONType.Date);
	});
});

describe('compareBSONValues', () => {
	it('should work for the same types', () => {
		expect(compareBSONValues(2, 3)).to.be.equals(-1);
		expect(compareBSONValues('xyz', 'abc')).to.be.equals(1);
		expect(compareBSONValues({}, {})).to.be.equals(0);
		expect(compareBSONValues(true, false)).to.be.equals(1);
		expect(compareBSONValues(new Date(0), new Date(1))).to.be.equals(-1);
	});

	it('should work for different types', () => {
		expect(compareBSONValues(2, null)).to.be.equals(1);
		expect(compareBSONValues('xyz', {})).to.be.equals(-1);
		expect(compareBSONValues(false, 3)).to.be.equals(1);
	});
});
