/**
 * Request and response examples for the rooms endpoints, imported from
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

export const roomsExamples: Record<string, PayloadExamples> = {
	'rooms.nameExists': {
		response: {
			'200': {
				Success: {
					value: {
						exists: true,
						success: true,
					},
				},
			},
			'400': {
				'roomName is required': {
					value: {
						success: false,
						error: "must have required property 'roomName' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
	},
	'rooms.delete': {
		response: {
			'400': {
				'Example 1: Missing roomId': {
					value: {
						success: false,
						error: "The 'roomId' param is required",
					},
				},
				'Example 2: Missing Permission': {
					value: {
						success: true,
						error: 'string',
					},
				},
				'Example 3: Cannot Delete Team Channel': {
					value: {
						success: false,
						error: 'Cannot delete a team channel [error-cannot-delete-team-channel]',
						errorType: 'error-cannot-delete-team-channel',
						details: {
							method: 'eraseRoom',
						},
					},
				},
			},
		},
	},
	'rooms.get': {
		response: {
			'200': {
				Success: {
					value: {
						update: [
							{
								_id: 'GENERAL',
								ts: '2024-02-14T14:34:49.365Z',
								t: 'c',
								name: 'general',
								usernames: [],
								msgs: 55,
								usersCount: 36,
								_updatedAt: '2024-07-16T08:49:34.732Z',
								u: {
									_id: 'rocket.cat',
									username: 'rocket.cat',
									name: 'Rocket.Cat',
								},
								default: true,
								lastMessage: {
									_id: '668fc2bbffe932842327c1ff',
									t: 'discussion-created',
									rid: 'GENERAL',
									ts: '2024-07-11T11:32:11.220Z',
									msg: 'Discussion',
									u: {
										_id: '5m4hjvzCTRCqwPrD2',
										username: 'Rama',
										name: 'Raghav Ram',
									},
									groupable: false,
									drid: '668fc2bbffe932842327c1fd',
									_updatedAt: '2024-07-11T11:32:11.220Z',
								},
								lm: '2024-07-11T11:32:11.220Z',
							},
							{
								_id: 'WbYJfC5kTArcECGkpfZ3bvXC72pobjFPLJ',
								t: 'd',
								usernames: ['user2', 'user1'],
								usersCount: 2,
								msgs: 2,
								ts: '2024-07-10T13:48:14.998Z',
								uids: ['WbYJfC5kTArcECGkp', 'fZ3bvXC72pobjFPLJ'],
								default: false,
								ro: false,
								sysMes: true,
								_updatedAt: '2024-07-10T13:48:28.300Z',
								lastMessage: {
									_id: 'XHjLcN3pCe8snaoTm',
									rid: 'WbYJfC5kTArcECGkpfZ3bvXC72pobjFPLJ',
									msg: 'again',
									ts: '2024-07-10T13:48:28.262Z',
									u: {
										_id: 'fZ3bvXC72pobjFPLJ',
										username: 'user1',
										name: 'user1',
									},
									_updatedAt: '2024-07-10T13:48:28.296Z',
									urls: [],
									mentions: [],
									channels: [],
									md: [
										{
											type: 'PARAGRAPH',
											value: [
												{
													type: 'PLAIN_TEXT',
													value: 'again',
												},
											],
										},
									],
								},
								lm: '2024-07-10T13:48:28.262Z',
							},
							{
								_id: 'fZ3bvXC72pobjFPLJrocket.cat',
								t: 'd',
								usernames: ['user1', 'rocket.cat'],
								usersCount: 2,
								msgs: 15,
								ts: '2024-02-21T02:00:01.657Z',
								uids: ['fZ3bvXC72pobjFPLJ', 'rocket.cat'],
								default: false,
								ro: false,
								sysMes: true,
								_updatedAt: '2024-07-17T02:00:05.203Z',
								lastMessage: {
									rid: 'fZ3bvXC72pobjFPLJrocket.cat',
									msg: '*Update your Rocket.Chat*\nNew version available (6.10.0)\nhttps://github.com/RocketChat/Rocket.Chat/releases/tag/6.10.0',
									ts: '2024-07-17T02:00:05.161Z',
									u: {
										_id: 'rocket.cat',
										username: 'rocket.cat',
										name: 'Rocket.Cat',
									},
									_id: 'c4PzLLTy4fDSCmm4F',
									_updatedAt: '2024-07-17T02:00:05.198Z',
									urls: [
										{
											url: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/6.10.0',
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
													value: 'New version available (6.10.0)',
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
															value: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/6.10.0',
														},
														label: [
															{
																type: 'PLAIN_TEXT',
																value: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/6.10.0',
															},
														],
													},
												},
											],
										},
									],
								},
								lm: '2024-07-17T02:00:05.161Z',
							},
						],
						remove: [],
						success: true,
					},
				},
			},
		},
	},
	'rooms.saveNotification': {
		body: {
			Example: {
				value: {
					roomId: '5of4weEXaH7yncxz9',
					notifications: {
						desktopNotifications: 'all',
						disableNotifications: 0,
						emailNotifications: 'nothing',
						audioNotificationValue: 'beep',
						desktopNotificationDuration: '2',
						audioNotifications: 'all',
						unreadAlert: 'nothing',
						hideUnreadStatus: 0,
						mobilePushNotifications: 'mentions',
					},
				},
			},
		},
	},
	'rooms.cleanHistory': {
		body: {
			Example: {
				value: {
					roomId: 'roomId',
					latest: '2016-12-09T13:42:25.304Z',
					oldest: '2016-08-30T13:42:25.304Z',
				},
			},
		},
	},
	'rooms.info': {
		response: {
			'200': {
				Success: {
					value: {
						room: {
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
								alias: null,
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
						team: {
							_id: '66c82d78237405fc05fc1ef1',
							name: 'test-team',
							type: 0,
							roomId: '66c82d78237405fc05fc1eef',
						},
						parent: {
							_id: '66c82d78237405fc05fc1eef',
							fname: 'test-team',
							name: 'test-team',
							t: 'c',
						},
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'The parameter "roomId" or "roomName" is required [error-roomid-param-not-provided]',
						errorType: 'error-roomid-param-not-provided',
					},
				},
			},
		},
	},
	'rooms.createDiscussion': {
		response: {
			'200': {
				Success: {
					value: {
						discussion: {
							rid: 'cgk88DHLHexwMaFWh',
							name: 'WJNEAM7W45wRYitHo',
							fname: 'Discussion Name',
							t: 'p',
							msgs: 0,
							usersCount: 0,
							u: {
								_id: 'rocketchat.internal.admin.test',
								username: 'rocketchat.internal.admin.test',
							},
							topic: 'general',
							prid: 'GENERAL',
							ts: '2019-04-03T01:35:32.271Z',
							ro: false,
							sysMes: true,
							default: false,
							_updatedAt: '2019-04-03T01:35:32.280Z',
							_id: 'cgk88DHLHexwMaFWh',
						},
						success: true,
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					prid: 'GENERAL',
					t_name: 'Discussion Name',
				},
			},
		},
	},
	'rooms.getDiscussions': {
		response: {
			'200': {
				Success: {
					value: {
						discussions: [
							{
								_id: '6514d34ea2f73c7460e18cb4',
								fname: 'test-discussion',
								_updatedAt: '2023-09-28T01:14:04.275Z',
								topic: 'general',
								prid: 'GENERAL',
								encrypted: false,
								name: 'M75nSgA3uYsnTbKRu',
								t: 'c',
								msgs: 1,
								usersCount: 1,
								u: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'roxie',
									name: 'test test',
								},
								ts: '2023-09-28T01:13:50.574Z',
								ro: false,
								default: false,
								sysMes: true,
								lastMessage: {
									_id: 'pnm4kh84HfncDEZj7',
									rid: '6514d34ea2f73c7460e18cb4',
									msg: 'Hi guys , this is for SWE team',
									ts: '2023-09-28T01:14:04.119Z',
									u: {
										_id: 'rbAXPnMktTFbNpwtJ',
										username: 'roxie',
										name: 'test test',
									},
									_updatedAt: '2023-09-28T01:14:04.233Z',
									urls: [],
									mentions: [],
									channels: [],
									md: [
										{
											type: 'PARAGRAPH',
											value: [
												{
													type: 'PLAIN_TEXT',
													value: 'Hi guys , this is for SWE team',
												},
											],
										},
									],
								},
								lm: '2023-09-28T01:14:04.119Z',
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
	'rooms.images': {
		response: {
			'200': {
				Success: {
					value: {
						files: [
							{
								_id: '666fdecb4ac1a8e6404ededd',
								name: 'oauth-screen.png',
								size: 78441,
								type: 'image/png',
								rid: '6630e42b72f069422b1022c1',
								userId: 'yuT9xp9eEd6HqB3n8',
								store: 'GridFS:Uploads',
								_updatedAt: '2024-06-17T06:59:23.608Z',
								identify: {
									format: 'png',
									size: {
										width: 1580,
										height: 884,
									},
								},
								complete: true,
								etag: 'yvaG9cjz6YRRdMg4L',
								path: '/ufs/GridFS:Uploads/666fdecb4ac1a8e6404ededd/oauth-screen.png',
								progress: 1,
								token: '1888eA0A0B',
								uploadedAt: '2024-06-17T06:59:23.602Z',
								uploading: false,
								url: 'https://pro.writing-demo.dev.rocket.chat/ufs/GridFS:Uploads/666fdecb4ac1a8e6404ededd/oauth-screen.png',
								typeGroup: 'image',
							},
							{
								_id: '666fddea4ac1a8e6404eded7',
								name: '11.jpg',
								size: 83832,
								type: 'image/jpeg',
								rid: '6630e42b72f069422b1022c1',
								userId: 'yuT9xp9eEd6HqB3n8',
								store: 'GridFS:Uploads',
								_updatedAt: '2024-06-17T06:55:38.044Z',
								identify: {
									format: 'jpeg',
									size: {
										width: 839,
										height: 932,
									},
								},
								complete: true,
								etag: '3jZf7SJZFCPpf9JK8',
								path: '/ufs/GridFS:Uploads/666fddea4ac1a8e6404eded7/11.jpg',
								progress: 1,
								token: '498bb849C8',
								uploadedAt: '2024-06-17T06:55:38.029Z',
								uploading: false,
								url: 'https://pro.writing-demo.dev.rocket.chat/ufs/GridFS:Uploads/666fddea4ac1a8e6404eded7/11.jpg',
								typeGroup: 'image',
							},
						],
						count: 50,
						offset: 0,
						total: 2,
						success: true,
					},
				},
			},
			'400': {
				'Invalid Params': {
					value: {
						success: false,
						error: "must have required property 'roomId' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
	},
	'rooms.adminRooms': {
		response: {
			'200': {
				Success: {
					value: {
						rooms: [
							{
								_id: '654c9d1ca2f73c7460e1918b',
								fname: 'animalGeography',
								topic: '',
								broadcast: false,
								name: 'animalGeography',
								t: 'p',
								msgs: 4,
								usersCount: 1,
								u: {
									_id: 'CkCPNcvsvCDfmWLqC',
									username: 'kim.jane',
									name: 'kim.jane',
								},
								ro: false,
								default: false,
								customFields: {
									department: 'engineering',
									priority: 'high',
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
	'rooms.autocomplete.adminRooms': {
		response: {
			'200': {
				Success: {
					value: {
						items: [
							{
								_id: '664f0d815df46832f75b1877',
								fname: 'rangig',
								name: 'Ch9xkYwGHnsLe7CQR',
								t: 'c',
							},
							{
								_id: '664f0d525df46832f75b1860',
								fname: 'rancher',
								name: 'rancher',
								t: 'p',
							},
							{
								_id: '6630e94ad2226209149c67e2',
								fname: 'random',
								name: 'random',
								t: 'c',
							},
						],
						success: true,
					},
				},
			},
			'400': {
				'Selector Param Required': {
					value: {
						success: false,
						error: "The 'selector' param is required",
					},
				},
			},
		},
	},
	'rooms.adminRooms.getRoom': {
		response: {
			'200': {
				Success: {
					value: {
						_id: 'ukFsHiySDhMkQyyyF',
						name: 'freightwave',
						fname: 'freightwave',
						t: 'p',
						msgs: 4,
						usersCount: 1,
						u: {
							_id: 'Gd6iymRZBK4C6wqHN',
							username: 'bruno.raymundo',
						},
						ro: false,
						default: false,
						customFields: {
							department: 'engineering',
							priority: 'high',
						},
						success: true,
					},
				},
			},
		},
	},
	'rooms.autocomplete.channelAndPrivate': {
		response: {
			'200': {
				Success: {
					value: {
						items: [
							{
								_id: '664f0d525df46832f75b1860',
								fname: 'rancher',
								name: 'rancher',
								t: 'p',
							},
							{
								_id: '6630e94ad2226209149c67e2',
								fname: 'random',
								name: 'random',
								t: 'c',
							},
							{
								_id: '664f148f5df46832f75b18b2',
								fname: 'ranmowe',
								name: 'ranmowe',
								t: 'p',
							},
						],
						success: true,
					},
				},
			},
			'400': {
				'Selector Param Required': {
					value: {
						success: false,
						error: "The 'selector' param is required",
					},
				},
			},
		},
	},
	'rooms.autocomplete.channelAndPrivate.withPagination': {
		response: {
			'200': {
				'Example 1': {
					value: {
						items: [
							{
								_id: '66c82e1e237405fc05fc1ef4',
								fname: 'api-team',
								name: 'api-team',
								t: 'c',
							},
							{
								_id: '66c88dae237405fc05fc1f06',
								fname: 'api-team2',
								name: 'api-team2',
								t: 'p',
							},
						],
						total: 4,
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: "The 'selector' param is required",
					},
				},
			},
		},
	},
	'rooms.autocomplete.availableForTeams': {
		response: {
			'200': {
				'Match error': {
					value: {
						items: [
							{
								_id: 'siyr2oWQJBjQjhLwr',
								fname: 'try',
								name: 'try',
								t: 'c',
							},
						],
						success: true,
					},
				},
			},
		},
	},
	'rooms.saveRoomSettings': {
		response: {
			'200': {
				Success: {
					value: {
						rid: 'JZ8Y2dLfYhsg323Rf',
						success: true,
					},
				},
			},
			'400': {
				'Invalid room': {
					value: {
						success: false,
						error: 'Invalid room [error-invalid-room]',
						errorType: 'error-invalid-room',
					},
				},
				'ABAC-managed room type conversion blocked': {
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
				'ABAC-managed room default blocked': {
					value: {
						success: false,
						error: 'Setting an ABAC managed room as default is not allowed [error-action-not-allowed]',
						errorType: 'error-action-not-allowed',
						details: {
							method: 'saveRoomSettings',
							action: 'Viewing_room_administration',
						},
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					rid: 'JZ8Y2dLfYhsg323Rf',
					roomName: 'Test-Save-Room',
					roomDescription: 'This is a test room.',
				},
			},
		},
	},
	'rooms.changeArchivationState': {
		response: {
			'400': {
				'Invalid Room': {
					value: {
						success: false,
						error: 'Invalid room [error-invalid-room]',
						errorType: 'error-invalid-room',
						details: {
							method: 'unarchiveRoom',
						},
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					rid: 'iu7jtPAhvEeAS5tNq',
					action: 'archive',
				},
			},
		},
	},
	'rooms.export': {
		response: {
			'400': {
				'Invalid Room ID': {
					value: {
						success: false,
						error: '[error-invalid-room]',
						errorType: 'error-invalid-room',
					},
				},
				'Invalid Format': {
					value: {
						success: false,
						error: '[error-invalid-format]',
						errorType: 'error-invalid-format',
					},
				},
				'Invalid Params': {
					value: {
						success: false,
						error: '[error-invalid-params]',
						errorType: 'error-invalid-params',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					rid: 'iu7jtPAhvEeAS5tNq',
					type: 'file',
					dateFrom: '2000-01-01',
					dateTo: '2021-11-25',
					format: 'html',
					toUsers: ['test.user'],
					toEmails: ['test@test.com'],
					messages: ['yd6NBgNoiWATgDoFt', 'BoCjicj9DdYoMHHeo', 'tajMB3aX3sawFWe8W'],
					subject: 'Test Subject ',
				},
			},
		},
	},
	'rooms.isMember': {
		response: {
			'200': {
				'Example 1': {
					value: {
						isMember: true,
						success: true,
					},
				},
			},
			'400': {
				'User not available in room': {
					value: {
						success: false,
						error: 'error-user-not-found',
					},
				},
				'Missing user ID parameter': {
					value: {
						success: false,
						error:
							"must have required property 'userId'\n must have required property 'username'\n must match exactly one schema in oneOf [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
	},
	'rooms.membersOrderedByRole': {
		response: {
			'200': {
				'Example 1': {
					value: {
						members: [
							{
								_id: 'C38WSSzrGd2NCjzqJ',
								username: 'test.cat',
								status: 'online',
								_updatedAt: '2025-01-22T07:49:47.830Z',
								name: 'test.cat',
								roles: ['owner'],
							},
							{
								_id: 'P2dgWPPw5veigwcdK',
								status: 'offline',
								_updatedAt: '2025-01-22T07:13:19.734Z',
								name: 'Fun Smith',
								username: 'fun.smith',
								roles: ['moderator'],
							},
							{
								_id: 'CNmyTxexxauJ4wrTW',
								username: 'agent1',
								status: 'offline',
								_updatedAt: '2025-01-22T07:32:57.238Z',
								name: 'agent1',
							},
							{
								_id: 'FSA63o85Poa2EQvAH',
								status: 'offline',
								name: 'cat kate',
								username: 'cat.kate',
								_updatedAt: '2025-01-22T08:04:12.251Z',
								roles: ['leader'],
							},
						],
						count: 4,
						offset: 0,
						total: 4,
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error:
							"must have required property 'roomId'\n must have required property 'roomName'\n must match exactly one schema in oneOf [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
	},
	'rooms.muteUser': {
		response: {
			'400': {
				'Invalid User': {
					value: {
						success: false,
						error: 'The required "userId" or "username" param provided does not match any users [error-invalid-user]',
						errorType: 'error-invalid-user',
					},
				},
				'Invalid Params': {
					value: {
						success: false,
						error:
							"must have required property 'userId'\n must have required property 'username'\n must match exactly one schema in oneOf [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
	},
	'rooms.unmuteUser': {
		response: {
			'400': {
				'Invalid User': {
					value: {
						success: false,
						error: 'The required "userId" or "username" param provided does not match any users [error-invalid-user]',
						errorType: 'error-invalid-user',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error:
							"must have required property 'userId'\n must have required property 'username'\n must match exactly one schema in oneOf [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
	},
	'rooms.join': {
		response: {
			'200': {
				Example: {
					value: {
						room: {
							_id: 'ByehQjC44FwMeiLbX',
							name: 'general',
							fname: 'general',
							t: 'c',
							msgs: 8,
							usersCount: 2,
							u: {
								_id: 'rocketchat.internal.admin.test',
								username: 'rocketchat.internal.admin.test',
							},
							ts: '2026-01-16T12:00:04.783Z',
							ro: false,
							sysMes: true,
							default: true,
							_updatedAt: '2026-01-16T12:06:30.426Z',
						},
						success: true,
					},
				},
			},
			'400': {
				'Invalid params': {
					value: {
						success: false,
						error: "Match error: Missing key 'roomId'",
						errorType: 'error-invalid-params',
					},
				},
				'Room not found': {
					value: {
						success: false,
						error: 'The required "roomId" or "roomName" param provided does not match any channel [error-room-not-found]',
						errorType: 'error-room-not-found',
					},
				},
			},
		},
		body: {
			'Join by room ID': {
				value: {
					roomId: 'ByehQjC44FwMeiLbX',
					joinCode: '1234',
				},
			},
			'Join by room name': {
				value: {
					roomName: 'general',
				},
			},
		},
	},
	'rooms.hide': {
		response: {
			'200': {
				'Example 1': {
					value: {
						success: true,
					},
				},
			},
			'400': {
				'Error due to missing roomId': {
					value: {
						success: false,
						error: "must have required property 'roomId' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
				'Room already hidden error': {
					value: {
						success: false,
						error: 'error-room-already-hidden',
					},
				},
			},
			'401': {
				'Example 1': {
					value: {
						success: false,
						error: 'unauthorized',
					},
				},
			},
		},
		body: {
			'Request body with roomId': {
				value: {
					roomId: '6759dea438288929cff551c',
				},
			},
		},
	},
	'rooms.roles': {
		response: {
			'200': {
				'Example 1': {
					value: {
						roles: [
							{
								_id: '668c75b2b319fc80bf0ed3a1',
								rid: '658282732dd9f928ad989e98',
								u: {
									_id: 'P2dgWPPw5veigwcdK',
									username: 'jane.doe',
									name: 'Jane Doe',
								},
								roles: ['moderator'],
							},
							{
								_id: '6819edfa30c9c71254e45d18',
								rid: '658282732dd9f928ad989e98',
								u: {
									_id: '74HrDgvTTxT56o8R8',
									username: 'mary.shelley',
									name: 'Mary Shelley',
								},
								roles: ['leader'],
							},
							{
								_id: '668c7717b319fc80bf0ed3b0',
								rid: '658282732dd9f928ad989e98',
								u: {
									_id: 'qHWhoJwwgk4bwcoNq',
									username: 'test.user',
								},
								roles: ['moderator'],
							},
							{
								_id: '6690c37ab319fc80bf0ed407',
								rid: '658282732dd9f928ad989e98',
								u: {
									_id: 'C38WSSzrGd2NCjzqJ',
									username: 'test.cat',
								},
								roles: ['owner'],
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
						errorType: 'error-invalid-params',
						error: "must have required property 'rid'",
					},
				},
			},
		},
	},
	'rooms.favorite': {
		body: {
			Example: {
				value: {
					roomId: 'GENERAL',
					favorite: true,
				},
			},
		},
	},
};
