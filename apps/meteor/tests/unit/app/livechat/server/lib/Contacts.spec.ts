import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const { validateCustomFields } = proxyquire.noCallThru().load('../../../../../../app/livechat/server/lib/Contacts', {
	'meteor/check': sinon.stub(),
	'meteor/meteor': sinon.stub(),
});

describe('[OC] Contacts', () => {
	describe('validateCustomFields', () => {
		const mockCustomFields = [{ _id: 'cf1', label: 'Custom Field 1', regexp: '^[0-9]+$', required: true }];

		it('should validate custom fields correctly', () => {
			expect(() => validateCustomFields(mockCustomFields, { cf1: '123' })).to.not.throw();
		});

		it('should throw an error if a required custom field is missing', () => {
			expect(() => validateCustomFields(mockCustomFields, {})).to.throw();
		});

		it('should NOT throw an error when a non-required custom field is missing', () => {
			const allowedCustomFields = [{ _id: 'field1', label: 'Field 1', required: false }];
			const customFields = {};

			expect(() => validateCustomFields(allowedCustomFields, customFields)).not.to.throw();
		});

		it('should throw an error if a custom field value does not match the regexp', () => {
			expect(() => validateCustomFields(mockCustomFields, { cf1: 'invalid' })).to.throw();
		});

		it('should handle an empty customFields input without throwing an error', () => {
			const allowedCustomFields = [{ _id: 'field1', label: 'Field 1', required: false }];
			const customFields = {};

			expect(() => validateCustomFields(allowedCustomFields, customFields)).not.to.throw();
		});
	});
});
