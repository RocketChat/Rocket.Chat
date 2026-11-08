import { MAX_USER_PHONES } from '@rocket.chat/core-typings';

export const phonesSchema = {
	type: 'array',
	maxItems: MAX_USER_PHONES,
	items: {
		type: 'object',
		properties: {
			number: { type: 'string', transformStripWhitespaces: true, format: 'basic_phone_number' },
			label: { type: 'string', isNotEmpty: true, maxLength: 50 },
		},
		required: ['number'],
		additionalProperties: false,
	},
};
