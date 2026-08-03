/**
 * Request and response examples for the oauthapps endpoints, imported from
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

export const oauthappsExamples: Record<string, PayloadExamples> = {
	'oauth-apps.list': {
		response: {
			'200': {
				'Success Example': {
					value: {
						oauthApps: [
							{
								_id: 'zapier',
								name: 'Zapier',
								active: true,
								clientId: 'zapier',
								clientSecret: 'RTK6TlndaCIolhQhZ7_KHIGOKj41RnlaOq_o-7JKwLr',
								redirectUri: 'https://zapier.com/dashboard/auth/oauth/return/RocketChatDevAPI/',
								_createdAt: '2019-10-17T22:55:32.787Z',
								_createdBy: {
									_id: 'system',
									username: 'system',
								},
								_updatedAt: '2019-10-17T22:55:32.787Z',
							},
						],
						success: true,
					},
				},
			},
		},
	},
	'oauth-apps.delete': {
		response: {
			'200': {
				Success: {
					value: {
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: "must have required property 'appId' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: 'Application not found [error-application-not-found]',
						errorType: 'error-application-not-found',
						details: {
							method: 'deleteOAuthApp',
						},
					},
				},
			},
		},
	},
	'oauth-apps.create': {
		response: {
			'200': {
				'Example 1': {
					value: {
						application: {
							name: 'test-oauth-app',
							redirectUri: 'https://testuri.com',
							active: true,
							clientId: 'bN9D5TjY8Cv8GqWfE',
							clientSecret: 'l3HAl0lSr2VaTYZVED6EabyhNzovS8Je2JYmbjNT-V1',
							_createdAt: '2024-01-17T13:30:41.521Z',
							_updatedAt: '2024-01-17T13:30:41.521Z',
							_createdBy: {
								_id: 'JFTcMhEAFbNPfnp49',
								username: 'math.bar',
							},
							_id: '65a7d68142a7e12453052d56',
						},
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: "must have required property 'name' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: "must have required property 'active' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
				'Example 3': {
					value: {
						success: false,
						error: "must have required property 'redirectUri' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					name: 'test-oauth-app',
					redirectUri: 'https://testuri.com',
					active: true,
				},
			},
		},
	},
	'oauth-apps.update': {
		response: {
			'200': {
				'Example 1': {
					value: {
						_id: '65a7d77142a7e12453052d59',
						name: 'test-oauth-app2',
						redirectUri: 'https://testuri2.com',
						active: false,
						clientId: 'fxHAgLRjP3RswMe67',
						clientSecret: 'QwIAYE1_8M02p-Js8SHZyTPg7HpJm-1ZtbjuSp8bXpP',
						_createdAt: '2024-01-17T13:34:41.445Z',
						_updatedAt: '2024-01-17T13:37:16.966Z',
						_createdBy: {
							_id: 'JFTcMhEAFbNPfnp49',
							username: 'math.bar',
						},
						_updatedBy: {
							_id: 'JFTcMhEAFbNPfnp49',
							username: 'math.bar',
						},
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: "must have required property 'name' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: "must have required property 'active' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
				'Example 3': {
					value: {
						success: false,
						error: "must have required property 'redirectUri' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
				'Example 4': {
					value: {
						success: false,
						error: "must have required property 'appId' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					name: 'test-oauth-app',
					redirectUri: 'https://testuri.com',
					active: true,
				},
			},
		},
	},
	'oauth-apps.get': {
		response: {
			'200': {
				'Example 1': {
					value: {
						oauthApp: {
							_id: 'zapier',
							name: 'Zapier',
							active: true,
							clientId: 'zapier',
							clientSecret: 'RTK6TlndaCIolhQhZ7_KHIGOKj41RnlaOq_o-7JKwLr',
							redirectUri: 'https://zapier.com/dashboard/auth/oauth/return/RocketChatDevAPI/',
							_createdAt: '2019-10-17T22:55:32.787Z',
							_createdBy: {
								_id: 'system',
								username: 'system',
							},
							_updatedAt: '2019-10-17T22:55:32.787Z',
						},
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error:
							"must have required property '_id'\n must have required property 'clientId'\n must have required property 'appId'\n must match exactly one schema in oneOf [invalid-params]",
						errorType: 'invalid-params',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: 'OAuth app not found.',
					},
				},
			},
		},
	},
};
