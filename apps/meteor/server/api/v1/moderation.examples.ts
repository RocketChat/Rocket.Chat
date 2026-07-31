import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the moderation endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const moderationExamples = {
	'moderation.reportsByUsers': {
		response: {
			'200': {
				'Success Example': {
					value: {
						reports: [
							{
								rooms: [
									{
										_id: '6423ce62c29657e5b3ba2675rbAXPnMktTFbNpwtJ',
										t: 'd',
										federated: true,
									},
								],
								count: 1,
								message: 'hi',
								msgId: 'tDNLALSFk2LET2JZH',
								ts: '2023-08-30T09:38:38.792Z',
								username: 'test.test',
								name: 'test test',
								userId: 'rbAXPnMktTFbNpwtJ',
								isUserDeleted: false,
							},
							{
								rooms: [
									{
										_id: '5fRTXMt7DMJbpPJfhrbAXPnMktTFbNpwtJ',
										t: 'd',
									},
								],
								count: 2,
								message: 'himm',
								msgId: 'xY8cN7yuPQfBgJ9xz',
								ts: '2023-08-30T09:33:15.621Z',
								username: 'test.test',
								name: 'Testtest',
								userId: '5fRTXMt7DMJbpPJfh',
								isUserDeleted: false,
							},
						],
						count: 2,
						offset: 0,
						total: 3,
						success: true,
					},
				},
			},
		},
	},
	'moderation.userReports': {
		response: {
			'200': {
				'Example 1': {
					value: {
						reports: [
							{
								count: 1,
								reportedUser: {
									_id: 'J6Q87AnWP5aNc9xhx',
									createdAt: '2025-02-04T13:02:39.356Z',
									username: 'cat.kate',
									emails: [
										{
											address: 'testaz@example.com',
											verified: false,
										},
									],
									name: 'cat kate',
								},
								ts: '2026-01-16T07:36:00.020Z',
							},
						],
						count: 1,
						offset: 0,
						total: 1,
						success: true,
					},
				},
			},
		},
	},
	'moderation.user.reportedMessages': {
		response: {
			'200': {
				'Success Example': {
					value: {
						user: {
							_id: '5fRTXMt7DMJbpPJfh',
							username: 'test.test',
							name: 'Testtest',
						},
						messages: [
							{
								_id: '64ef0f992c26843a68c1f785',
								message: {
									_id: 'EbhcT4vjrCDyZuHKq',
									rid: '5fRTXMt7DMJbpPJfhrbAXPnMktTFbNpwtJ',
									msg: 'hola',
									ts: '2023-08-30T09:44:30.805Z',
									u: {
										_id: '5fRTXMt7DMJbpPJfh',
										username: 'test.test',
										name: 'Testtest',
									},
									_updatedAt: '2023-08-30T09:44:30.968Z',
									urls: [],
									mentions: [],
									channels: [],
									md: [
										{
											type: 'PARAGRAPH',
											value: [
												{
													type: 'PLAIN_TEXT',
													value: 'hola',
												},
											],
										},
									],
								},
								room: {
									_id: '5fRTXMt7DMJbpPJfhrbAXPnMktTFbNpwtJ',
									t: 'd',
								},
								ts: '2023-08-30T09:44:57.912Z',
							},
							{
								_id: '64ef0cdb2c26843a68c1f780',
								message: {
									_id: 'xY8cN7yuPQfBgJ9xz',
									rid: '5fRTXMt7DMJbpPJfhrbAXPnMktTFbNpwtJ',
									msg: 'himm',
									ts: '2023-07-11T01:37:07.951Z',
									u: {
										_id: '5fRTXMt7DMJbpPJfh',
										username: 'test.test',
										name: 'Testtest',
									},
									_updatedAt: '2023-07-11T01:37:08.024Z',
									urls: [],
									mentions: [],
									channels: [],
									md: [
										{
											type: 'PARAGRAPH',
											value: [
												{
													type: 'PLAIN_TEXT',
													value: 'himm',
												},
											],
										},
									],
								},
								room: {
									_id: '5fRTXMt7DMJbpPJfhrbAXPnMktTFbNpwtJ',
									t: 'd',
								},
								ts: '2023-08-30T09:33:15.621Z',
							},
						],
						count: 2,
						total: 2,
						offset: 0,
						success: true,
					},
				},
			},
		},
	},
	'moderation.user.reportsByUserId': {
		response: {
			'200': {
				'Example 1': {
					value: {
						user: {
							_id: 'J6Q87AnWP5aNc9xhx',
							createdAt: '2025-02-04T13:02:39.356Z',
							username: 'cat.kate',
							emails: [
								{
									address: 'testaz@example.com',
									verified: false,
								},
							],
							roles: ['user', 'livechat-agent', 'livechat-monitor'],
							active: true,
							name: 'cat kate',
							avatarETag: 'pwJbBtoz47Zkf9myK',
						},
						reports: [
							{
								_id: '6969ea608de1f4fa0e7f62fa',
								description: 'issue',
								reportedBy: {
									_id: 'C38WSSzrGd2NCjzqJ',
									name: 'test cat',
									username: 'test.cat',
									createdAt: null,
								},
								reportedUser: {
									_id: 'J6Q87AnWP5aNc9xhx',
									createdAt: '2025-02-04T13:02:39.356Z',
									username: 'cat.kate',
									emails: [
										{
											address: 'testaz@example.com',
											verified: false,
										},
									],
									name: 'cat kate',
								},
								ts: '2026-01-16T07:36:00.020Z',
							},
						],
						count: 1,
						total: 1,
						offset: 0,
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: "must have required property 'userId' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
	},
	'moderation.dismissUserReports': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error:
							"must have required property 'msgId'\n must have required property 'userId'\n must match exactly one schema in oneOf [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					userId: 'qHWhoJwwgk4bwcoNq',
					reason: 'Description',
				},
			},
		},
	},
	'moderation.reports': {
		response: {
			'200': {
				'Success Example': {
					value: {
						reports: [
							{
								_id: '64ef0f992c26843a68c1f785',
								description: 'test report\n',
								reportedBy: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'test.test',
									name: 'test test',
									createdAt: '2023-02-20T13:42:07.119Z',
								},
								room: {
									_id: '5fRTXMt7DMJbpPJfhrbAXPnMktTFbNpwtJ',
									t: 'd',
								},
								ts: '2023-08-30T09:44:57.912Z',
							},
						],
						count: 1,
						offset: 0,
						total: 1,
						success: true,
					},
				},
			},
		},
	},
	'moderation.reportUser': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: "must have required property 'userId' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					userId: 'ByehQjC44FwMeiLbX',
					description: 'test',
				},
			},
		},
	},
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
