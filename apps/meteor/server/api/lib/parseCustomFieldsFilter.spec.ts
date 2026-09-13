import { expect } from 'chai';
import { describe, it } from 'mocha';

import { parseCustomFieldsFilter } from './parseCustomFieldsFilter';

describe('parseCustomFieldsFilter', () => {
	it('should map a key to an exact-match filter', () => {
		expect(parseCustomFieldsFilter('{"CustomerID":"acct-4821"}')).to.deep.equal({
			'customFields.CustomerID': 'acct-4821',
		});
	});

	it('should combine multiple keys', () => {
		expect(parseCustomFieldsFilter('{"CustomerID":"1","BAID":"2"}')).to.deep.equal({
			'customFields.CustomerID': '1',
			'customFields.BAID': '2',
		});
	});

	it('should reject malformed JSON as a shape error, not an empty payload', () => {
		expect(() => parseCustomFieldsFilter('{ssn:')).to.throw('customFields must be a JSON object');
	});

	it('should reject a payload that is not a plain object', () => {
		expect(() => parseCustomFieldsFilter('["a"]')).to.throw('must be a JSON object');
		expect(() => parseCustomFieldsFilter('"a"')).to.throw('must be a JSON object');
		expect(() => parseCustomFieldsFilter('null')).to.throw('must be a JSON object');
	});

	it('should reject an empty object', () => {
		expect(() => parseCustomFieldsFilter('{}')).to.throw('at least one field');
	});

	it('should reject values that are not non-empty strings', () => {
		expect(() => parseCustomFieldsFilter('{"a":{"$ne":null}}')).to.throw('non-empty string');
		expect(() => parseCustomFieldsFilter('{"a":123}')).to.throw('non-empty string');
		expect(() => parseCustomFieldsFilter('{"a":["x"]}')).to.throw('non-empty string');
		expect(() => parseCustomFieldsFilter('{"a":""}')).to.throw('non-empty string');
	});

	it('should reject keys carrying an operator or a nested path', () => {
		expect(() => parseCustomFieldsFilter('{"$where":"return true"}')).to.throw('not allowed');
		expect(() => parseCustomFieldsFilter('{"a.b":"x"}')).to.throw('not allowed');
	});
});
