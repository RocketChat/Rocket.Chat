import { expect } from 'chai';

import { validateCustomMessageFields } from '../../../../../../app/lib/server/lib/validateCustomMessageFields';

describe('validateCustomMessageFields', () => {
	describe('When not enabled', () => {
		it('should not allow to pass custom fields', () => {
			const customFields = {
				test: 'test',
			};
			expect(() => validateCustomMessageFields(customFields, false, '')).to.throw('Custom fields not enabled');
		});
	});

	describe('When enabled', () => {
		it('should not allow to pass invalid custom fields config', () => {
			const customFields = {
				test: 'test',
			};
			expect(() => validateCustomMessageFields(customFields, true, '')).to.throw('Unexpected end of JSON input');
		});

		it('should not allow to pass a property not present in config', () => {
			const customFields = {
				test: 'test',
			};
			const config = JSON.stringify({
				properties: {
					priority: {
						type: 'string',
					},
				},
				additionalProperties: true,
			});
			expect(() => validateCustomMessageFields(customFields, true, config)).to.throw('Invalid custom fields');
		});

		it('should not allow to pass anything different from an object', () => {
			const customFields = [1, 2];
			const config = JSON.stringify({
				type: 'array',
				items: [{ type: 'integer' }, { type: 'integer' }],
			});
			expect(() => validateCustomMessageFields(customFields, true, config)).to.throw('Invalid custom fields config');
		});

		it('should allow to pass a valid custom fields config', () => {
			const customFields = {
				test: 'test',
			};
			const config = JSON.stringify({
				properties: {
					test: {
						type: 'string',
					},
				},
			});
			expect(() => validateCustomMessageFields(customFields, true, config)).to.not.throw();
		});
	});
});
