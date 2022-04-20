import { expect } from 'chai';

import {
	normalizers,
	fromTemplate,
	renameInvalidProperties,
	getNestedValue,
	getRegexpMatch,
} from '../../../../../app/custom-oauth/server/transform_helpers';

const data = {
	'id': '123456',
	'invalid.property': true,
	'name': 'foo',
	'email': 'foo@bar.com',
	'nested': {
		'value': 'baz',
		'another.invalid.prop': true,
	},
	'list': [
		{
			'invalid.property': 'in-array',
		},
	],
};

describe('fromTemplate', () => {
	const normalizedData = Object.values(normalizers).reduce((normalizedData, normalizer) => {
		const result = { ...normalizedData };
		normalizer({ ...result });

		return result;
	}, data);

	it('returns match from regexp on top-level properties', () => {
		const template = '{{/^foo@bar.(.+)/::email}}';
		const expected = 'com';
		const result = fromTemplate(template, normalizedData);
		expect(result).to.equal(expected);
	});

	it('returns match from regexp on nested properties', () => {
		const template = '{{/^ba(.+)/::nested.value}}';
		const expected = 'z';
		const result = fromTemplate(template, normalizedData);
		expect(result).to.equal(expected);
	});

	it('returns value from nested prop with plain syntax', () => {
		const template = 'nested.value';
		const expected = normalizedData.nested.value;
		const result = fromTemplate(template, normalizedData);
		expect(result).to.equal(expected);
	});

	it('returns value from nested prop with template syntax', () => {
		const template = '{{nested.value}}';
		const expected = normalizedData.nested.value;
		const result = fromTemplate(template, normalizedData);
		expect(result).to.equal(expected);
	});

	it('returns composed value from nested prop with template syntax', () => {
		const template = '{{name}}.{{nested.value}}';
		const expected = `${normalizedData.name}.${normalizedData.nested.value}`;
		const result = fromTemplate(template, normalizedData);

		expect(result).to.equal(expected);
	});

	it('returns composed string from multiple template chunks with static parts', () => {
		const template = 'composed-{{name}}-at-{{nested.value}}-dot-{{/^foo@bar.(.+)/::email}}-from-template';
		const expected = 'composed-foo-at-baz-dot-com-from-template';
		const result = fromTemplate(template, normalizedData);
		expect(result).to.equal(expected);
	});
});

describe('getRegexpMatch', () => {
	it('returns nested value when formula is not in the regex::field form', () => {
		const formula = 'nested.value';
		expect(getRegexpMatch(formula, data)).to.equal(data.nested.value);
	});

	it("returns undefined when regex doesn't match", () => {
		const formula = '/^foo@baz(.+)/::email';
		expect(getRegexpMatch(formula, data)).to.be.undefined;
	});

	it("throws when regex isn't valid", () => {
		const formula = '/+/::email';
		expect(() => getRegexpMatch(formula, data)).to.throw();
	});
});

describe('renameInvalidProperties', () => {
	it('replaces . chars in field names with _', () => {
		const result = renameInvalidProperties(data);

		expect(result['invalid.property']).to.be.undefined;
		expect(result.invalid_property).to.equal(data['invalid.property']);

		expect(result.nested['invalid.property']).to.be.undefined;
		expect(result.nested.invalid_property).to.equal(data.nested['invalid.property']);

		result.list.forEach((item, idx) => {
			expect(item['invalid.property']).to.be.undefined;
			expect(item.invalid_property).to.equal(data.list[idx]['invalid.property']);
		});
	});
});

describe('getNestedValue', () => {
	it("returns undefined when nested value doesn't exist", () => {
		expect(getNestedValue('nested.does.not.exist', data)).to.be.undefined;
	});

	it('returns nested object property', () => {
		expect(getNestedValue('nested.value', data)).to.equal(data.nested.value);
	});
});
