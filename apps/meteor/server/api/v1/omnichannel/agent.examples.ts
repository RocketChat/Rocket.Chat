import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the agent endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const agentExamples = {
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
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
