import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the audit endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const auditExamples = {
	'audit/rooms.members': {
		response: {
			'200': {
				'Example 1': {
					value: {
						members: [
							{
								_id: 'FSA63o85Poa2EQvAH',
								status: 'offline',
								name: 'cat kate',
								username: 'cat.kate',
								_updatedAt: '2024-08-27T09:07:03.795Z',
							},
						],
						count: 1,
						offset: 0,
						total: 1,
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: "must have required property 'roomId' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
	},
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
