import { expect } from 'chai';

import { getNestedProp } from './getNestedProp';

describe('LDAP getNestedProp', () => {
	it('should find shallow values', () => {
		const customFields = {
			foo: 'bar',
		};

		expect(getNestedProp(customFields, 'foo')).to.equal('bar');
	});

	it('should find deep values', () => {
		const customFields = {
			foo: {
				bar: 'baz',
			},
		};

		expect(getNestedProp(customFields, 'foo.bar')).to.equal('baz');
	});
});
