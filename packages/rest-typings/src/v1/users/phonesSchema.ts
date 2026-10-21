export const phonesSchema = {
	type: 'array',
	items: {
		type: 'object',
		properties: {
			number: { type: 'string', transformStripWhitespaces: true, format: 'basic_phone_number' },
			label: { type: 'string', maxLength: 50 },
		},
		required: ['number'],
		additionalProperties: false,
	},
};
