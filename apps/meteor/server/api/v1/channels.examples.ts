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
	'channels.addAll': {
		response: {
			'200': {
				Success: {
					value: {
						channel: {
							_id: 'ByehQjC44FwMeiLbX',
							name: 'channelname',
							t: 'c',
							usernames: ['example', 'rocket.cat'],
							msgs: 0,
							u: {
								_id: 'aobEdbYhXfu5hkeqG',
								username: 'example',
							},
							ts: '2016-05-30T13:42:25.304Z',
						},
						success: true,
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roomId: 'WDuJLFkjwk6L7LdFC',
					activeUsersOnly: true,
				},
			},
		},
	},
	'channels.archive': {
		response: {
			'400': {
				'Channel is already archived': {
					value: {
						success: false,
						error: 'The channel, add-room-websocket, is archived [error-room-archived]',
						errorType: 'error-room-archived',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roomId: 'ByehQjC44FwMeiLbX',
				},
			},
		},
	},
	'channels.history': {
		response: {
			'200': {
				Example: {
					value: {
						messages: [
							{
								_id: 'AkzpHAvZpdnuchw2a',
								rid: 'ByehQjC44FwMeiLbX',
								msg: 'hi',
								ts: '2016-12-09T12:50:51.555Z',
								u: {
									_id: 'y65tAmHs93aDChMWu',
									username: 'testing',
								},
								_updatedAt: '2016-12-09T12:50:51.562Z',
							},
							{
								_id: 'vkLMxcctR4MuTxreF',
								t: 'uj',
								rid: 'ByehQjC44FwMeiLbX',
								ts: '2016-12-08T15:41:37.730Z',
								msg: 'testing2',
								u: {
									_id: 'bRtgdhzM6PD9F8pSx',
									username: 'testing2',
								},
								groupable: false,
								_updatedAt: '2016-12-08T16:03:25.235Z',
							},
							{
								_id: 'bfRW658nEyEBg75rc',
								t: 'uj',
								rid: 'ByehQjC44FwMeiLbX',
								ts: '2016-12-07T15:47:49.099Z',
								msg: 'testing',
								u: {
									_id: 'nSYqWzZ4GsKTX4dyK',
									username: 'testing1',
								},
								groupable: false,
								_updatedAt: '2016-12-07T15:47:49.099Z',
							},
							{
								_id: 'pbuFiGadhRZTKouhB',
								t: 'uj',
								rid: 'ByehQjC44FwMeiLbX',
								ts: '2016-12-06T17:57:38.635Z',
								msg: 'testing',
								u: {
									_id: 'y65tAmHs93aDChMWu',
									username: 'testing',
								},
								groupable: false,
								_updatedAt: '2016-12-06T17:57:38.635Z',
							},
						],
						success: true,
					},
				},
			},
		},
	},
	'channels.roles': {
		response: {
			'200': {
				Success: {
					value: {
						roles: [
							{
								_id: 'rGNoXwYuZshq9FENQ',
								rid: 'WDuJLFkjwk6L7LdFC',
								u: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'roxie',
								},
								roles: ['owner'],
							},
							{
								_id: '64ef8a982c26843a68c1f7ae',
								rid: 'WDuJLFkjwk6L7LdFC',
								u: {
									_id: '5fRTXMt7DMJbpPJfh',
									username: 'test.test',
									name: 'Testtest',
								},
								roles: ['leader'],
							},
						],
						success: true,
					},
				},
			},
		},
	},
	'channels.join': {
		response: {
			'200': {
				Example: {
					value: {
						channel: {
							_id: 'nxXKHF2o2nzKYtFMM',
							name: 'test',
							fname: 'test',
							t: 'c',
							msgs: 8,
							usersCount: 2,
							u: {
								_id: 'rocketchat.internal.admin.test',
								username: 'rocketchat.internal.admin.test',
							},
							customFields: {},
							broadcast: false,
							encrypted: false,
							ts: '2019-01-16T12:00:04.783Z',
							ro: false,
							sysMes: true,
							default: false,
							_updatedAt: '2019-01-16T12:06:30.426Z',
							joinCodeRequired: true,
						},
						success: true,
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roomId: 'ByehQjC44FwMeiLbX',
					joinCode: '1234',
				},
			},
		},
	},
	'channels.kick': {
		response: {
			'200': {
				Example: {
					value: {
						channel: {
							_id: 'ByehQjC44FwMeiLbX',
							name: 'invite-me',
							t: 'c',
							usernames: ['testing1'],
							msgs: 0,
							u: {
								_id: 'aobEdbYhXfu5hkeqG',
								username: 'testing1',
							},
							ts: '2016-12-09T15:08:58.042Z',
							ro: false,
							sysMes: true,
							_updatedAt: '2016-12-09T15:22:40.656Z',
						},
						success: true,
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roomId: 'WDuJLFkjwk6L7LdFC',
					userId: 'rYhzFRd2QZjNwAAXX',
				},
			},
		},
	},
	'channels.leave': {
		response: {
			'200': {
				Example: {
					value: {
						channel: {
							_id: 'ByehQjC44FwMeiLbX',
							name: 'invite-me',
							t: 'c',
							usernames: ['testing2'],
							msgs: 0,
							u: {
								_id: 'aobEdbYhXfu5hkeqG',
								username: 'testing1',
							},
							ts: '2016-12-09T15:08:58.042Z',
							ro: false,
							sysMes: true,
							_updatedAt: '2016-12-09T15:22:40.656Z',
						},
						success: true,
					},
				},
			},
		},
	},
	'channels.messages': {
		response: {
			'200': {
				Success: {
					value: {
						messages: [
							{
								_id: 'uASTuwBEu7SBDAxxh',
								rid: '6513afeda2f73c7460e18c86',
								msg: 'threaads produced links',
								ts: '2023-09-27T04:36:47.522Z',
								u: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'roxie',
									name: 'test test',
								},
								_updatedAt: '2023-09-27T04:36:47.698Z',
								urls: [],
								mentions: [],
								channels: [],
								md: [
									{
										type: 'PARAGRAPH',
										value: [
											{
												type: 'PLAIN_TEXT',
												value: 'threaads produced links',
											},
										],
									},
								],
							},
							{
								_id: 'B7Yms4bCvgJsitrBq',
								rid: '6513afeda2f73c7460e18c86',
								msg: 'always do',
								ts: '2023-09-27T04:34:38.818Z',
								u: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'roxie',
									name: 'test test',
								},
								_updatedAt: '2023-09-27T04:34:38.900Z',
								urls: [],
								mentions: [],
								channels: [],
								md: [
									{
										type: 'PARAGRAPH',
										value: [
											{
												type: 'PLAIN_TEXT',
												value: 'always do',
											},
										],
									},
								],
							},
							{
								_id: '3rfQYmS8MzCKnQbcu',
								rid: '6513afeda2f73c7460e18c86',
								msg: '',
								ts: '2023-09-27T04:34:34.259Z',
								u: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'roxie',
									name: 'test test',
								},
								_updatedAt: '2023-09-27T04:36:38.258Z',
								urls: [],
								mentions: [],
								channels: [],
								replies: ['rbAXPnMktTFbNpwtJ'],
								tcount: 0,
								tlm: '2023-09-27T04:34:50.746Z',
								attachments: [],
								editedAt: '2023-09-27T04:36:19.494Z',
								editedBy: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'roxie',
								},
								reactions: {},
								t: 'rm',
							},
							{
								_id: '6513b143a2f73c7460e18c88',
								rid: '6513afeda2f73c7460e18c86',
								msg: 'test messages',
								ts: '2023-09-27T04:34:34.259Z',
								u: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'roxie',
									name: 'test test',
								},
								_updatedAt: '2023-09-27T04:36:19.486Z',
								urls: [],
								mentions: [],
								channels: [],
								md: [
									{
										type: 'PARAGRAPH',
										value: [
											{
												type: 'PLAIN_TEXT',
												value: 'test messages',
											},
										],
									},
								],
								replies: ['rbAXPnMktTFbNpwtJ'],
								tcount: 1,
								tlm: '2023-09-27T04:34:50.746Z',
								_hidden: true,
								parent: '3rfQYmS8MzCKnQbcu',
								editedAt: '2023-09-27T04:36:19.485Z',
								editedBy: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'roxie',
								},
							},
						],
						count: 4,
						offset: 0,
						total: 4,
						success: true,
					},
				},
			},
		},
	},
	'channels.open': {
		body: {
			Example: {
				value: {
					roomId: 'ByehQjC44FwMeiLbX',
				},
			},
		},
	},
	'channels.setReadOnly': {
		response: {
			'200': {
				Success: {
					value: {
						channel: {
							_id: 'ByehQjC44FwMeiLbX',
							name: 'testing0',
							t: 'c',
							msgs: 0,
							u: {
								_id: 'aiPqNoGkjpNDiRx6d',
								username: 'goose160',
							},
							ts: '2017-01-05T18:02:50.754Z',
							ro: true,
							sysMes: true,
							_updatedAt: '2017-01-05T19:02:24.429Z',
							usernames: ['goose160', 'graywolf336'],
							joinCodeRequired: true,
							muted: [],
						},
						success: true,
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roomId: 'ByehQjC44FwMeiLbX',
					readOnly: true,
				},
			},
		},
	},
	'channels.setAnnouncement': {
		response: {
			'200': {
				Example: {
					value: {
						announcement: 'Test out everything',
						success: true,
					},
				},
			},
		},
		body: {
			Success: {
				value: {
					roomId: 'WDuJLFkjwk6L7LdFC',
					announcement: 'Test out everything',
				},
			},
		},
	},
	'channels.getAllUserMentionsByChannel': {
		response: {
			'200': {
				Success: {
					value: {
						mentions: [
							{
								_id: 'mPmJ6cPAazzphJmGe',
								rid: '6513afeda2f73c7460e18c86',
								msg: '@roxie',
								ts: '2023-09-27T20:32:58.994Z',
								u: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'roxie',
									name: 'test test',
								},
								_updatedAt: '2023-09-27T20:32:59.171Z',
								urls: [],
								mentions: [
									{
										_id: 'rbAXPnMktTFbNpwtJ',
										username: 'roxie',
										name: 'test test',
										type: 'user',
									},
								],
								channels: [],
								md: [
									{
										type: 'PARAGRAPH',
										value: [
											{
												type: 'MENTION_USER',
												value: {
													type: 'PLAIN_TEXT',
													value: 'roxie',
												},
											},
										],
									},
								],
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
	'channels.moderators': {
		response: {
			'200': {
				Success: {
					value: {
						moderators: [
							{
								_id: 'rocket.cat',
								username: 'rocket.cat',
								name: 'Rocket.Cat',
							},
						],
						success: true,
					},
				},
			},
		},
	},
	'channels.convertToTeam': {
		response: {
			'200': {
				'Channel converted to team': {
					value: {
						team: {
							_id: '65149c7ea2f73c7460e18cab',
							name: 'messages',
							type: 0,
							createdAt: '2023-09-27T21:19:58.972Z',
							createdBy: {
								_id: 'rbAXPnMktTFbNpwtJ',
								username: 'roxie',
							},
							_updatedAt: '2023-09-27T21:19:58.972Z',
							roomId: '6513afeda2f73c7460e18c86',
						},
						success: true,
					},
				},
			},
			'403': {
				'Missing channel permissions': {
					value: {
						success: false,
						error: 'unauthorized',
					},
				},
			},
		},
		body: {
			'Convert channel by ID': {
				value: {
					channelId: '6513afeda2f73c7460e18c86',
				},
			},
			'Convert channel by name': {
				value: {
					channelName: 'messages',
				},
			},
		},
	},
	'channels.addModerator': {
		response: {
			'400': {
				'User is already a moderator': {
					value: {
						success: false,
						error: 'User is already a moderator [error-user-already-moderator]',
						errorType: 'error-user-already-moderator',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roomId: 'WDuJLFkjwk6L7LdFC',
					userId: 'b66oZ8i9pkeSko33v',
				},
			},
		},
	},
	'channels.addOwner': {
		response: {
			'400': {
				'User is alrready an owner': {
					value: {
						success: false,
						error: 'User is already an owner [error-user-already-owner]',
						errorType: 'error-user-already-owner',
						details: {
							method: 'addRoomOwner',
						},
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roomId: 'WDuJLFkjwk6L7LdFC',
					userId: 'b66oZ8i9pkeSko33v',
				},
			},
		},
	},
	'channels.close': {
		response: {
			'400': {
				'Channel is already closed': {
					value: {
						success: false,
						error: 'The channel, dlp, is already closed to the sender',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roomId: 'ByehQjC44FwMeiLbX',
				},
			},
		},
	},
	'channels.counters': {
		response: {
			'200': {
				Example: {
					value: {
						joined: true,
						members: 23,
						unreads: 2,
						unreadsFrom: '2023-09-12T16:33:11.644Z',
						msgs: 7345,
						latest: '2023-09-25T22:50:07.979Z',
						userMentions: 0,
						success: true,
					},
				},
			},
		},
	},
	'channels.create': {
		response: {
			'200': {
				Example: {
					value: {
						channel: {
							_id: 'ByehQjC44FwMeiLbX',
							name: 'channelname',
							t: 'c',
							usernames: ['example'],
							msgs: 0,
							u: {
								_id: 'aobEdbYhXfu5hkeqG',
								username: 'example',
							},
							ts: '2016-05-30T13:42:25.304Z',
						},
						success: true,
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					name: 'channelname',
					members: ['rocket.cat'],
					readOnly: true,
					excludeSelf: true,
					customFields: {
						type: 'default',
					},
					extraData: {
						broadcast: true,
						encrypted: false,
						teamId: '658441562dd9f928ad9951aa',
					},
				},
			},
		},
	},
	'channels.files': {
		response: {
			'200': {
				Example: {
					value: {
						files: [
							{
								_id: '651227bea2f73c7460e18c63',
								name: 'Screenshot (317).png',
								size: 288727,
								type: 'image/png',
								rid: 'siyr2oWQJBjQjhLwr',
								userId: 'rbAXPnMktTFbNpwtJ',
								store: 'GridFS:Uploads',
								_updatedAt: '2023-09-26T00:37:19.598Z',
								identify: {
									format: 'png',
									size: {
										width: 1920,
										height: 1080,
									},
								},
								complete: true,
								etag: '2Q2D8hSxCdhQLzcpx',
								path: '/ufs/GridFS:Uploads/651227bea2f73c7460e18c63/Screenshot%20(317).png',
								progress: 1,
								token: 'da2aCAf88a',
								uploadedAt: '2023-09-26T00:37:18.168Z',
								uploading: false,
								url: 'http://localhost:3000/ufs/GridFS:Uploads/651227bea2f73c7460e18c63/Screenshot%20(317).png',
								typeGroup: 'image',
								user: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'roxie',
									name: 'test test',
								},
							},
							{
								_id: '64b589e6aa5ad4273bfc4db6',
								name: 'eicar.zip',
								size: 266,
								type: 'application/x-zip-compressed',
								rid: 'siyr2oWQJBjQjhLwr',
								userId: 'rbAXPnMktTFbNpwtJ',
								store: 'GridFS:Uploads',
								_updatedAt: '2023-07-17T18:35:18.242Z',
								complete: true,
								etag: 'JYaAzzFQSnxYQ7rWW',
								path: '/ufs/GridFS:Uploads/64b589e6aa5ad4273bfc4db6/eicar.zip',
								progress: 1,
								token: '7a1A38Cb5a',
								uploadedAt: '2023-07-17T18:35:18.216Z',
								uploading: false,
								url: 'http://localhost:3000/ufs/GridFS:Uploads/64b589e6aa5ad4273bfc4db6/eicar.zip',
								typeGroup: 'application',
								user: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'roxie',
									name: 'test test',
								},
							},
						],
						count: 2,
						offset: 0,
						total: 2,
						success: true,
					},
				},
			},
		},
	},
	'channels.getIntegrations': {
		response: {
			'200': {
				Example: {
					value: {
						integrations: [
							{
								_id: 'WMQDChpnYTRmFre9h',
								enabled: true,
								username: 'rocket.cat',
								alias: 'Guggy',
								avatar: 'http://res.guggy.com/logo_128.png',
								name: 'Guggy',
								triggerWords: ['!guggy', 'guggy', 'gif+'],
								urls: ['http://text2gif.guggy.com/guggify'],
								token: '8DFS89DMKLWEN',
								script: "const config = {color: '#ffffff'};class Script{}",
								scriptEnabled: true,
								impersonateUser: false,
								scriptCompiled: 'function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor));',
								scriptError: '',
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
						],
						success: true,
					},
				},
			},
		},
	},
	'channels.info': {
		response: {
			'200': {
				Example: {
					value: {
						channel: {
							_id: 'ByehQjC44FwMeiLbX',
							name: 'testing',
							fname: 'testing',
							t: 'c',
							msgs: 0,
							usersCount: 2,
							u: {
								_id: 'HKKPmF8rZh45GMHWH',
								username: 'marcos.defendi',
							},
							customFields: {},
							broadcast: false,
							encrypted: false,
							ts: '2020-05-21T13:14:07.070Z',
							ro: false,
							default: false,
							sysMes: true,
							_updatedAt: '2020-05-21T13:14:07.096Z',
						},
						success: true,
					},
				},
			},
		},
	},
	'channels.invite': {
		response: {
			'200': {
				'Add bulk users': {
					value: {
						channel: {
							_id: 'ByehQjC44FwMeiLbX',
							ts: '2016-11-30T21:23:04.737Z',
							t: 'c',
							name: 'testing',
							usernames: ['testing', 'testing1'],
							msgs: 1,
							_updatedAt: '2016-12-09T12:50:51.575Z',
							lm: '2016-12-09T12:50:51.555Z',
						},
						success: true,
					},
				},
				'Add a user': {
					value: {
						channel: {
							_id: 'ByehQjC44FwMeiLbX',
							ts: '2016-11-30T21:23:04.737Z',
							t: 'c',
							name: 'testing',
							usernames: 'testing',
							msgs: 1,
							_updatedAt: '2016-12-09T12:50:51.575Z',
							lm: '2016-12-09T12:50:51.555Z',
						},
						success: true,
					},
				},
			},
		},
	},
	'channels.list': {
		response: {
			'200': {
				Success: {
					value: {
						channels: [
							{
								_id: 'GENERAL',
								ts: '2024-02-14T14:34:49.365Z',
								t: 'c',
								name: 'general',
								usernames: [],
								msgs: 6,
								usersCount: 6,
								_updatedAt: '2024-03-26T17:40:18.321Z',
								u: {
									_id: 'rocket.cat',
									username: 'rocket.cat',
									name: 'Rocket.Cat',
								},
								default: true,
							},
							{
								_id: '65fd8a6bf581e473b56471ba',
								fname: 'test-channel',
								_updatedAt: '2024-03-22T13:40:59.620Z',
								customFields: {},
								topic: '',
								broadcast: false,
								encrypted: false,
								name: 'test-channel',
								t: 'c',
								msgs: 0,
								usersCount: 1,
								u: {
									_id: 'GdEsNbLxzoBgG8XoQ',
									username: 'apiadmin',
									name: 'apiadmin',
								},
								ts: '2024-03-22T13:40:59.577Z',
								ro: false,
								default: false,
								sysMes: true,
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
	'channels.list.joined': {
		response: {
			'200': {
				Example: {
					value: {
						channels: [
							{
								_id: 'ByehQjC44FwMeiLbX',
								name: 'invite-me',
								t: 'c',
								usernames: ['testing1'],
								msgs: 0,
								u: {
									_id: 'aobEdbYhXfu5hkeqG',
									username: 'testing1',
								},
								ts: '2016-12-09T15:08:58.042Z',
								ro: false,
								sysMes: true,
								_updatedAt: '2016-12-09T15:22:40.656Z',
							},
						],
						success: true,
					},
				},
			},
		},
	},
	'channels.members': {
		response: {
			'200': {
				Success: {
					value: {
						members: [
							{
								_id: 'rbAXPnMktTFbNpwtJ',
								username: 'roxie',
								status: 'offline',
								_updatedAt: '2023-09-24T22:27:33.610Z',
								name: 'test test',
								nickname: 'baby girl',
							},
							{
								_id: '5fRTXMt7DMJbpPJfh',
								username: 'test.test',
								status: 'offline',
								_updatedAt: '2023-09-16T08:33:38.123Z',
								name: 'Testtest',
								avatarETag: 'GFoEi6wv3uAxnzDcD',
								nickname: 'test.test',
							},
						],
						count: 2,
						offset: 0,
						total: 2,
						success: true,
					},
				},
			},
		},
	},
	'channels.online': {
		response: {
			'200': {
				Example: {
					value: {
						online: [
							{
								_id: '47cRd58HnWwpqxhaZ',
								username: 'test',
							},
							{
								_id: 'BsxzC22xQ43taWdff',
								username: 'uniqueusername',
							},
						],
						success: true,
					},
				},
			},
		},
	},
	'channels.removeModerator': {
		response: {
			'400': {
				'User is not a moderator': {
					value: {
						success: false,
						error: 'User is not a moderator [error-user-not-moderator]',
						errorType: 'error-user-not-moderator',
						details: {
							method: 'removeRoomModerator',
						},
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roomId: 'ByehQjC44FwMeiLbX',
					userId: 'oCHkav5Zf6vmpu2W2',
				},
			},
		},
	},
	'channels.removeOwner': {
		body: {
			Example: {
				value: {
					roomId: 'ByehQjC44FwMeiLbX',
					userId: 'oCHkav5Zf6vmpu2W2',
				},
			},
		},
	},
	'channels.rename': {
		response: {
			'200': {
				Success: {
					value: {
						channel: {
							_id: 'ByehQjC44FwMeiLbX',
							name: 'new-name',
							t: 'c',
							usernames: ['testing1'],
							msgs: 4,
							u: {
								_id: 'aobEdbYhXfu5hkeqG',
								username: 'testing1',
							},
							ts: '2016-12-09T15:08:58.042Z',
							ro: false,
							sysMes: true,
							_updatedAt: '2016-12-09T15:57:44.686Z',
						},
						success: true,
					},
				},
			},
			'400': {
				'No permission': {
					value: {
						success: false,
						error: 'Editing room is not allowed [error-action-not-allowed]',
						errorType: 'error-action-not-allowed',
						details: {
							method: 'saveRoomSettings',
							action: 'Editing_room',
						},
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roomId: 'WDuJLFkjwk6L7LdFC',
					name: 'newName',
				},
			},
		},
	},
	'channels.setCustomFields': {
		response: {
			'200': {
				Success: {
					value: {
						channel: {
							_id: 'WDuJLFkjwk6L7LdFC',
							fname: 'new',
							customFields: {
								organization: 'tra-la-la',
							},
							topic: '',
							broadcast: false,
							encrypted: false,
							name: 'new',
							t: 'c',
							msgs: 72,
							usersCount: 45,
							u: {
								_id: 'rbAXPnMktTFbNpwtJ',
								username: 'roxie',
							},
							ts: '2023-04-05T22:34:38.936Z',
							ro: false,
							default: false,
							sysMes: true,
							_updatedAt: '2023-09-27T05:24:34.363Z',
							lastMessage: {
								_id: 'mBfC3sbNhfwcL4AQu',
								rid: 'WDuJLFkjwk6L7LdFC',
								msg: 'It should be good',
								ts: '2023-09-16T07:37:59.691Z',
								u: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'test.test',
									name: 'test test',
								},
								_updatedAt: '2023-09-16T07:37:59.815Z',
								urls: [],
								mentions: [],
								channels: [],
								md: [
									{
										type: 'PARAGRAPH',
										value: [
											{
												type: 'PLAIN_TEXT',
												value: 'It should be good',
											},
										],
									},
								],
							},
							lm: '2023-09-16T07:37:59.691Z',
							announcement: 'Test out everything',
						},
						success: true,
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roomId: 'GENERAL',
					customFields: {
						organization: 'tra-la-la',
					},
				},
			},
		},
	},
	'channels.setDefault': {
		response: {
			'200': {
				Example: {
					value: {
						channel: {
							_id: 'ByehQjC44FwMeiLbX',
							name: 'testing0',
							t: 'c',
							msgs: 0,
							u: {
								_id: 'aiPqNoGkjpNDiRx6d',
								username: 'goose160',
							},
							ts: '2017-01-05T18:02:50.754Z',
							ro: true,
							sysMes: true,
							_updatedAt: '2017-01-05T19:02:24.429Z',
							usernames: ['goose160', 'graywolf336'],
							joinCodeRequired: true,
							muted: [],
							default: true,
						},
						success: true,
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roomId: 'ByehQjC44FwMeiLbX',
					default: true,
				},
			},
		},
	},
	'channels.setDescription': {
		response: {
			'200': {
				Success: {
					value: {
						description: 'Testing the room',
						success: true,
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roomId: 'ByehQjC44FwMeiLbX',
					description: 'Test out everything',
				},
			},
		},
	},
	'channels.setPurpose': {
		response: {
			'200': {
				Success: {
					value: {
						purpose: 'greetings',
						success: true,
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roomId: 'WDuJLFkjwk6L7LdFC',
					purpose: 'greetings',
				},
			},
		},
	},
	'channels.setTopic': {
		response: {
			'200': {
				Success: {
					value: {
						topic: 'Discuss all of the testing',
						success: true,
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roomId: 'WDuJLFkjwk6L7LdFC',
					topic: 'Discuss all of the testing',
				},
			},
		},
	},
	'channels.setType': {
		response: {
			'200': {
				Success: {
					value: {
						channel: {
							_id: 'ByehQjC44FwMeiLbX',
							name: 'testing0',
							t: 'p',
							msgs: 0,
							u: {
								_id: 'aiPqNoGkjpNDiRx6d',
								username: 'goose160',
							},
							ts: '2017-01-05T18:02:50.754Z',
							ro: false,
							sysMes: true,
							_updatedAt: '2017-01-05T19:02:24.429Z',
							usernames: ['goose160', 'graywolf336'],
							joinCodeRequired: true,
							muted: [],
						},
						success: true,
					},
				},
			},
			'400': {
				'ABAC-managed room conversion blocked': {
					value: {
						success: false,
						error: 'Changing an ABAC managed private room to public is not allowed [error-action-not-allowed]',
						errorType: 'error-action-not-allowed',
						details: {
							method: 'saveRoomSettings',
							action: 'Change_Room_Type',
						},
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roomId: 'WDuJLFkjwk6L7LdFC',
					type: 'p',
				},
			},
		},
	},
	'channels.addLeader': {
		response: {
			'400': {
				'User is a leader': {
					value: {
						success: false,
						error: 'User is already a leader [error-user-already-leader]',
						errorType: 'error-user-already-leader',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roomId: 'WDuJLFkjwk6L7LdFC',
					userId: 'b66oZ8i9pkeSko33v',
				},
			},
		},
	},
	'channels.removeLeader': {
		response: {
			'400': {
				'User is not a leader': {
					value: {
						success: false,
						error: 'User is not a leader [error-user-not-leader]',
						errorType: 'error-user-not-leader',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roomId: 'ByehQjC44FwMeiLbX',
					userId: 'oCHkav5Zf6vmpu2W2',
				},
			},
		},
	},
	'channels.setJoinCode': {
		response: {
			'200': {
				Success: {
					value: {
						channel: {
							_id: 'WDuJLFkjwk6L7LdFC',
							fname: 'new',
							customFields: {
								organization: 'tra-la-la',
							},
							topic: '',
							broadcast: false,
							encrypted: false,
							name: 'new',
							t: 'c',
							msgs: 73,
							usersCount: 45,
							u: {
								_id: 'rbAXPnMktTFbNpwtJ',
								username: 'roxie',
							},
							ts: '2023-04-05T22:34:38.936Z',
							ro: false,
							default: true,
							sysMes: true,
							_updatedAt: '2023-09-27T05:40:39.687Z',
							lastMessage: {
								_id: 'mBfC3sbNhfwcL4AQu',
								rid: 'WDuJLFkjwk6L7LdFC',
								msg: 'It should be good',
								ts: '2023-09-16T07:37:59.691Z',
								u: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'test.test',
									name: 'test test',
								},
								_updatedAt: '2023-09-16T07:37:59.815Z',
								urls: [],
								mentions: [],
								channels: [],
								md: [
									{
										type: 'PARAGRAPH',
										value: [
											{
												type: 'PLAIN_TEXT',
												value: 'It should be good',
											},
										],
									},
								],
							},
							lm: '2023-09-16T07:37:59.691Z',
							announcement: 'Test out everything',
							description: 'Testing the room',
							joinCodeRequired: true,
						},
						success: true,
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roomId: 'ByehQjC44FwMeiLbX',
					joinCode: '87hsyi9',
				},
			},
		},
	},
	'channels.anonymousread': {
		response: {
			'200': {
				Success: {
					value: {
						messages: [
							{
								_id: 'xadufzmxzYQp4H9py',
								alias: 'test',
								msg: 'Example message',
								attachments: [],
								parseUrls: true,
								bot: {
									i: 'MnQyfhWt5LqZotyfc',
								},
								groupable: false,
								ts: '2018-10-05T01:10:47.524Z',
								u: {
									_id: 'rocket.cat',
									username: 'rocket.cat',
									name: 'Rocket.Cat',
								},
								rid: 'GENERAL',
								_updatedAt: '2018-10-05T13:42:51.163Z',
								reactions: {
									':grin:': {
										usernames: ['marco.zoo'],
									},
								},
								mentions: [],
								channels: [],
								starred: {
									_id: 'KPkEYwKKBKZnEEPpt',
								},
							},
							{
								_id: 'id-1538701845987',
								rid: 'GENERAL',
								msg: 'This message was edited via API',
								alias: 'Gruggy',
								emoji: ':smirk:',
								avatar: 'http://res.guggy.com/logo_128.png',
								attachments: [
									{
										collapsed: false,
										color: '#ff0000',
										text: 'Yay for gruggy!',
										ts: '2016-12-09T16:53:06.761Z',
										message_link: 'https://google.com',
										thumb_url: 'http://res.guggy.com/logo_128.png',
										author_name: 'Bradley Hilton',
										author_link: 'https://rocket.chat/',
										author_icon: 'https://avatars.githubusercontent.com/u/850391?v=3',
										title: 'Attachment Example',
										title_link: 'https://youtube.com',
										title_link_download: true,
										image_url: 'http://res.guggy.com/logo_128.png',
										audio_url: 'http://www.w3schools.com/tags/horse.mp3',
										video_url: 'http://www.w3schools.com/tags/movie.mp4',
										fields: [
											{
												short: true,
												title: 'Test',
												value: 'Testing out something or other',
											},
											{
												short: true,
												title: 'Another Test',
												value: '<a href="https://google.com" target="_blank">Link</a> something and this and that.',
											},
										],
									},
								],
								ts: '2018-10-05T01:10:45.994Z',
								u: {
									_id: 'rocketchat.internal.admin.test',
									username: 'rocketchat.internal.admin.test',
									name: 'RocketChat Internal Admin Test',
								},
								_updatedAt: '2018-10-05T01:10:47.064Z',
								editedBy: {
									_id: 'rocketchat.internal.admin.test',
									username: 'rocketchat.internal.admin.test',
								},
								editedAt: '2018-10-05T01:10:46.384Z',
								reactions: {
									':smile:': {
										usernames: ['rocketchat.internal.admin.test'],
									},
									':squid:': {
										usernames: ['rocketchat.internal.admin.test'],
									},
									':bee:': {
										usernames: ['rocketchat.internal.admin.test'],
									},
									':ant:': {
										usernames: ['rocketchat.internal.admin.test'],
									},
								},
								mentions: [],
								channels: [],
								urls: [],
							},
						],
						count: 2,
						offset: 0,
						total: 2,
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'The required "roomId" or "roomName" param provided does not match any channel [error-room-not-found]',
						errorType: 'error-room-not-found',
					},
				},
			},
		},
	},
};
