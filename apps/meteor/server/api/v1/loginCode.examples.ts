import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the loginCode endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const loginCodeExamples = {
	'loginCode.redeem': {
		response: {
			'200': {
				'Redemption successful': {
					value: {
						loginToken: '9HqLlyZOugoStsXCUfD_0YdwnNnunAJF8V47U3QHXSq',
						userId: 'aobEdbYhXfu5hkeqG',
						success: true,
					},
				},
			},
			'400': {
				'Invalid request': {
					value: {
						success: false,
						error: 'must NOT have fewer than 64 characters [invalid-params]',
						errorType: 'invalid-params',
					},
				},
				'Invalid or expired code': {
					value: {
						success: false,
						error: 'error-invalid-code',
					},
				},
			},
		},
		body: {
			'Redeem login code': {
				value: {
					code: '4f1d2c3b4a5968778695a4b3c2d1e0f1123456789abcdef00fedcba987654321',
				},
			},
		},
	},
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
