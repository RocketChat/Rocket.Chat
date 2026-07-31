import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the channels endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const channelsExamples = {
	'engagement-dashboard/channels/list': {
		response: {
			'200': {
				'Success Example': {
					value: {
						channels: [
							{
								room: {
									_id: 'string',
									name: 'string',
									ts: 'string',
									t: 'string',
									_updatedAt: 'string',
								},
								messages: 0,
								lastWeekMessages: 0,
								diffFromLastWeek: 0,
							},
						],
						total: 0,
						offset: 0,
						count: 0,
						success: true,
					},
				},
			},
		},
	},
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
