/**
 * Request and response examples for the agent endpoints, imported from
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

export const agentExamples: Record<string, PayloadExamples> = {
	'livechat/agents.saveInfo': {
		body: {
			'Example 1': {
				value: {
					agentId: '4zqiF9BSWmBTe6yvt',
					agentData: {},
					agentDepartments: [''],
				},
			},
		},
	},
};
