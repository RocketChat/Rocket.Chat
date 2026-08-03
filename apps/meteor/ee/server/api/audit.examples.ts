/**
 * Request and response examples for the audit endpoints, imported from
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

export const auditExamples: Record<string, PayloadExamples> = {
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
};
