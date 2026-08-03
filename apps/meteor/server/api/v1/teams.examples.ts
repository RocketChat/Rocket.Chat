/**
 * Request and response examples for the teams endpoints, imported from
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

export const teamsExamples: Record<string, PayloadExamples> = {
	'teams.list': {
		response: {
			'200': {
				Success: {
					value: {
						teams: [
							{
								_id: '63f3efc4b000b6b6d86704b2',
								name: 'test-audit',
								type: 0,
								createdAt: '2023-02-20T22:10:12.733Z',
								createdBy: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'test.test',
								},
								_updatedAt: '2023-02-20T22:10:12.843Z',
								roomId: '6GFJ3tbmHiyHbahmC',
								rooms: 0,
								numberOfUsers: 2,
							},
							{
								_id: '65149c7ea2f73c7460e18cab',
								name: 'messages',
								type: 0,
								createdAt: '2023-09-27T21:19:58.972Z',
								createdBy: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'roxie',
								},
								_updatedAt: '2023-09-27T21:19:59.038Z',
								roomId: '6513afeda2f73c7460e18c86',
								rooms: 0,
								numberOfUsers: 2,
							},
						],
						total: 2,
						count: 2,
						offset: 0,
						success: true,
					},
				},
			},
		},
	},
	'teams.listAll': {
		response: {
			'200': {
				Success: {
					value: {
						teams: [
							{
								_id: '63f3efc4b000b6b6d86704b2',
								name: 'test-audit',
								type: 0,
								createdAt: '2023-02-20T22:10:12.733Z',
								createdBy: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'test.test',
								},
								_updatedAt: '2023-02-20T22:10:12.843Z',
								roomId: '6GFJ3tbmHiyHbahmC',
								rooms: 0,
								numberOfUsers: 2,
							},
							{
								_id: '6435624052492a08c3a756fd',
								name: 'Test-team',
								type: 0,
								createdAt: '2023-04-11T13:36:00.496Z',
								createdBy: {
									_id: 'rYhzFRd2QZjNwAAXX',
									username: 'rodriq',
								},
								_updatedAt: '2023-04-11T13:36:00.855Z',
								roomId: 'h5gPM3Wpip8nEFwbu',
								rooms: 0,
								numberOfUsers: 2,
							},
							{
								_id: '65149c7ea2f73c7460e18cab',
								name: 'messages',
								type: 0,
								createdAt: '2023-09-27T21:19:58.972Z',
								createdBy: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'roxie',
								},
								_updatedAt: '2023-09-27T21:19:59.038Z',
								roomId: '6513afeda2f73c7460e18c86',
								rooms: 0,
								numberOfUsers: 2,
							},
						],
						total: 3,
						count: 3,
						offset: 0,
						success: true,
					},
				},
			},
		},
	},
	'teams.create': {
		response: {
			'200': {
				'Team created': {
					value: {
						team: {
							_id: '651619e3a2f73c7460e18cc5',
							name: 'teamName',
							type: 0,
							createdAt: '2023-09-29T00:27:15.189Z',
							createdBy: {
								_id: 'rbAXPnMktTFbNpwtJ',
								username: 'roxie',
							},
							_updatedAt: '2023-09-29T00:27:15.189Z',
							roomId: '651619e3a2f73c7460e18cc7',
						},
						success: true,
					},
				},
			},
			'403': {
				'Missing room permissions': {
					value: {
						success: false,
						error: 'unauthorized',
					},
				},
			},
		},
		body: {
			'Create a public team': {
				value: {
					name: 'teamName',
					type: 0,
					members: ['8dugqGhuRvCBLdZft'],
					room: {
						readOnly: true,
					},
					sidepanel: {
						items: ['discussions', 'channels'],
					},
				},
			},
			'Create a team from an existing room': {
				value: {
					name: 'teamName',
					type: 0,
					room: {
						id: '6513afeda2f73c7460e18c86',
					},
				},
			},
		},
	},
	'teams.convertToChannel': {
		response: {
			'400': {
				'Invalid Team Id': {
					value: {
						success: false,
						error: 'team-does-not-exist',
					},
				},
				'Team Id or Team name is required': {
					value: {
						success: false,
						error: 'missing-teamId-or-teamName',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					teamId: '612b8ae982d286c3d1f5db31',
				},
			},
		},
	},
	'teams.addRooms': {
		response: {
			'200': {
				Success: {
					value: {
						rooms: [
							{
								_id: 'JKa7R9zu2DinBhBN9',
								fname: 'Livestream',
								customFields: {},
								description: '',
								broadcast: false,
								encrypted: false,
								federated: false,
								name: 'Livestream',
								t: 'c',
								msgs: 15,
								usersCount: 3,
								u: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'roxie',
								},
								ts: '2023-02-22T17:15:26.989Z',
								ro: false,
								default: false,
								sysMes: true,
								_updatedAt: '2023-09-26T01:05:39.641Z',
								lm: '2023-09-14T12:06:00.594Z',
								lastMessage: {
									_id: 'rtf5JoPLQup3X7Aof',
									t: 'videoconf',
									msg: '',
									groupable: false,
									blocks: [
										{
											type: 'video_conf',
											blockId: '6502f728a2f73c7460df6f71',
											callId: '6502f728a2f73c7460df6f71',
											appId: 'videoconf-core',
										},
									],
									ts: '2023-09-14T12:06:00.594Z',
									u: {
										_id: 'rbAXPnMktTFbNpwtJ',
										username: 'test.test',
										name: 'test test',
									},
									rid: 'JKa7R9zu2DinBhBN9',
									_updatedAt: '2023-09-14T12:06:00.685Z',
									urls: [],
									mentions: [],
									channels: [],
								},
								teamId: '63f3efc4b000b6b6d86704b2',
							},
						],
						success: true,
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					teamId: '607e0d9b49d493189836bfac',
					rooms: ['8Z7eRsibvD5AANfmK'],
				},
			},
		},
	},
	'teams.removeRoom': {
		response: {
			'200': {
				Success: {
					value: {
						room: {
							_id: 'JKa7R9zu2DinBhBN9',
							fname: 'Livestream',
							customFields: {},
							description: '',
							broadcast: false,
							encrypted: false,
							federated: false,
							name: 'Livestream',
							t: 'c',
							msgs: 15,
							usersCount: 3,
							u: {
								_id: 'rbAXPnMktTFbNpwtJ',
								username: 'roxie',
							},
							ts: '2023-02-22T17:15:26.989Z',
							ro: false,
							default: false,
							sysMes: true,
							_updatedAt: '2023-09-29T05:51:47.779Z',
							lm: '2023-09-14T12:06:00.594Z',
							lastMessage: {
								_id: 'rtf5JoPLQup3X7Aof',
								t: 'videoconf',
								msg: '',
								groupable: false,
								blocks: [
									{
										type: 'video_conf',
										blockId: '6502f728a2f73c7460df6f71',
										callId: '6502f728a2f73c7460df6f71',
										appId: 'videoconf-core',
									},
								],
								ts: '2023-09-14T12:06:00.594Z',
								u: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'test.test',
									name: 'test test',
								},
								rid: 'JKa7R9zu2DinBhBN9',
								_updatedAt: '2023-09-14T12:06:00.685Z',
								urls: [],
								mentions: [],
								channels: [],
							},
						},
						success: true,
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					teamId: '63f3efc4b000b6b6d86704b2',
					roomId: 'JKa7R9zu2DinBhBN9',
				},
			},
		},
	},
	'teams.updateRoom': {
		response: {
			'200': {
				Success: {
					value: {
						room: {
							_id: 'JKa7R9zu2DinBhBN9',
							fname: 'Livestream',
							customFields: {},
							description: '',
							broadcast: false,
							encrypted: false,
							federated: false,
							name: 'Livestream',
							t: 'c',
							msgs: 16,
							usersCount: 4,
							u: {
								_id: 'rbAXPnMktTFbNpwtJ',
								username: 'roxie',
							},
							ts: '2023-02-22T17:15:26.989Z',
							ro: false,
							default: false,
							sysMes: true,
							_updatedAt: '2023-09-29T06:00:18.859Z',
							lm: '2023-09-14T12:06:00.594Z',
							lastMessage: {
								_id: 'rtf5JoPLQup3X7Aof',
								t: 'videoconf',
								msg: '',
								groupable: false,
								blocks: [
									{
										type: 'video_conf',
										blockId: '6502f728a2f73c7460df6f71',
										callId: '6502f728a2f73c7460df6f71',
										appId: 'videoconf-core',
									},
								],
								ts: '2023-09-14T12:06:00.594Z',
								u: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'test.test',
									name: 'test test',
								},
								rid: 'JKa7R9zu2DinBhBN9',
								_updatedAt: '2023-09-14T12:06:00.685Z',
								urls: [],
								mentions: [],
								channels: [],
							},
							teamId: '63f3efc4b000b6b6d86704b2',
							teamDefault: true,
						},
						success: true,
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roomId: 'JKa7R9zu2DinBhBN9',
					isDefault: true,
				},
			},
		},
	},
	'teams.listRooms': {
		response: {
			'200': {
				Success: {
					value: {
						rooms: [
							{
								_id: 'JKa7R9zu2DinBhBN9',
								fname: 'Livestream',
								customFields: {},
								description: '',
								broadcast: false,
								encrypted: false,
								federated: false,
								name: 'Livestream',
								t: 'c',
								msgs: 16,
								usersCount: 4,
								u: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'roxie',
								},
								ts: '2023-02-22T17:15:26.989Z',
								ro: false,
								default: false,
								sysMes: true,
								_updatedAt: '2023-09-29T06:02:30.250Z',
								lm: '2023-09-14T12:06:00.594Z',
								lastMessage: {
									_id: 'rtf5JoPLQup3X7Aof',
									t: 'videoconf',
									msg: '',
									groupable: false,
									blocks: [
										{
											type: 'video_conf',
											blockId: '6502f728a2f73c7460df6f71',
											callId: '6502f728a2f73c7460df6f71',
											appId: 'videoconf-core',
										},
									],
									ts: '2023-09-14T12:06:00.594Z',
									u: {
										_id: 'rbAXPnMktTFbNpwtJ',
										username: 'test.test',
										name: 'test test',
									},
									rid: 'JKa7R9zu2DinBhBN9',
									_updatedAt: '2023-09-14T12:06:00.685Z',
									urls: [],
									mentions: [],
									channels: [],
								},
								teamId: '63f3efc4b000b6b6d86704b2',
								teamDefault: true,
							},
						],
						total: 1,
						count: 1,
						offset: 0,
						success: true,
					},
				},
			},
		},
	},
	'teams.listRoomsOfUser': {
		response: {
			'200': {
				Success: {
					value: {
						rooms: [
							{
								_id: 'JKa7R9zu2DinBhBN9',
								fname: 'Livestream',
								customFields: {},
								description: '',
								broadcast: false,
								encrypted: false,
								federated: false,
								name: 'Livestream',
								t: 'c',
								msgs: 16,
								usersCount: 4,
								u: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'roxie',
								},
								ts: '2023-02-22T17:15:26.989Z',
								ro: false,
								default: false,
								sysMes: true,
								_updatedAt: '2023-09-29T06:02:30.250Z',
								lm: '2023-09-14T12:06:00.594Z',
								lastMessage: {
									_id: 'rtf5JoPLQup3X7Aof',
									t: 'videoconf',
									msg: '',
									groupable: false,
									blocks: [
										{
											type: 'video_conf',
											blockId: '6502f728a2f73c7460df6f71',
											callId: '6502f728a2f73c7460df6f71',
											appId: 'videoconf-core',
										},
									],
									ts: '2023-09-14T12:06:00.594Z',
									u: {
										_id: 'rbAXPnMktTFbNpwtJ',
										username: 'test.test',
										name: 'test test',
									},
									rid: 'JKa7R9zu2DinBhBN9',
									_updatedAt: '2023-09-14T12:06:00.685Z',
									urls: [],
									mentions: [],
									channels: [],
								},
								teamId: '63f3efc4b000b6b6d86704b2',
								teamDefault: true,
								isLastOwner: true,
							},
						],
						total: 1,
						count: 1,
						offset: 0,
						success: true,
					},
				},
			},
		},
	},
	'teams.listChildren': {
		response: {
			'200': {
				Success: {
					value: {
						total: 2,
						data: [
							{
								_id: '66c82d78237405fc05fc1eef',
								fname: 'test-team',
								_updatedAt: '2024-09-20T12:27:38.725Z',
								topic: '',
								broadcast: false,
								encrypted: false,
								name: 'test-team',
								t: 'c',
								msgs: 3,
								usersCount: 1,
								u: {
									_id: 'C38WSSzrGd2NCjzqJ',
									username: 'test.cat',
									name: 'test.cat',
								},
								ts: '2024-08-23T06:34:32.413Z',
								ro: false,
								default: false,
								sysMes: true,
								teamId: '66c82d78237405fc05fc1ef1',
								teamMain: true,
								lastMessage: {
									_id: 'ZaeoxcCsHLutRkh9m',
									rid: '66c82d78237405fc05fc1eef',
									msg: 'testing',
									ts: '2024-09-20T12:27:38.634Z',
									u: {
										_id: 'C38WSSzrGd2NCjzqJ',
										username: 'test.cat',
										name: 'test.cat',
									},
									_updatedAt: '2024-09-20T12:27:38.686Z',
									urls: [],
									mentions: [],
									channels: [],
									md: [
										{
											type: 'PARAGRAPH',
											value: [
												{
													type: 'PLAIN_TEXT',
													value: 'testing',
												},
											],
										},
									],
								},
								lm: '2024-09-20T12:27:38.634Z',
							},
							{
								_id: '66ed2dba40141d95f32c292b',
								fname: 'new-channel',
								_updatedAt: '2024-09-20T12:29:08.284Z',
								customFields: {},
								topic: '',
								broadcast: false,
								encrypted: false,
								name: 'new-channel',
								t: 'p',
								msgs: 3,
								usersCount: 2,
								u: {
									_id: 'C38WSSzrGd2NCjzqJ',
									username: 'test.cat',
									name: 'test.cat',
								},
								ts: '2024-09-20T08:09:30.417Z',
								ro: false,
								teamId: '66c82d78237405fc05fc1ef1',
								default: false,
								sysMes: true,
								lastMessage: {
									_id: 'xZhJfE4rmaosjHZCe',
									rid: '66ed2dba40141d95f32c292b',
									msg: 'testing',
									ts: '2024-09-20T12:27:53.356Z',
									u: {
										_id: 'C38WSSzrGd2NCjzqJ',
										username: 'test.cat',
										name: 'test.cat',
									},
									_updatedAt: '2024-09-20T12:27:53.397Z',
									urls: [],
									mentions: [],
									channels: [],
									md: [
										{
											type: 'PARAGRAPH',
											value: [
												{
													type: 'PLAIN_TEXT',
													value: 'testing',
												},
											],
										},
									],
								},
								lm: '2024-09-20T12:27:53.356Z',
							},
						],
						offset: 0,
						count: 50,
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error:
							"must have required property 'teamId'\n must have required property 'teamName'\n must have required property 'roomId'\n must match exactly one schema in oneOf [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
	},
	'teams.members': {
		response: {
			'200': {
				Success: {
					value: {
						members: [
							{
								user: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'roxie',
									name: 'test test',
									status: 'offline',
									settings: {
										preferences: {
											themeAppearence: 'light',
										},
										profile: {},
									},
								},
								roles: ['owner'],
								createdBy: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'test.test',
								},
								createdAt: '2023-02-20T22:10:12.740Z',
							},
							{
								user: {
									_id: '5fRTXMt7DMJbpPJfh',
									username: 'test.test',
									name: 'Testtest',
									status: 'offline',
									settings: {
										profile: {},
									},
								},
								createdBy: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'test.test',
								},
								createdAt: '2023-07-11T00:23:01.346Z',
							},
						],
						total: 2,
						count: 2,
						offset: 0,
						success: true,
					},
				},
			},
		},
	},
	'teams.addMembers': {
		body: {
			Example: {
				value: {
					teamId: '63f3efc4b000b6b6d86704b2',
					members: [
						{
							userId: 'rYhzFRd2QZjNwAAXX',
							roles: ['member'],
						},
					],
				},
			},
		},
	},
	'teams.updateMember': {
		body: {
			Example: {
				value: {
					teamId: '63f3efc4b000b6b6d86704b2',
					member: {
						userId: 'rYhzFRd2QZjNwAAXX',
						roles: ['owner', 'leader'],
					},
				},
			},
		},
	},
	'teams.removeMember': {
		body: {
			Example: {
				value: {
					teamId: '63f3efc4b000b6b6d86704b2',
					userId: 'rYhzFRd2QZjNwAAXX',
					rooms: ['JKa7R9zu2DinBhBN9'],
				},
			},
		},
	},
	'teams.leave': {
		body: {
			Example: {
				value: {
					teamName: 'team1',
					rooms: ['8dugqGhuRvCBLdZft'],
				},
			},
		},
	},
	'teams.info': {
		response: {
			'200': {
				Success: {
					value: {
						teamInfo: {
							_id: '607e0d9b49d493189836bfac',
							name: 'Team1',
							type: 1,
							createdAt: '2021-04-19T23:09:15.106Z',
							createdBy: {
								_id: 'FL2fZL4ERhwA3gWiS',
								username: 'some.username',
							},
							_updatedAt: '2021-04-19T23:09:15.106Z',
							roomId: 'Dgh2xwJ3NFKWvKSqY',
						},
						success: true,
					},
				},
			},
		},
	},
	'teams.delete': {
		body: {
			Example: {
				value: {
					teamId: 'mLGZGywfmLGZGywf',
					roomsToRemove: ['8dugqGhuRvCBLdZft'],
				},
			},
		},
	},
	'teams.autocomplete': {
		response: {
			'200': {
				Success: {
					value: {
						teams: [
							{
								_id: 'Dgh2xwJ3NFKWvKSqY',
								name: 'team1',
								fname: 'team1',
								t: 'p',
								teamId: '607e0d9b49d493189836bfac',
							},
						],
						success: true,
					},
				},
			},
		},
	},
	'teams.update': {
		body: {
			Example: {
				value: {
					teamId: 'ByehQjC44FwMeiLbX',
					data: {
						name: 'newTeamName',
						type: 1,
					},
				},
			},
		},
	},
};
