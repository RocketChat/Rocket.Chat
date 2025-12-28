import { expect } from 'chai';
import proxyquire from 'proxyquire';

const { validateCustomFields } = proxyquire.noCallThru().load('./validateCustomFields', {});

describe('validateCustomFields', () => {
	const mockCustomFields = [{ _id: 'cf1', label: 'Custom Field 1', regexp: '^[0-9]+$', required: true }];

	it('should validate custom fields correctly', () => {
		expect(() => validateCustomFields(mockCustomFields, { cf1: '123' })).to.not.throw();
	});

	it('should throw an error if a required custom field is missing', () => {
		expect(() => validateCustomFields(mockCustomFields, {})).to.throw();
	});

	it('should not throw an error if a required custom field is missing, but the ignoreValidationErrors option is provided', () => {
		expect(() => validateCustomFields(mockCustomFields, {}, { ignoreValidationErrors: true }))
			.not.to.throw()
			.and.to.equal({});
	});

	it('should NOT throw an error when a non-required custom field is missing', () => {
		const allowedCustomFields = [{ _id: 'field1', label: 'Field 1', required: false }];
		const customFields = {};

		expect(() => validateCustomFields(allowedCustomFields, customFields)).not.to.throw();
	});

	it('should throw an error if a custom field value does not match the regexp', () => {
		expect(() => validateCustomFields(mockCustomFields, { cf1: 'invalid' })).to.throw();
	});

	it('should not throw an error if a custom field value does not match the regexp, but the ignoreValidationErrors option is provided', () => {
		expect(() => validateCustomFields(mockCustomFields, { cf1: 'invalid' }, { ignoreValidationErrors: true }))
			.not.to.throw()
			.and.to.equal({});
	});

	it('should handle an empty customFields input without throwing an error', () => {
		const allowedCustomFields = [{ _id: 'field1', label: 'Field 1', required: false }];
		const customFields = {};

		expect(() => validateCustomFields(allowedCustomFields, customFields)).not.to.throw();
	});

	it('should throw an error if a extra custom field is passed', () => {
		const allowedCustomFields = [{ _id: 'field1', label: 'Field 1', required: false }];
		const customFields = { field2: 'value' };

		expect(() => validateCustomFields(allowedCustomFields, customFields)).to.throw();
	});

	it('should not throw an error if a extra custom field is passed, but the ignoreValidationErrors option is provided', () => {
		const allowedCustomFields = [{ _id: 'field1', label: 'Field 1', required: false }];
		const customFields = { field2: 'value' };

		expect(() => validateCustomFields(allowedCustomFields, customFields, { ignoreValidationErrors: true }))
			.not.to.throw()
			.and.to.equal({});
	});
});
