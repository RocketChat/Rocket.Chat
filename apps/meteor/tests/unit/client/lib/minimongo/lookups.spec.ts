import { expect } from 'chai';
import { describe, it } from 'mocha';

import { createLookupFunction } from '../../../../../client/lib/minimongo/lookups';

describe('createLookupFunction', () => {
	it('should work', () => {
		expect(createLookupFunction('a.x')({ a: { x: 1 } })).to.be.deep.equals([1]);
		expect(createLookupFunction('a.x')({ a: { x: [1] } })).to.be.deep.equals([[1]]);
		expect(createLookupFunction('a.x')({ a: 5 })).to.be.deep.equals([undefined]);
		expect(createLookupFunction('a.x')({ a: [{ x: 1 }, { x: [2] }, { y: 3 }] })).to.be.deep.equals([1, [2], undefined]);
	});
});
