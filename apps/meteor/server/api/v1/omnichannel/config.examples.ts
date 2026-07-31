import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the config endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const configExamples = {
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
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
