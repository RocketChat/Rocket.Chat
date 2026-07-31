import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the groups endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const groupsExamples = {
	'groups.addAll': {
		response: {
			'200': {
				Success: {
					value: {
						channel: {
							_id: 'ByehQjC44FwMeiLbX',
							name: 'groupname',
							t: 'p',
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
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'The required "roomId" or "roomName" param provided does not match any group [error-room-not-found]',
						errorType: 'error-room-not-found',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roomId: 'ByehQjC44FwMeiLbX',
					activeUsersOnly: 'true',
				},
			},
		},
	},
	'groups.addModerator': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'The required "roomId" or "roomName" param provided does not match any group [error-room-not-found]',
						errorType: 'error-room-not-found',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roomId: 'ByehQjC44FwMeiLbX',
					userId: 'nSYqWzZ4GsKTX4dyK',
				},
			},
		},
	},
	'groups.addOwner': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'The required "roomId" or "roomName" param provided does not match any group [error-room-not-found]',
						errorType: 'error-room-not-found',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roomId: 'ByehQjC44FwMeiLbX',
					userId: 'nSYqWzZ4GsKTX4dyK',
				},
			},
		},
	},
	'groups.addLeader': {
		response: {
			'400': {
				'User is already a leader': {
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
					roomId: 'ByehQjC44FwMeiLbX',
					userId: 'oCHkav5Zf6vmpu2W2',
				},
			},
		},
	},
	'groups.archive': {
		response: {
			'400': {
				'No permission': {
					value: {
						success: false,
						error: 'Not authorized [error-not-authorized]',
						errorType: 'error-not-authorized',
						details: {
							method: 'archiveRoom',
						},
					},
				},
			},
		},
	},
	'groups.close': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'The required "roomId" or "roomName" param provided does not match any group [error-room-not-found]',
						errorType: 'error-room-not-found',
					},
				},
			},
		},
	},
	'groups.kick': {
		response: {
			'200': {
				Success: {
					value: {
						group: {
							_id: 'ByehQjC44FwMeiLbX',
							name: 'invite-me',
							t: 'p',
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
			'400': {
				'No permission': {
					value: {
						success: false,
						error: 'Not allowed [error-not-allowed]',
						errorType: 'error-not-allowed',
						details: {
							method: 'removeUserFromRoom',
						},
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roomId: 'ByehQjC44FwMeiLbX',
					userId: 'nSYqWzZ4GsKTX4dyK',
				},
			},
		},
	},
	'groups.leave': {
		response: {
			'200': {
				Success: {
					value: {
						group: {
							_id: 'ByehQjC44FwMeiLbX',
							name: 'invite-me',
							t: 'p',
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
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'You are the last owner. Please set new owner before leaving the room. [error-you-are-last-owner]',
						errorType: 'error-you-are-last-owner',
						details: {
							method: 'leaveRoom',
						},
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: 'The parameter "roomId" or "roomName" is required [error-room-param-not-provided]',
						errorType: 'error-room-param-not-provided',
					},
				},
			},
		},
	},
	'groups.open': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'The parameter "roomId" or "roomName" is required [error-room-param-not-provided]',
						errorType: 'error-room-param-not-provided',
					},
				},
			},
		},
	},
	'groups.removeModerator': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'The parameter "roomId" or "roomName" is required [error-room-param-not-provided]',
						errorType: 'error-room-param-not-provided',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: 'The required "userId" or "username" param was not provided [error-user-param-not-provided]',
						errorType: 'error-user-param-not-provided',
					},
				},
			},
		},
		body: {
			Success: {
				value: {
					roomId: 'ByehQjC44FwMeiLbX',
					userId: 'oCHkav5Zf6vmpu2W2',
				},
			},
		},
	},
	'groups.removeOwner': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'The parameter "roomId" or "roomName" is required [error-room-param-not-provided]',
						errorType: 'error-room-param-not-provided',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: 'The required "userId" or "username" param was not provided [error-user-param-not-provided]',
						errorType: 'error-user-param-not-provided',
					},
				},
			},
		},
		body: {
			Success: {
				value: {
					roomId: 'ByehQjC44FwMeiLbX',
					userId: 'oCHkav5Zf6vmpu2W2',
				},
			},
		},
	},
	'groups.removeLeader': {
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
	'groups.rename': {
		response: {
			'200': {
				Success: {
					value: {
						group: {
							_id: 'ByehQjC44FwMeiLbX',
							name: 'new-name',
							t: 'p',
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
				'Example 1': {
					value: {
						success: false,
						error: 'The bodyParam "name" is required',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: 'The parameter "roomId" or "roomName" is required [error-room-param-not-provided]',
						errorType: 'error-room-param-not-provided',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roomId: 'ByehQjC44FwMeiLbX',
					name: 'new-name',
				},
			},
		},
	},
	'groups.setCustomFields': {
		response: {
			'200': {
				Success: {
					value: {
						group: {
							_id: '66c88dae237405fc05fc1f06',
							fname: 'api-team2',
							_updatedAt: '2025-11-20T08:26:12.813Z',
							name: 'api-team2',
							t: 'p',
							msgs: 17,
							usersCount: 2,
							u: {
								_id: 'C38WSSzrGd2NCjzqJ',
								username: 'test.cat',
								name: 'test.cat',
							},
							ts: '2024-08-23T13:25:02.959Z',
							ro: false,
							sidepanel: {
								items: ['discussions'],
							},
							teamId: '66c88daf237405fc05fc1f08',
							teamMain: true,
							rolePrioritiesCreated: 2,
							lastMessage: {
								_id: '3yXev48EfPnBwfvDN',
								rid: '66c88dae237405fc05fc1f06',
								msg: 'hello world',
								ts: '2025-10-28T06:32:52.861Z',
								u: {
									_id: 'C38WSSzrGd2NCjzqJ',
									username: 'test.cat',
									name: 'Test Cat',
								},
								_updatedAt: '2025-10-28T06:32:52.983Z',
								urls: [],
								mentions: [],
								channels: [],
								md: [
									{
										type: 'PARAGRAPH',
										value: [
											{
												type: 'PLAIN_TEXT',
												value: 'hello world',
											},
										],
									},
								],
							},
							lm: '2025-10-28T06:32:52.861Z',
							encrypted: false,
							e2eKeyId: '8ee4c64e1012',
							retention: {
								enabled: false,
								overrideGlobal: false,
							},
							announcement: 'testing announcement',
							announcementDetails: null,
							customFields: {
								company: 'sell-and-more',
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
						error: 'The bodyParam "customFields" is required with a type like object.',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: 'The parameter "roomId" or "roomName" is required [error-room-param-not-provided]',
						errorType: 'error-room-param-not-provided',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roomId: 'euzoT67Gx6nXcn66M',
					customFields: {
						company: 'sell-and-more',
					},
				},
			},
		},
	},
	'groups.setDescription': {
		response: {
			'200': {
				Success: {
					value: {
						description: 'Testing out everything.',
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'The bodyParam "description" is required',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: 'The parameter "roomId" or "roomName" is required [error-room-param-not-provided]',
						errorType: 'error-room-param-not-provided',
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
	'groups.setPurpose': {
		response: {
			'200': {
				Success: {
					value: {
						purpose: 'Testing out everything.',
						success: true,
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roomId: 'ByehQjC44FwMeiLbX',
					purpose: 'Test out everything',
				},
			},
		},
	},
	'groups.setReadOnly': {
		response: {
			'200': {
				Success: {
					value: {
						group: {
							_id: 'ByehQjC44FwMei5LbX',
							name: 'testing-private',
							t: 'p',
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
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'The parameter "roomId" or "roomName" is required [error-room-param-not-provided]',
						errorType: 'error-room-param-not-provided',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: 'The bodyParam "readOnly" is required',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roomId: 'ByehQjC44FwMei5LbX',
					readOnly: true,
				},
			},
		},
	},
	'groups.setTopic': {
		response: {
			'200': {
				Success: {
					value: {
						topic: 'Testing out everything.',
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'The bodyParam "topic" is required',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: 'The parameter "roomId" or "roomName" is required [error-room-param-not-provided]',
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
	'groups.setType': {
		response: {
			'200': {
				Example: {
					value: {
						group: {
							_id: 'ByehQjC44FwMeiLbX',
							name: 'testing0',
							t: 'c',
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
				'Missing body param: type': {
					value: {
						success: false,
						error: 'The bodyParam "type" is required',
					},
				},
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
					roomId: 'ByehQjC44FwMeiLbX',
					type: 'c',
				},
			},
		},
	},
	'groups.setAnnouncement': {
		response: {
			'200': {
				Success: {
					value: {
						announcement: 'Test out everything.',
						success: true,
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roomId: 'ByehQjC44FwMeiLbX',
					announcement: 'Test announcement',
				},
			},
		},
	},
	'groups.unarchive': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'The parameter "roomId" or "roomName" is required [error-room-param-not-provided]',
						errorType: 'error-room-param-not-provided',
					},
				},
			},
		},
	},
	'groups.setEncrypted': {
		response: {
			'200': {
				Success: {
					value: {
						group: {
							_id: 'JZ8Y2dLfYhsg323Rf',
							fname: 'test',
							description: '',
							broadcast: false,
							encrypted: false,
							teamMain: true,
							name: 'test',
							t: 'p',
							msgs: 0,
							usersCount: 1,
							u: {
								_id: 'd26x6zSkaPSe5gCyy',
								username: 'rodriq',
							},
							ts: '2021-10-22T11:59:17.029Z',
							ro: false,
							teamId: '6172a795c563fc000acc4629',
							_updatedAt: '2021-10-22T12:00:11.496Z',
						},
						success: true,
					},
				},
			},
			'400': {
				'Invalid  RoomId or RoomName': {
					value: {
						success: false,
						error: 'The required "roomId" or "roomName" param provided does not match any group [error-room-not-found]',
						errorType: 'error-room-not-found',
					},
				},
				'No RoomId or Roomname': {
					value: {
						success: false,
						error: 'The parameter "roomId" or "roomName" is required [error-room-param-not-provided]',
						errorType: 'error-room-param-not-provided',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					encrypted: false,
					roomId: 'JZ8Y2dLfYhsg323Rf',
				},
			},
		},
	},
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
