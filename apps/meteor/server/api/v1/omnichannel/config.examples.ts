/**
 * Request and response examples for the config endpoints, imported from
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

export const configExamples: Record<string, PayloadExamples> = {
	'livechat/config/routing': {
		response: {
			'200': {
				'Example 1': {
					value: {
						config: {
							previewRoom: false,
							showConnecting: false,
							showQueue: false,
							showQueueLink: true,
							returnQueue: false,
							enableTriggerAction: true,
							autoAssignAgent: true,
						},
						success: true,
					},
				},
			},
		},
	},
};
