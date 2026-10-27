const iceServerUrl = { type: 'string', pattern: '^(stun|stuns|turn|turns):' };

export const turnServersSchema = {
	type: 'array',
	items: {
		type: 'object',
		required: ['urls'],
		additionalProperties: false,
		properties: {
			urls: { oneOf: [iceServerUrl, { type: 'array', minItems: 1, items: iceServerUrl }] },
			auth: {
				oneOf: [
					{
						type: 'object',
						required: ['type', 'username', 'credential'],
						additionalProperties: false,
						properties: {
							type: { const: 'static' },
							username: { type: 'string', minLength: 1 },
							credential: { type: 'string', minLength: 1 },
						},
					},
					{
						type: 'object',
						required: ['type', 'secret'],
						additionalProperties: false,
						properties: {
							type: { const: 'shared-secret' },
							secret: { type: 'string', minLength: 1 },
							ttl: { type: 'integer', minimum: 60 },
						},
					},
				],
			},
		},
	},
};
