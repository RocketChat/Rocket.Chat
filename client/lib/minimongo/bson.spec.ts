import chai from 'chai';
import { describe, it } from 'mocha';

import { BSONType } from './types';
import { getBSONType, compareBSONValues } from './bson';

describe('getBSONType', () => {
	it('should work', () => {
		chai.expect(getBSONType(1)).to.be.equals(BSONType.Double);
		chai.expect(getBSONType('xyz')).to.be.equals(BSONType.String);
		chai.expect(getBSONType({})).to.be.equals(BSONType.Object);
		chai.expect(getBSONType([])).to.be.equals(BSONType.Array);
		chai.expect(getBSONType(new Uint8Array())).to.be.equals(BSONType.BinData);
		chai.expect(getBSONType(undefined)).to.be.equals(BSONType.Object);
		chai.expect(getBSONType(null)).to.be.equals(BSONType.Null);
		chai.expect(getBSONType(false)).to.be.equals(BSONType.Boolean);
		chai.expect(getBSONType(/.*/)).to.be.equals(BSONType.Regex);
		chai.expect(getBSONType(() => true)).to.be.equals(BSONType.JavaScript);
		chai.expect(getBSONType(new Date(0))).to.be.equals(BSONType.Date);
	});
});

describe('compareBSONValues', () => {
	it('should work for the same types', () => {
		chai.expect(compareBSONValues(2, 3)).to.be.equals(-1);
		chai.expect(compareBSONValues('xyz', 'abc')).to.be.equals(1);
		chai.expect(compareBSONValues({}, {})).to.be.equals(0);
		chai.expect(compareBSONValues(true, false)).to.be.equals(1);
		chai.expect(compareBSONValues(new Date(0), new Date(1))).to.be.equals(-1);
	});

	it('should work for different types', () => {
		chai.expect(compareBSONValues(2, null)).to.be.equals(1);
		chai.expect(compareBSONValues('xyz', {})).to.be.equals(-1);
		chai.expect(compareBSONValues(false, 3)).to.be.equals(1);
	});
});
