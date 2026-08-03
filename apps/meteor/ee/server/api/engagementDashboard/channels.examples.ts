/**
 * Request and response examples for the channels endpoints, imported from
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

export const channelsExamples: Record<string, PayloadExamples> = {
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
};
