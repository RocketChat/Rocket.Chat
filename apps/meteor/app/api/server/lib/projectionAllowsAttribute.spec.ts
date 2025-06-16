import { expect } from 'chai';

import { projectionAllowsAttribute } from './projectionAllowsAttribute';

describe('projectionAllowsAttribute', () => {
	it('should return true if there are no options', () => {
		expect(projectionAllowsAttribute('attributeName')).to.be.equal(true);
	});

	it('should return true if there is no projection', () => {
		expect(projectionAllowsAttribute('attributeName', {})).to.be.equal(true);
	});

	it('should return true if the field is projected', () => {
		expect(projectionAllowsAttribute('attributeName', { projection: { attributeName: 1 } })).to.be.equal(true);
	});

	it('should return false if the field is disallowed by projection', () => {
		expect(projectionAllowsAttribute('attributeName', { projection: { attributeName: 0 } })).to.be.equal(false);
	});

	it('should return false if the field is not projected and others are', () => {
		expect(projectionAllowsAttribute('attributeName', { projection: { anotherAttribute: 1 } })).to.be.equal(false);
	});

	it('should return true if the field is not projected and others are disallowed', () => {
		expect(projectionAllowsAttribute('attributeName', { projection: { anotherAttribute: 0 } })).to.be.equal(true);
	});
});
