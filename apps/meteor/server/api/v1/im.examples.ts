import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the im endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const imExamples = {
	'im.delete': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error:
							"must have required property 'roomId'\n must have required property 'username'\n must match exactly one schema in oneOf [invalid-params]",
						errorType: 'invalid-params',
					},
				},
				'Invalid room ID or username': {
					value: {
						success: false,
						error: '[invalid-channel]',
						errorType: 'invalid-channel',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roomId: 'hdy9972092873h8s7s0',
				},
			},
		},
	},
	'dm.close': {
		response: {
			'400': {
				'RoomId is required': {
					value: {
						success: false,
						error: 'Body param "roomId" is required [error-room-param-not-provided]',
						errorType: 'error-room-param-not-provided',
					},
				},
				'Invalid room ID or user is not member of room': {
					value: {
						success: false,
						error: 'The user is not subscribed to the room',
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
	'dm.create': {
		response: {
			'200': {
				Example: {
					value: {
						room: {
							t: 'd',
							rid: 'PMrDaS4axRqkjY7errocket.cat',
							usernames: ['g1', 'rocket.cat'],
						},
						success: true,
					},
				},
			},
			'400': {
				'Missing parameter': {
					value: {
						success: false,
						error:
							"must have required property 'usernames'\n must have required property 'username'\n must match exactly one schema in oneOf [invalid-params]",
						errorType: 'invalid-params',
					},
				},
				'Invalid User': {
					value: {
						success: false,
						error: 'Invalid user [error-invalid-user]',
						errorType: 'error-invalid-user',
						details: {
							method: 'createDirectMessage',
						},
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					username: 'kim.dok',
					excludeSelf: true,
				},
			},
		},
	},
	'dm.open': {
		response: {
			'400': {
				'Missing Parameter': {
					value: {
						success: false,
						error: 'Body param "roomId" is required [error-room-param-not-provided]',
						errorType: 'error-room-param-not-provided',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roomId: '5fRTXMt7DMJbpPJfhrbAXPnMktTFbNpwtJ',
				},
			},
		},
	},
	'dm.setTopic': {
		response: {
			'200': {
				Example: {
					value: {
						topic: 'Discuss all of the testing',
						success: true,
					},
				},
			},
			'400': {
				Example: {
					value: {
						success: false,
						error: 'Body param "roomId" is required [error-room-param-not-provided]',
						errorType: 'error-room-param-not-provided',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roomId: 'ByehQjC44FwMeiLbX',
					topic: 'Discuss all of the testing',
				},
			},
		},
	},
	'dm.counters': {
		response: {
			'200': {
				'Example 1': {
					value: {
						joined: true,
						members: 2,
						unreads: 4,
						unreadsFrom: '2023-10-30T20:30:47.975Z',
						msgs: 10,
						latest: '2023-10-30T20:37:17.160Z',
						userMentions: 0,
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'Query param "roomId" is required [error-room-param-not-provided]',
						errorType: 'error-room-param-not-provided',
					},
				},
			},
		},
	},
	'dm.files': {
		response: {
			'200': {
				'Example 1': {
					value: {
						files: [
							{
								_id: '6542e355a2f73c7460e18ef6',
								name: '2023-11-01_21-13-38.snagx',
								size: 652277,
								type: 'application/octet-stream',
								rid: '5fRTXMt7DMJbpPJfhgzvcvpov9G4TxbGFS',
								userId: '5fRTXMt7DMJbpPJfh',
								store: 'GridFS:Uploads',
								_updatedAt: '2023-11-01T23:46:29.216Z',
								complete: true,
								etag: '7qDc9jBurptfmrAxr',
								path: '/ufs/GridFS:Uploads/6542e355a2f73c7460e18ef6/2023-11-01_21-13-38.snagx',
								progress: 1,
								token: 'eAD959d9A8',
								uploadedAt: '2023-11-01T23:46:29.196Z',
								uploading: false,
								url: 'http://localhost:3000//ufs/GridFS:Uploads/6542e355a2f73c7460e18ef6/2023-11-01_21-13-38.snagx',
								typeGroup: 'application',
								user: {
									_id: '5fRTXMt7DMJbpPJfh',
									username: 'test.john',
									name: 'Test John',
								},
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
	'dm.members': {
		response: {
			'200': {
				'Example 1': {
					value: {
						members: [
							{
								_id: '5fRTXMt7DMJbpPJfh',
								username: 'test.john',
								status: 'online',
								name: 'Test John',
								utcOffset: 1,
								statusText: '',
							},
							{
								_id: 'rbAXPnMktTFbNpwtJ',
								username: 'roxie',
								status: 'offline',
								name: 'test test',
								utcOffset: 1,
								statusText: 'On a vacation',
							},
							{
								_id: 'hFDuCPam7sWziWFYa',
								status: 'offline',
								name: 'Hookdeck Write',
								utcOffset: 1,
								username: 'hookdeck.write',
							},
						],
						count: 3,
						offset: 0,
						total: 3,
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error:
							"must have required property 'roomId'\n must have required property 'username'\n must match exactly one schema in oneOf [invalid-params]",
						errorType: 'invalid-params',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: '[invalid-channel]',
						errorType: 'invalid-channel',
					},
				},
			},
		},
	},
	'dm.messages': {
		response: {
			'200': {
				Example: {
					value: {
						messages: [
							{
								_id: 'dGNzxH29pFm4Qhufh',
								rid: '5fRTXMt7DMJbpPJfhgzvcvpov9G4TxbGFS',
								msg: 'DO we have any updates today?',
								ts: '2023-11-01T23:20:57.357Z',
								u: {
									_id: '5fRTXMt7DMJbpPJfh',
									username: 'test.john',
									name: 'Test John',
								},
								_updatedAt: '2023-11-01T23:20:57.406Z',
								urls: [],
								mentions: [],
								channels: [],
								md: [
									{
										type: 'PARAGRAPH',
										value: [
											{
												type: 'PLAIN_TEXT',
												value: 'DO we have any updates today?',
											},
										],
									},
								],
							},
							{
								_id: 'aiaCSRkxPcNGHqvtC',
								rid: '5fRTXMt7DMJbpPJfhgzvcvpov9G4TxbGFS',
								msg: 'Hows it going?',
								ts: '2023-11-01T23:20:51.504Z',
								u: {
									_id: '5fRTXMt7DMJbpPJfh',
									username: 'test.john',
									name: 'Test John',
								},
								_updatedAt: '2023-11-01T23:20:51.549Z',
								urls: [],
								mentions: [],
								channels: [],
								md: [
									{
										type: 'PARAGRAPH',
										value: [
											{
												type: 'PLAIN_TEXT',
												value: 'Hows it going?',
											},
										],
									},
								],
							},
							{
								_id: 'dLjcNr8ovyeCqqJW5',
								rid: '5fRTXMt7DMJbpPJfhgzvcvpov9G4TxbGFS',
								msg: 'Hi buddy',
								ts: '2023-11-01T23:20:47.991Z',
								u: {
									_id: '5fRTXMt7DMJbpPJfh',
									username: 'test.john',
									name: 'Test John',
								},
								_updatedAt: '2023-11-01T23:20:48.085Z',
								urls: [],
								mentions: [],
								channels: [],
								md: [
									{
										type: 'PARAGRAPH',
										value: [
											{
												type: 'PLAIN_TEXT',
												value: 'Hi buddy',
											},
										],
									},
								],
							},
						],
						count: 3,
						offset: 0,
						total: 3,
						success: true,
					},
				},
			},
			'400': {
				'Missing Parameter': {
					value: {
						success: false,
						error:
							"must have required property 'roomId'\n must have required property 'username'\n must match exactly one schema in oneOf [invalid-params]",
						errorType: 'invalid-params',
					},
				},
				'Invalid Channel': {
					value: {
						success: false,
						error: '[invalid-channel]',
						errorType: 'invalid-channel',
					},
				},
			},
		},
	},
	'dm.history': {
		response: {
			'200': {
				'Example 1': {
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
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: "must have required property 'roomId' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: '[invalid-channel]',
						errorType: 'invalid-channel',
					},
				},
			},
		},
	},
	'dm.messages.others': {
		response: {
			'200': {
				'Example 1': {
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
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'This endpoint is disabled [error-endpoint-disabled]',
						errorType: 'error-endpoint-disabled',
						details: {
							route: '/api/v1/dm.messages.others',
						},
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: 'The parameter "roomId" is required [error-roomid-param-not-provided]',
						errorType: 'error-roomid-param-not-provided',
					},
				},
				'Example 3': {
					value: {
						success: false,
						error: 'No direct message room found by the id of: john [error-room-not-found]',
						errorType: 'error-room-not-found',
					},
				},
			},
		},
	},
	'dm.list': {
		response: {
			'200': {
				'Example 1': {
					value: {
						ims: [
							{
								_id: '5fRTXMt7DMJbpPJfhrbAXPnMktTFbNpwtJ',
								t: 'd',
								usernames: ['roxie', 'test.john'],
								usersCount: 2,
								msgs: 10,
								ts: '2023-07-11T01:37:04.552Z',
								uids: ['5fRTXMt7DMJbpPJfh', 'rbAXPnMktTFbNpwtJ'],
								encrypted: true,
								default: false,
								ro: false,
								sysMes: true,
								_updatedAt: '2023-10-30T20:37:17.317Z',
								_USERNAMES: ['test.test', 'test.test'],
								e2eKeyId: 'eyJhbGciOiJB',
								lastMessage: {
									_id: 'qpx24HcNoTZCoj7jZ',
									rid: '5fRTXMt7DMJbpPJfhrbAXPnMktTFbNpwtJ',
									msg: 'gvjkbvjjgi',
									ts: '2023-10-30T20:37:17.160Z',
									u: {
										_id: 'rbAXPnMktTFbNpwtJ',
										username: 'roxie',
										name: 'test test',
									},
									_updatedAt: '2023-10-30T20:37:17.267Z',
									urls: [],
									mentions: [],
									channels: [],
									md: [
										{
											type: 'PARAGRAPH',
											value: [
												{
													type: 'PLAIN_TEXT',
													value: 'gvjkbvjjgi',
												},
											],
										},
									],
								},
								lm: '2023-10-30T20:37:17.160Z',
								topic: 'Discuss all of the testing',
							},
							{
								_id: '65400fc3a2f73c7460e18e9f',
								t: 'd',
								usernames: ['roxie', 'hookdeck.write', 'test.john'],
								usersCount: 3,
								msgs: 8,
								ts: '2023-10-30T20:19:15.092Z',
								uids: ['5fRTXMt7DMJbpPJfh', 'hFDuCPam7sWziWFYa', 'rbAXPnMktTFbNpwtJ'],
								encrypted: true,
								default: false,
								ro: false,
								sysMes: true,
								_updatedAt: '2023-10-30T20:36:41.696Z',
								_USERNAMES: ['roxie', 'hookdeck.write', 'test.john'],
								topic: 'Discuss all of the testing',
								lastMessage: {
									_id: 'dgDTvDAXN4eCLptr8',
									rid: '65400fc3a2f73c7460e18e9f',
									msg: '@test.john',
									ts: '2023-10-30T20:36:41.494Z',
									u: {
										_id: 'rbAXPnMktTFbNpwtJ',
										username: 'roxie',
										name: 'test test',
									},
									_updatedAt: '2023-10-30T20:36:41.613Z',
									urls: [],
									mentions: [
										{
											_id: '5fRTXMt7DMJbpPJfh',
											username: 'test.john',
											name: 'Test John',
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
														value: 'test.john',
													},
												},
											],
										},
									],
								},
								lm: '2023-10-30T20:36:41.494Z',
							},
						],
						offset: 0,
						count: 2,
						total: 2,
						success: true,
					},
				},
			},
		},
	},
	'dm.list.everyone': {
		response: {
			'200': {
				'Example 1': {
					value: {
						ims: [
							{
								_id: 'rYhzFRd2QZjNwAAXXrocket.cat',
								t: 'd',
								usernames: ['rocket.cat', 'rodriq'],
								usersCount: 2,
								msgs: 20,
								ts: '2023-01-25T02:00:18.095Z',
								uids: ['rYhzFRd2QZjNwAAXX', 'rocket.cat'],
								default: false,
								ro: false,
								sysMes: true,
								_updatedAt: '2023-06-22T02:00:10.474Z',
								_USERNAMES: ['rocket.cat', 'rodriq'],
								lastMessage: {
									rid: 'rYhzFRd2QZjNwAAXXrocket.cat',
									msg: '*Update your Rocket.Chat*\nNew version available (6.2.8)\nhttps://github.com/RocketChat/Rocket.Chat/releases/tag/6.2.8',
									ts: '2023-06-22T02:00:10.367Z',
									u: {
										_id: 'rocket.cat',
										username: 'rocket.cat',
										name: 'Rocket.Cat',
									},
									_id: 'T2KoWNeAgJM4zvTvt',
									_updatedAt: '2023-06-22T02:00:10.453Z',
									urls: [
										{
											url: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/6.2.8',
											meta: {},
										},
									],
									mentions: [],
									channels: [],
									md: [
										{
											type: 'PARAGRAPH',
											value: [
												{
													type: 'BOLD',
													value: [
														{
															type: 'PLAIN_TEXT',
															value: 'Update your Rocket.Chat',
														},
													],
												},
											],
										},
										{
											type: 'PARAGRAPH',
											value: [
												{
													type: 'PLAIN_TEXT',
													value: 'New version available (6.2.8)',
												},
											],
										},
										{
											type: 'PARAGRAPH',
											value: [
												{
													type: 'LINK',
													value: {
														src: {
															type: 'PLAIN_TEXT',
															value: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/6.2.8',
														},
														label: [
															{
																type: 'PLAIN_TEXT',
																value: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/6.2.8',
															},
														],
													},
												},
											],
										},
									],
								},
								lm: '2023-06-22T02:00:10.367Z',
							},
							{
								_id: '6xia7f5JEYM4Fjxzt',
								t: 'd',
								usernames: ['rodriq'],
								usersCount: 2,
								msgs: 0,
								ts: '2023-01-30T11:43:22.047Z',
								uids: ['rYhzFRd2QZjNwAAXX'],
								default: false,
								ro: false,
								sysMes: true,
								_updatedAt: '2023-01-31T14:40:37.483Z',
								_USERNAMES: ['rodriq'],
								lm: '2023-01-30T11:43:30.046Z',
							},
						],
						offset: 0,
						count: 2,
						total: 2,
						success: true,
					},
				},
			},
		},
	},
	'im.blockUser': {
		response: {
			'400': {
				'Invalid room': {
					value: {
						success: false,
						error: '[invalid-channel]',
						errorType: 'invalid-channel',
					},
				},
			},
		},
		body: {
			'Block User': {
				value: {
					roomId: 'ByehQjC44FwMeiLbX',
					block: true,
				},
			},
			'Unblock User': {
				value: {
					roomId: 'ByehQjC44FwMeiLbX',
					block: false,
				},
			},
		},
	},
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
