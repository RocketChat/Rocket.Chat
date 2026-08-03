/**
 * Request and response examples for the chat endpoints, imported from
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

export const chatExamples: Record<string, PayloadExamples> = {
	'chat.getMessageReadReceipts': {
		response: {
			'200': {
				'Example 1': {
					value: {
						receipts: [
							{
								_id: 'HksCYdTpCiM9DZ7Sa',
								roomId: 'GENERAL',
								userId: 'nvw6PBrXTejp4sfQt',
								messageId: 'WyDsZzjk2wHogtWK2',
								ts: '2018-02-26T20:34:03.907Z',
								user: {
									username: 'rocket.cat',
									name: 'Rocket cat',
									_id: 'nvw6PBrXTejp4sfQt',
								},
							},
						],
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						error: "The required 'messageId' param is missing.",
						success: false,
					},
				},
			},
		},
	},
};
