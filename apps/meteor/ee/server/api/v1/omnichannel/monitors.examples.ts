import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the monitors endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const monitorsExamples = {
	'livechat/monitors.create': {
		response: {
			'200': {
				'Example 1': {
					value: {
						_id: 'J6Q87AnWP5aNc9xhx',
						username: 'cat.kat',
						roles: ['user', 'livechat-agent'],
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						errorType: 'invalid-params',
						error: "must have required property 'username'",
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					username: 'cat.kat',
				},
			},
		},
	},
	'livechat/monitors.delete': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						errorType: 'invalid-params',
						error: "must have required property 'username'",
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					username: 'test.user',
				},
			},
		},
	},
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
