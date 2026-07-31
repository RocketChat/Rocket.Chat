import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the push endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const pushExamples = {
	'push.token': {
		response: {
			'400': {
				'Invalid Token Parameter': {
					value: {
						success: false,
						error: 'The required "token" body param is missing or invalid. [error-token-param-not-valid]',
						errorType: 'error-token-param-not-valid',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					token: 'abc',
				},
			},
		},
	},
	'push.get': {
		response: {
			'200': {
				'Success Example': {
					value: {
						data: {
							message: {
								_id: 'WkbwSntxt8D3jLp8G',
								rid: 'iu7jtPAhvEeAS5tNq',
								msg: 'fsfs',
								ts: '2021-10-22T14:29:23.581Z',
								u: {
									_id: 'd26x6zSkaPSe5gCyy',
									username: 'rodriq',
									name: 'Rodriq',
								},
								urls: [],
								mentions: [],
								channels: [],
								md: [
									{
										type: 'PARAGRAPH',
										value: [
											{
												type: 'PLAIN_TEXT',
												value: 'fsfs',
											},
										],
									},
								],
								_updatedAt: '2021-10-22T14:29:23.603Z',
							},
							notification: {
								from: 'push',
								badge: 2,
								sound: 'default',
								priority: 10,
								title: '#vb',
								text: 'rodriq: fsfs',
								payload: {
									host: 'http://localhost:3000/',
									messageId: 'WkbwSntxt8D3jLp8G',
									notificationType: 'message',
									rid: 'iu7jtPAhvEeAS5tNq',
									sender: {
										_id: 'd26x6zSkaPSe5gCyy',
										username: 'rodriq',
										name: 'Rodriq',
									},
									senderName: 'rodriq',
									type: 'c',
									name: 'vb',
								},
								userId: 'd26x6zSkaPSe5gCyy',
								notId: 654494840,
								gcm: {
									style: 'inbox',
									image: 'http://localhost:3000/images/logo/android-chrome-192x192.png',
								},
								apn: {
									category: 'MESSAGE',
								},
							},
						},
						success: true,
					},
				},
			},
			'400': {
				Example: {
					value: {
						success: false,
						error: "Match error: Missing key 'id'",
					},
				},
			},
		},
	},
	'push.info': {
		response: {
			'200': {
				'Example 1': {
					value: {
						pushGatewayEnabled: true,
						defaultPushGateway: true,
						success: true,
					},
				},
			},
		},
	},
	'push.test': {
		response: {
			'200': {
				'Example 1': {
					value: {
						tokensCount: 1,
						success: true,
					},
				},
			},
		},
	},
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
