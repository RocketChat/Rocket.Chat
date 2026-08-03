/**
 * Request and response examples for the integrations endpoints, imported from
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

export const integrationsExamples: Record<string, PayloadExamples> = {
	'integrations.create': {
		response: {
			'200': {
				'Incoming integration example': {
					value: {
						integration: {
							type: 'webhook-incoming',
							username: 'test.cat',
							channel: ['#general'],
							scriptEnabled: true,
							name: 'test.cat',
							enabled: true,
							scriptEngine: 'isolated-vm',
							overrideDestinationChannelEnabled: false,
							token: 'XuHp73MccmCvJ9m3fKdQK6HKW9tjhBcbTKKHCSSLsv7qn4fk',
							userId: 'CkCPNcvsvCDfmWLqC',
							_createdAt: '2024-01-10T14:12:07.739Z',
							_createdBy: {
								_id: 'CkCPNcvsvCDfmWLqC',
								username: 'test.cat',
							},
							_id: '659ea5b72dd9f928ada3e43e',
						},
						success: true,
					},
				},
				'Outgoing integration example': {
					value: {
						integration: {
							type: 'webhook-outgoing',
							username: 'test.cat',
							channel: ['#general'],
							scriptEnabled: true,
							name: 'test.cat',
							enabled: true,
							event: 'sendMessage',
							urls: ['https://text2gif.guggy.com/guggify'],
							scriptEngine: 'isolated-vm',
							userId: 'CkCPNcvsvCDfmWLqC',
							_createdAt: '2024-01-10T14:12:52.201Z',
							_createdBy: {
								_id: 'CkCPNcvsvCDfmWLqC',
								username: 'test.cat',
							},
							_id: '659ea5e42dd9f928ada3e451',
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
							"must have required property 'type'\n must have required property 'type'\n must match exactly one schema in oneOf [invalid-params]",
						errorType: 'invalid-params',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error:
							"must have required property 'username'\n must have required property 'username'\n must match exactly one schema in oneOf [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
		body: {
			'Incoming integration example': {
				value: {
					type: 'webhook-incoming',
					username: 'test.cat',
					channel: '#general',
					scriptEnabled: true,
					name: 'test.cat',
					enabled: true,
				},
			},
			'Outgoing integration example': {
				value: {
					type: 'webhook-outgoing',
					username: 'test.cat',
					channel: '#general',
					scriptEnabled: true,
					name: 'test.cat',
					enabled: true,
					event: 'sendMessage',
					urls: ['https://text2gif.guggy.com/guggify'],
				},
			},
		},
	},
	'integrations.history': {
		response: {
			'200': {
				'Example 1': {
					value: {
						history: [],
						offset: 0,
						items: 0,
						total: 0,
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: "must have required property 'id' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
	},
	'integrations.list': {
		response: {
			'200': {
				'Success Example': {
					value: {
						integrations: [
							{
								_id: 'WMQDChpnYTRmFre9h',
								enabled: true,
								username: 'rocket.cat',
								alias: 'Guggy',
								avatar: 'https://image.crisp.im/avatar/website/17651a90-e082-43f6-b308-957cea6e323c/128',
								name: 'Guggy',
								triggerWords: ['!guggy', 'guggy', 'gif+'],
								urls: ['http://text2gif.guggy.com/guggify'],
								token: 'aobEdbYhXfu5hkeqG',
								script: '...',
								scriptEnabled: true,
								impersonateUser: false,
								scriptCompiled: '...',
								scriptError: null,
								type: 'webhook-outgoing',
								userId: 'rocket.cat',
								channel: [],
								_createdAt: '2017-01-05T17:06:05.660Z',
								_createdBy: {
									username: 'graywolf336',
									_id: 'R4jgcQaQhvvK6K3iY',
								},
								_updatedAt: '2017-01-05T17:06:05.660Z',
							},
							{
								_id: '3aazpZ2WzoBP8msi9',
								type: 'webhook-outgoing',
								name: 'Testing via REST API',
								enabled: false,
								username: 'rocket.cat',
								urls: ['http://text2gif.guggy.com/guggify'],
								scriptEnabled: false,
								userId: 'rocket.cat',
								channel: [],
								_createdAt: '2017-01-06T13:23:46.018Z',
								_createdBy: {
									username: 'graywolf336',
									_id: 'R4jgcQaQhvvK6K3iY',
								},
								_updatedAt: '2017-01-06T13:23:46.018Z',
							},
						],
						offset: 0,
						items: 2,
						total: 2,
						success: true,
					},
				},
			},
		},
	},
	'integrations.remove': {
		response: {
			'200': {
				'Incoming integration example': {
					value: {
						integration: {
							type: 'webhook-incoming',
							username: 'rocket.cat',
							channel: false,
							scriptEnabled: 'sendMessage',
							name: 'sendMessage',
							enabled: 'sendMessage',
						},
					},
				},
				'Outgoing integration example': {
					value: {
						integration: {
							_id: 'oNLthAt9RwMw39N2B',
							type: 'webhook-outgoing',
							name: 'Testing via REST API',
							enabled: false,
							username: 'rocket.cat',
							urls: ['http://text2gif.guggy.com/guggify'],
							scriptEnabled: false,
							userId: 'rocket.cat',
							channel: [],
							_createdAt: '2017-01-06T13:42:14.143Z',
							_createdBy: {
								username: 'graywolf336',
								_id: 'R4jgcQaQhvvK6K3iY',
							},
							_updatedAt: '2017-01-06T13:42:14.144Z',
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
							"must have required property 'type'\n must have required property 'type'\n must have required property 'type'\n must match exactly one schema in oneOf [invalid-params]",
						errorType: 'invalid-params',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error:
							"must have required property 'integrationId'\n must have required property 'target_url'\n must have required property 'integrationId'\n must match exactly one schema in oneOf [invalid-params]",
						errorType: 'invalid-params',
					},
				},
				'Example 3': {
					value: {
						success: false,
						error: 'No integration found.',
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					integrationId: 'oNLthAt9RwMw39N2B',
					type: 'webhook-outgoing',
				},
			},
		},
	},
	'integrations.get': {
		response: {
			'200': {
				'Success Example': {
					value: {
						integration: {
							_id: '659ea5e42dd9f928ada3e451',
							type: 'webhook-outgoing',
							username: 'test.cat',
							channel: ['#general'],
							scriptEnabled: true,
							name: 'test.cat',
							enabled: true,
							event: 'sendMessage',
							urls: ['https://text2gif.guggy.com/guggify'],
							scriptEngine: 'isolated-vm',
							userId: 'CkCPNcvsvCDfmWLqC',
							_createdAt: '2024-01-10T14:12:52.201Z',
							_createdBy: {
								_id: 'CkCPNcvsvCDfmWLqC',
								username: 'test.cat',
							},
							_updatedAt: '2024-01-10T14:12:52.203Z',
						},
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: "must have required property 'integrationId' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: 'The integration does not exists.',
					},
				},
			},
		},
	},
	'integrations.update': {
		response: {
			'200': {
				'Success Example': {
					value: {
						integration: {
							_id: 'x3tPXa9XXRqW6Xp2M',
							enabled: false,
							channel: ['#test'],
							username: 'rodriq',
							name: 'Test',
							alias: 'Jim',
							avatarUrl: '',
							emoji: ':ghost:',
							scriptEnabled: false,
							script: 'console.log("MANNNNN ---------------------------------------------------------")',
							type: 'webhook-incoming',
							token: 'XYsrkngRr5PBkWhCqJWk5ZfKzQoxSv4QhxkK5trSgJENwbRL',
							userId: 'd26x6zSkaPSe5gCyy',
							_createdAt: '2021-10-22T14:48:46.025Z',
							_createdBy: {
								_id: 'd26x6zSkaPSe5gCyy',
								username: 'rod',
							},
							_updatedAt: '2021-10-22T16:08:39.843Z',
							_updatedBy: {
								_id: 'd26x6zSkaPSe5gCyy',
								username: 'rod',
							},
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
							"must have required property 'type'\n must have required property 'type'\n must match exactly one schema in oneOf [invalid-params]",
						errorType: 'invalid-params',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error:
							"must have required property 'integrationId'\n must have required property 'type'\n must match exactly one schema in oneOf [invalid-params]",
						errorType: 'invalid-params',
					},
				},
				'Example 3': {
					value: {
						success: false,
						error: 'No integration found.',
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					type: 'webhook-incoming',
					name: 'Test',
					enabled: false,
					username: 'rocket.cat',
					scriptEnabled: false,
					channel: '#test',
					integrationId: 'x3tPXa9XXRqW6Xp2M',
				},
			},
		},
	},
	'integrations.clearHistory': {
		response: {
			'200': {
				'Success Example': {
					value: {
						success: true,
					},
				},
			},
			'400': {
				'Invalid Parameter': {
					value: {
						success: false,
						error: "must have required property 'integrationId' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
				'Invalid Integration': {
					value: {
						success: false,
						error: 'Invalid integration [error-invalid-integration]',
						errorType: 'error-invalid-integration',
					},
				},
				'Not Authorized for this Integration': {
					value: {
						success: false,
						error: 'Unauthorized [not_authorized]',
						errorType: 'not_authorized',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					integrationId: 'nvdQuJQ6tE9HRFBzd',
				},
			},
		},
	},
	'integrations.replayOutgoing': {
		response: {
			'200': {
				Success: {
					value: {
						success: true,
					},
				},
			},
			'400': {
				'Invalid Parameter': {
					value: {
						success: false,
						errorType: 'invalid-params',
						error: "must have required property 'historyId'",
					},
				},
				'Invalid Integration': {
					value: {
						success: false,
						error: 'Invalid integration [error-invalid-integration]',
						errorType: 'error-invalid-integration',
						details: {
							method: 'replayOutgoingIntegration',
						},
					},
				},
				'Invalid Integration History': {
					value: {
						success: false,
						error: 'Invalid Integration History [error-invalid-integration-history]',
						errorType: 'error-invalid-integration-history',
						details: {
							method: 'replayOutgoingIntegration',
						},
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					integrationId: 'nvdQuJQ6tE9HRFBzd',
					historyId: '8G2GfBz3prSampleId',
				},
			},
		},
	},
};
