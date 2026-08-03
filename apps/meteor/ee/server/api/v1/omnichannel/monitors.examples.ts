/**
 * Request and response examples for the monitors endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
/**
 * Local on purpose: importing the framework type here would put the examples in the type graph of
 * every endpoint that uses them, and this module only needs to describe their shape.
 */
type PayloadExamples = {
	query?: Record<string, unknown>;
	params?: Record<string, unknown>;
	body?: unknown;
	response?: Record<number, unknown>;
};

export const monitorsExamples: Record<string, PayloadExamples> = {
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
};
