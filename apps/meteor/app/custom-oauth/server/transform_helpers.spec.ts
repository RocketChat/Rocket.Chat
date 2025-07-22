import { normalizers, fromTemplate, renameInvalidProperties, getNestedValue, getRegexpMatch } from './transform_helpers';

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
	'attributes': {
		displayName: ['Foo Bar'],
	},
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
		expect(result).toEqual(expected);
	});

	it('returns match from regexp on nested properties', () => {
		const template = '{{/^ba(.+)/::nested.value}}';
		const expected = 'z';
		const result = fromTemplate(template, normalizedData);
		expect(result).toEqual(expected);
	});

	it('returns value from nested prop with plain syntax', () => {
		const template = 'nested.value';
		const expected = normalizedData.nested.value;
		const result = fromTemplate(template, normalizedData);
		expect(result).toEqual(expected);
	});

	it('returns value from nested prop with template syntax', () => {
		const template = '{{nested.value}}';
		const expected = normalizedData.nested.value;
		const result = fromTemplate(template, normalizedData);
		expect(result).toEqual(expected);
	});

	it('returns composed value from nested prop with template syntax', () => {
		const template = '{{name}}.{{nested.value}}';
		const expected = `${normalizedData.name}.${normalizedData.nested.value}`;
		const result = fromTemplate(template, normalizedData);

		expect(result).toEqual(expected);
	});

	it('returns composed string from multiple template chunks with static parts', () => {
		const template = 'composed-{{name}}-at-{{nested.value}}-dot-{{/^foo@bar.(.+)/::email}}-from-template';
		const expected = 'composed-foo-at-baz-dot-com-from-template';
		const result = fromTemplate(template, normalizedData);
		expect(result).toEqual(expected);
	});

	it('returns first element from array', () => {
		const template = 'attributes.displayName.0';
		const expected = normalizedData.attributes.displayName[0];
		const result = fromTemplate(template, normalizedData);
		expect(result).toEqual(expected);
	});
});

describe('getRegexpMatch', () => {
	it('returns nested value when formula is not in the regex::field form', () => {
		const formula = 'nested.value';
		expect(getRegexpMatch(formula, data)).toEqual(data.nested.value);
	});

	it("returns undefined when regex doesn't match", () => {
		const formula = '/^foo@baz(.+)/::email';
		expect(getRegexpMatch(formula, data)).toBeUndefined();
	});

	it("throws when regex isn't valid", () => {
		const formula = '/+/::email';
		expect(() => getRegexpMatch(formula, data)).toThrow();
	});
});

describe('renameInvalidProperties', () => {
	it('replaces . chars in field names with _', () => {
		const result = renameInvalidProperties(data);

		expect(result['invalid.property']).toBeUndefined();
		expect(result.invalid_property).toEqual(data['invalid.property']);

		expect(result.nested['invalid.property']).toBeUndefined();

		// @ts-expect-error - TODO: `invalid.property` is not a valid property name
		expect(result.nested.invalid_property).toEqual(data.nested['invalid.property']);

		// @ts-expect-error - TODO: `invalid.property` is not a valid property name
		result.list.forEach((item, idx) => {
			expect(item['invalid.property']).toBeUndefined();
			expect(item.invalid_property).toEqual(data.list[idx]['invalid.property']);
		});
	});
});

describe('getNestedValue', () => {
	it("returns undefined when nested value doesn't exist", () => {
		expect(getNestedValue('nested.does.not.exist', data)).toBeUndefined();
	});

	it('returns nested object property', () => {
		expect(getNestedValue('nested.value', data)).toEqual(data.nested.value);
	});
});
