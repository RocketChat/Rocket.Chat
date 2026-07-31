import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the chat endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const chatExamples = {
	'chat.pinMessage': {
		response: {
			'200': {
				'Example 1': {
					value: {
						message: {
							_id: '651f23c0a2f73c7460e18d1a',
							t: 'message_pinned',
							rid: '6GFJ3tbmHiyHbahmC',
							ts: '2023-10-05T20:59:44.503Z',
							msg: '',
							u: {
								_id: '5fRTXMt7DMJbpPJfh',
								username: 'test.test',
								name: 'Testtest',
							},
							groupable: false,
							attachments: [
								{
									text: 'hola',
									author_name: 'roxie',
									author_icon: '/avatar/roxie',
									ts: '2023-10-05T20:30:51.052Z',
									attachments: [],
								},
							],
							_updatedAt: '2023-10-05T20:59:44.521Z',
						},
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'The required "messageId" param is missing. [error-messageid-param-not-provided]',
						errorType: 'error-messageid-param-not-provided',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: 'The provided "messageId" does not match any existing message. [error-message-not-found]',
						errorType: 'error-message-not-found',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					messageId: '7aDSXtjMA3KPLxLjt',
				},
			},
		},
	},
	'chat.unPinMessage': {
		response: {
			'400': {
				'Missing Parameter': {
					value: {
						success: false,
						error: 'The required "messageId" param is missing. [error-messageid-param-not-provided]',
						errorType: 'error-messageid-param-not-provided',
					},
				},
				'Invalid Parameter': {
					value: {
						success: false,
						error: 'The provided "messageId" does not match any existing message. [error-message-not-found]',
						errorType: 'error-message-not-found',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					messageId: '7aDSXtjMA3KPLxLjt',
				},
			},
		},
	},
	'chat.update': {
		response: {
			'200': {
				Example: {
					value: {
						message: {
							_id: 'vzGBzSwy6jJQDwtZe',
							rid: '64f0f82c2c26843a68c1f7ba',
							msg: 'Updated list of links! https://google.com https://hola.org/ https://www.usepayday.com/ https://www.getbumpa.com/ https://www.atlassian.com/software/jira http://localhost:3000/',
							ts: '2023-09-20T17:27:59.945Z',
							u: {
								_id: 'rbAXPnMktTFbNpwtJ',
								username: 'roxie',
								name: 'test test',
							},
							_updatedAt: '2023-09-20T22:22:45.793Z',
							urls: [
								{
									url: 'https://google.com',
									meta: {},
								},
								{
									url: 'https://hola.org/',
									meta: {},
									ignoreParse: true,
								},
								{
									url: 'https://www.atlassian.com/software/jira',
									meta: {},
									ignoreParse: true,
								},
								{
									url: 'http://localhost:3000/',
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
											type: 'PLAIN_TEXT',
											value: 'Updated list of links! ',
										},
										{
											type: 'LINK',
											value: {
												src: {
													type: 'PLAIN_TEXT',
													value: 'https://google.com',
												},
												label: [
													{
														type: 'PLAIN_TEXT',
														value: 'https://google.com',
													},
												],
											},
										},
										{
											type: 'PLAIN_TEXT',
											value: ' ',
										},
										{
											type: 'LINK',
											value: {
												src: {
													type: 'PLAIN_TEXT',
													value: 'https://hola.org/',
												},
												label: [
													{
														type: 'PLAIN_TEXT',
														value: 'https://hola.org/',
													},
												],
											},
										},
										{
											type: 'PLAIN_TEXT',
											value: ' ',
										},
										{
											type: 'LINK',
											value: {
												src: {
													type: 'PLAIN_TEXT',
													value: 'https://www.atlassian.com/software/jira',
												},
												label: [
													{
														type: 'PLAIN_TEXT',
														value: 'https://www.atlassian.com/software/jira',
													},
												],
											},
										},
										{
											type: 'PLAIN_TEXT',
											value: ' ',
										},
										{
											type: 'LINK',
											value: {
												src: {
													type: 'PLAIN_TEXT',
													value: 'http://localhost:3000/',
												},
												label: [
													{
														type: 'PLAIN_TEXT',
														value: 'http://localhost:3000/',
													},
												],
											},
										},
									],
								},
							],
							editedAt: '2023-09-20T22:22:45.737Z',
							editedBy: {
								_id: 'rbAXPnMktTFbNpwtJ',
								username: 'roxie',
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
						error: 'The required "messageId" param is missing. [error-messageid-param-not-provided]',
						errorType: 'error-messageid-param-not-provided',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roomId: '64f0f82c2c26843a68c1f7ba',
					msgId: 'vzGBzSwy6jJQDwtZe',
					text: 'Updated list of links! https://google.com https://hola.org/ https://www.usepayday.com/ https://www.getbumpa.com/ https://www.atlassian.com/software/jira http://localhost:3000/',
					previewUrls: ['https://google.com', 'http://localhost:3000/'],
				},
			},
		},
	},
	'chat.starMessage': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'The required "messageId" param is required. [error-messageid-param-not-provided]',
						errorType: 'error-messageid-param-not-provided',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: 'The provided "messageId" does not match any existing message. [error-message-not-found]',
						errorType: 'error-message-not-found',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					messageId: '7aDSXtjMA3KPLxLjt',
				},
			},
		},
	},
	'chat.unStarMessage': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'The required "messageId" param is required. [error-messageid-param-not-provided]',
						errorType: 'error-messageid-param-not-provided',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: 'The provided "messageId" does not match any existing message. [error-message-not-found]',
						errorType: 'error-message-not-found',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					messageId: '7aDSXtjMA3KPLxLjt',
				},
			},
		},
	},
	'chat.followMessage': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: '[The required "mid" body param is missing.]',
						errorType: 'The required "mid" body param is missing.',
					},
				},
				'Invalid message ID': {
					value: {
						success: false,
						error: 'Invalid message [error-invalid-message]',
						errorType: 'error-invalid-message',
						details: {
							method: 'followMessage',
						},
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					mid: '7aDSXtjMA3KPLxLjt',
				},
			},
		},
	},
	'chat.unfollowMessage': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: '[The required "mid" body param is missing.]',
						errorType: 'The required "mid" body param is missing.',
					},
				},
				'Invalid message ID': {
					value: {
						success: false,
						error: 'Invalid message [error-invalid-message]',
						errorType: 'error-invalid-message',
						details: {
							method: 'unfollowMessage',
						},
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					mid: '7aDSXtjMA3KPLxLjt',
				},
			},
		},
	},
	'chat.react': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'The required "messageId" param is missing. [error-messageid-param-not-provided]',
						errorType: 'error-messageid-param-not-provided',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: 'The provided "messageId" does not match any existing message. [error-message-not-found]',
						errorType: 'error-message-not-found',
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					messageId: '7aDSXtjMA3KPLxLjt',
					emoji: 'smile',
					shouldReact: true,
				},
			},
		},
	},
	'chat.reportMessage': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: "must have required property 'messageId' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: "must have required property 'description' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					messageId: '7aDSXtjMA3KPLxLjt',
					description: 'test',
				},
			},
		},
	},
	'chat.delete': {
		response: {
			'200': {
				Example: {
					value: {
						_id: 'jEnjsxuoDJamGjbH2',
						ts: '1696533809813',
						message: {
							_id: 'jEnjsxuoDJamGjbH2',
							rid: '6GFJ3tbmHiyHbahmC',
							u: {
								_id: '5fRTXMt7DMJbpPJfh',
								username: 'test.test',
								name: 'Testtest',
							},
						},
						success: true,
					},
				},
			},
			'400': {
				'Invalid Message ID': {
					value: {
						success: false,
						error: 'No message found with the id of \\"MvHcX2WKSrmdArmktz\\".',
					},
				},
			},
		},
		body: {
			'Delete by message': {
				value: {
					roomId: 'ByehQjC44FwMeiLbX',
					msgId: '7aDSXtjMA3KPLxLjt',
					asUser: false,
				},
			},
			'Delete by file': {
				value: {
					fileId: '9aFcj4XmgQ7eYpLbT',
				},
			},
		},
	},
	'chat.syncMessages': {
		response: {
			'200': {
				Example: {
					value: {
						result: {
							updated: [
								{
									_id: 'ak3WdaLbf4P7ZW3wQ',
									rid: '5qW6ssMFyzWjJev69',
									u: {
										_id: 'FWfHnJmcudrCagGDX',
										username: '555192857993',
										name: '555192857993',
									},
									msg: 'teste',
									ts: '2021-09-24T19:19:47.911Z',
									_updatedAt: '2021-09-24T19:19:48.048Z',
									alias: 'mauricio pretto',
									token: 'do554ryecscmfrrxyxpvm',
									unread: true,
									urls: [],
									mentions: [],
									channels: [],
									md: [
										{
											type: 'PARAGRAPH',
											value: [
												{
													type: 'PLAIN_TEXT',
													value: 'teste',
												},
											],
										},
									],
								},
								{
									_id: '2ttrNPABcCKbsbEtB',
									t: 'livechat-started',
									msg: '',
									groupable: false,
									ts: '2021-09-24T19:19:46.523Z',
									u: {
										_id: 'FWfHnJmcudrCagGDX',
										username: '555192857993',
										name: '555192857993',
									},
									rid: '5qW6ssMFyzWjJev69',
									unread: true,
									_updatedAt: '2021-09-24T19:19:46.691Z',
									urls: [],
									mentions: [],
									channels: [],
								},
							],
							deleted: [],
						},
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'The required "roomId" query param is missing. [error-roomId-param-not-provided]',
						errorType: 'error-roomId-param-not-provided',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: 'The required "lastUpdate" query param is missing. [error-lastUpdate-param-not-provided]',
						errorType: 'error-lastUpdate-param-not-provided',
					},
				},
				'Example 3': {
					value: {
						success: false,
						error: 'The "lastUpdate" query parameter must be a valid date. [error-roomId-param-invalid]',
						errorType: 'error-roomId-param-invalid',
					},
				},
			},
		},
	},
	'chat.getMessage': {
		response: {
			'200': {
				Success: {
					value: {
						message: {
							_id: 'CeXwh5eBbdrtvnqG6',
							rid: 'agh2Sucgb54RQ8dDo',
							msg: 's',
							ts: '2018-10-05T13:48:21.616Z',
							u: {
								_id: 'KPkEYwKKBKZnEEPpt',
								username: 'marc.pow',
								name: 'Marc Pow',
							},
							_updatedAt: '2018-10-05T13:48:49.535Z',
							reactions: {
								':frowning2:': {
									usernames: ['marcos.defendi'],
								},
							},
							mentions: [],
							channels: [],
							starred: {
								_id: 'KPkEYwKKBKZnEEPpt',
							},
						},
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
						error: 'The "msgId" query parameter must be provided.',
					},
				},
			},
		},
	},
	'chat.postMessage': {
		response: {
			'200': {
				Example: {
					value: {
						ts: 1481748965123,
						channel: 'general',
						message: {
							alias: '',
							msg: 'This is a test!',
							parseUrls: true,
							groupable: false,
							ts: '2016-12-14T20:56:05.117Z',
							u: {
								_id: 'y65tAmHs93aDChMWu',
								username: 'graywolf336',
							},
							rid: 'GENERAL',
							_updatedAt: '2016-12-14T20:56:05.119Z',
							_id: 'jC9chsFddTvsbFQG7',
						},
						success: true,
					},
				},
			},
			'400': {
				'Missing or invalid room ID': {
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
					alias: 'Gruggy',
					avatar: 'http://res.guggy.com/logo_128.png',
					channel: '#general',
					emoji: ':smirk:',
					roomId: 'Xnb2kLD2Pnhdwe3RH',
					text: 'Sample message',
					attachments: [
						{
							audio_url: 'http://www.w3schools.com/tags/horse.mp3',
							author_icon: 'https://avatars.githubusercontent.com/u/850391?v=3',
							author_link: 'https://rocket.chat/',
							author_name: 'Bradley Hilton',
							collapsed: false,
							color: '#ff0000',
							fields: [
								{
									short: true,
									title: 'Test',
									value: 'Testing out something or other',
								},
								{
									short: true,
									title: 'Another Test',
									value: '[Link](https://google.com/) something and this and that.',
								},
							],
							image_url: 'http://res.guggy.com/logo_128.png',
							message_link: 'https://google.com',
							text: 'Yay for gruggy!',
							thumb_url: 'http://res.guggy.com/logo_128.png',
							title: 'Attachment Example',
							title_link: 'https://youtube.com',
							title_link_download: true,
							ts: '2016-12-09T16:53:06.761Z',
							video_url: 'http://www.w3schools.com/tags/movie.mp4',
						},
					],
				},
			},
		},
	},
	'chat.search': {
		response: {
			'200': {
				'Example 1': {
					value: {
						messages: [
							{
								_id: 'px9KLW9G2SfD5DKFt',
								rid: 'GENERAL',
								msg: 'this is a test',
								ts: '2018-03-27T14:44:00.549Z',
								u: {
									_id: 'RtMDEYc28fQ5aHpf4',
									username: 'marc.dev',
									name: 'Marc Dev',
								},
								mentions: [],
								channels: [],
								_updatedAt: '2018-03-27T14:44:00.550Z',
								score: 0.5833333333333334,
							},
						],
						success: true,
					},
				},
			},
			'400': {
				'Missing roomId': {
					value: {
						success: false,
						error: 'The required "roomId" query param is missing. [error-roomId-param-not-provided]',
						errorType: 'error-roomId-param-not-provided',
					},
				},
				'Missing searchText': {
					value: {
						success: false,
						error: 'The required "searchText" query param is missing. [error-searchText-param-not-provided]',
						errorType: 'error-searchText-param-not-provided',
					},
				},
			},
		},
	},
	'chat.sendMessage': {
		response: {
			'200': {
				'Example 1': {
					value: {
						message: {
							rid: 'GENERAL',
							msg: '123456789',
							ts: '2018-03-01T18:02:26.825Z',
							u: {
								_id: 'i5FdM4ssFgAcQP62k',
								username: 'rocket.cat',
								name: 'test',
							},
							unread: true,
							mentions: [],
							channels: [],
							_updatedAt: '2018-03-01T18:02:26.828Z',
							_id: 'LnCSJxxNkCy6K9X8X',
						},
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'The "message" parameter must be provided. [error-invalid-params]',
						errorType: 'error-invalid-params',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: "The 'rid' property on the message object is missing.",
					},
				},
				'Example 3': {
					value: {
						success: false,
						error: 'error-invalid-room',
					},
				},
			},
		},
		body: {
			'Message with Attachments': {
				value: {
					message: {
						rid: 'Xnb2kLD2Pnhdwe3RH',
						msg: 'Sample message',
						alias: 'Gruggy',
						emoji: ':smirk:',
						avatar: 'http://res.guggy.com/logo_128.png',
						attachments: [
							{
								color: '#ff0000',
								text: 'Yay for gruggy!',
								ts: '2016-12-09T16:53:06.761Z',
								thumb_url: 'http://res.guggy.com/logo_128.png',
								message_link: 'https://google.com',
								collapsed: false,
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
										value: '[Link](https://google.com/) something and this and that.',
									},
								],
							},
						],
					},
				},
			},
			'Message with Blocks': {
				value: {
					message: {
						rid: 'GENERAL',
						blocks: [
							{
								type: 'section',
								text: {
									type: 'mrkdwn',
									text: '*Text example* Normal message `code` here',
								},
							},
							{
								type: 'divider',
							},
							{
								type: 'section',
								fields: [
									{
										type: 'mrkdwn',
										text: '*Field 1*',
									},
									{
										type: 'mrkdwn',
										text: 'Field 2',
									},
								],
							},
						],
					},
				},
			},
			'Message with PreviewURLs': {
				value: {
					message: {
						rid: '64f0f82c2c26843a68c1f7ba',
						msg: 'This is a list of links! https://google.com https://hola.org/ https://www.usepayday.com/ https://www.getbumpa.com/ https://www.atlassian.com/software/jira http://localhost:3000/',
					},
					previewUrls: [
						'https://google.com',
						'http://localhost:3000/',
						'https://hola.org/',
						'https://www.usepayday.com/',
						'https://www.getbumpa.com/',
						'https://www.atlassian.com/software/jira',
					],
				},
			},
		},
	},
	'chat.ignoreUser': {
		response: {
			'400': {
				'Missing RoomId': {
					value: {
						success: false,
						error: 'The required "rid" param is missing. [error-room-id-param-not-provided]',
						errorType: 'error-room-id-param-not-provided',
					},
				},
				'Missing UserId': {
					value: {
						success: false,
						error: 'The required "userId" param is missing. [error-user-id-param-not-provided]',
						errorType: 'error-user-id-param-not-provided',
					},
				},
				'Invalid room or user ID': {
					value: {
						success: false,
						error: 'Invalid subscription [error-invalid-subscription]',
						errorType: 'error-invalid-subscription',
						details: {
							method: 'ignoreUser',
						},
					},
				},
			},
		},
	},
	'chat.getDeletedMessages': {
		response: {
			'200': {
				'Example 1': {
					value: {
						messages: [
							{
								_id: 'wKBW2YwrPahpag4zA',
							},
							{
								_id: 'SJXYBbageAo8bo7rX',
							},
							{
								_id: 'jEnjsxuoDJamGjbH2',
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
						error: '[The required "roomId" query param is missing.]',
						errorType: 'The required "roomId" query param is missing.',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: '[The required "since" query param is missing.]',
						errorType: 'The required "since" query param is missing.',
					},
				},
			},
		},
	},
	'chat.getPinnedMessages': {
		response: {
			'200': {
				'Example 1': {
					value: {
						messages: [
							{
								_id: 'ycHhPqyoN2BZHt3Ag',
								rid: '6GFJ3tbmHiyHbahmC',
								msg: 'ekaara',
								ts: '2023-02-25T16:08:30.000Z',
								u: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'roxie',
									name: 'test test',
								},
								_updatedAt: '2023-10-16T23:30:58.917Z',
								urls: [],
								mentions: [],
								channels: [],
								md: [
									{
										type: 'PARAGRAPH',
										value: [
											{
												type: 'PLAIN_TEXT',
												value: 'ekaara',
											},
										],
									},
								],
								pinned: true,
								pinnedAt: '2023-10-16T23:30:58.917Z',
								pinnedBy: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'roxie',
								},
							},
							{
								_id: 'Ay9jYg48gzjfpy7pk',
								rid: '6GFJ3tbmHiyHbahmC',
								msg: 'wassup',
								ts: '2023-10-05T19:10:10.055Z',
								u: {
									_id: '5fRTXMt7DMJbpPJfh',
									username: 'test.john',
									name: 'Testtest',
								},
								_updatedAt: '2023-10-16T23:30:42.393Z',
								urls: [],
								mentions: [],
								channels: [],
								md: [
									{
										type: 'PARAGRAPH',
										value: [
											{
												type: 'PLAIN_TEXT',
												value: 'wassup',
											},
										],
									},
								],
								pinned: true,
								pinnedAt: '2023-10-16T23:30:42.393Z',
								pinnedBy: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'roxie',
								},
							},
							{
								_id: 'NZieMNQDEdMDmLLip',
								rid: '6GFJ3tbmHiyHbahmC',
								msg: 'hola',
								ts: '2023-10-05T20:30:51.052Z',
								u: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'roxie',
									name: 'test test',
								},
								_updatedAt: '2023-10-16T22:57:27.362Z',
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
								reactions: {
									':smile:': {
										usernames: ['test.test'],
									},
								},
								starred: [],
								pinned: true,
								pinnedAt: '2023-10-05T20:59:44.433Z',
								pinnedBy: {
									_id: '5fRTXMt7DMJbpPJfh',
									username: 'test.test',
								},
								replies: ['rbAXPnMktTFbNpwtJ'],
								tcount: 2,
								tlm: '2023-10-16T22:57:27.158Z',
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
						error: 'The required "roomId" query param is missing. [error-roomId-param-not-provided]',
						errorType: 'error-roomId-param-not-provided',
					},
				},
				'Incorrect room ID': {
					value: {
						success: false,
						error: 'Not allowed [error-not-allowed]',
						errorType: 'error-not-allowed',
					},
				},
			},
		},
	},
	'chat.getThreadsList': {
		response: {
			'200': {
				'Example 1': {
					value: {
						threads: [
							{
								_id: 'NZieMNQDEdMDmLLip',
								rid: '6GFJ3tbmHiyHbahmC',
								msg: 'hola',
								ts: '2023-10-05T20:30:51.052Z',
								u: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'roxie',
									name: 'test test',
								},
								_updatedAt: '2023-10-16T22:57:27.362Z',
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
								reactions: {
									':smile:': {
										usernames: ['test.test'],
									},
								},
								starred: [],
								pinned: true,
								pinnedAt: '2023-10-05T20:59:44.433Z',
								pinnedBy: {
									_id: '5fRTXMt7DMJbpPJfh',
									username: 'test.test',
								},
								replies: ['rbAXPnMktTFbNpwtJ'],
								tcount: 2,
								tlm: '2023-10-16T22:57:27.158Z',
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
	'chat.syncThreadsList': {
		response: {
			'200': {
				Example: {
					value: {
						threads: {
							update: [
								{
									_id: 'J8Sqi5zPw62WgE4Md',
									rid: 'GENERAL',
									msg: 'test1',
									ts: '2019-04-16T18:16:00.614Z',
									u: {
										_id: 'rocketchat.internal.admin.test',
										username: 'rocketchat.internal.admin.test',
										name: 'RocketChat Internal Admin Test',
									},
									_updatedAt: '2019-04-16T18:17:09.749Z',
									mentions: [],
									channels: [],
									replies: ['rocketchat.internal.admin.test'],
									tcount: 1,
									tlm: '2019-04-16T18:17:09.672Z',
								},
								{
									_id: 'hbs2ZAjHH2JXrP7C7',
									rid: 'GENERAL',
									msg: 'another test',
									ts: '2019-04-16T18:13:20.403Z',
									u: {
										_id: 'rocketchat.internal.admin.test',
										username: 'rocketchat.internal.admin.test',
										name: 'RocketChat Internal Admin Test',
									},
									_updatedAt: '2019-04-16T18:30:46.722Z',
									mentions: [],
									channels: [],
									replies: ['rocketchat.internal.admin.test'],
									tcount: 1,
									tlm: '2019-04-16T18:30:46.615Z',
								},
							],
							remove: [
								{
									_id: 'GXwCSs4cx6456WBJk',
									rid: 'GENERAL',
									msg: 'test',
									ts: '2019-04-16T18:13:39.217Z',
									u: {
										_id: 'rocketchat.internal.admin.test',
										username: 'rocketchat.internal.admin.test',
										name: 'RocketChat Internal Admin Test',
									},
									_updatedAt: '2019-04-16T18:16:00.696Z',
									mentions: [],
									channels: [],
									replies: ['rocketchat.internal.admin.test'],
									tcount: 1,
									tlm: '2019-04-16T18:16:00.614Z',
									_deletedAt: '2019-04-16T18:16:13.508Z',
									__collection__: 'message',
								},
							],
						},
						success: true,
					},
				},
			},
			'400': {
				'Missing rid': {
					value: {
						success: false,
						error: 'The required "rid" query param is missing. [error-room-id-param-not-provided]',
						errorType: 'error-room-id-param-not-provided',
					},
				},
				'Missing updatedSince': {
					value: {
						success: false,
						error: 'The required param "updatedSince" is missing. [error-updatedSince-param-invalid]',
						errorType: 'error-updatedSince-param-invalid',
					},
				},
				'Invalid Date': {
					value: {
						success: false,
						error: 'The "updatedSince" query parameter must be a valid date. [error-updatedSince-param-invalid]',
						errorType: 'error-updatedSince-param-invalid',
					},
				},
			},
		},
	},
	'chat.getThreadMessages': {
		response: {
			'200': {
				Example: {
					value: {
						messages: [
							{
								_id: 'gcGai9bRREqokjyPc',
								rid: 'GENERAL',
								msg: 'Test',
								ts: '2019-04-08T13:15:52.017Z',
								u: {
									_id: 'p4a8YxvLQEHmiBKTS',
									username: 'marc.dev',
									name: 'Marc Dev',
								},
								_updatedAt: '2019-04-08T14:40:27.789Z',
								mentions: [],
								channels: [],
								replies: ['p4a8YxvLQEHmiBKTS'],
								tcount: 5,
								tlm: '2019-04-08T14:40:27.724Z',
							},
							{
								_id: 'GfhiiJjcjKFyYMuMY',
								rid: 'GENERAL',
								tmid: 'gcGai9bRREqokjyPc',
								msg: 'This is a test!',
								ts: '2019-04-08T13:20:22.238Z',
								u: {
									_id: 'p4a8YxvLQEHmiBKTS',
									username: 'marc.dev',
									name: 'Marc Dev',
								},
								_updatedAt: '2019-04-08T13:20:22.265Z',
								mentions: [],
								channels: [],
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
				'Missing parameter': {
					value: {
						success: false,
						error: 'The required "tmid" query param is missing. [error-invalid-params]',
						errorType: 'error-invalid-params',
					},
				},
				'Invalid Message': {
					value: {
						success: false,
						error: 'Invalid Message [error-invalid-message]',
						errorType: 'error-invalid-message',
					},
				},
			},
		},
	},
	'chat.syncThreadMessages': {
		response: {
			'200': {
				Example: {
					value: {
						messages: {
							update: [
								{
									_id: '8BciMkvotHLpmpDEG',
									rid: 'GENERAL',
									tmid: 'hbs2ZAjHH2JXrP7C7',
									msg: 'test',
									ts: '2019-04-16T18:30:46.615Z',
									u: {
										_id: 'rocketchat.internal.admin.test',
										username: 'rocketchat.internal.admin.test',
										name: 'RocketChat Internal Admin Test',
									},
									_updatedAt: '2019-04-16T18:30:46.669Z',
									mentions: [],
									channels: [],
								},
							],
							remove: [],
						},
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'The required "tmid" query param is missing. [error-invalid-params]',
						errorType: 'error-invalid-params',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: 'The required param "updatedSince" is missing. [error-updatedSince-param-invalid]',
						errorType: 'error-updatedSince-param-invalid',
					},
				},
			},
		},
	},
	'chat.getMentionedMessages': {
		response: {
			'200': {
				'Example 1': {
					value: {
						messages: [
							{
								_id: 'p93m92bPRudzoJ7oW',
								rid: '6GFJ3tbmHiyHbahmC',
								msg: '@test.john hello',
								ts: '2023-10-16T23:27:02.945Z',
								u: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'roxie',
									name: 'test test',
								},
								_updatedAt: '2023-10-16T23:27:03.071Z',
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
											{
												type: 'PLAIN_TEXT',
												value: ' hello',
											},
										],
									},
								],
							},
							{
								_id: '4Q8nmha5doDHus5YR',
								rid: '6GFJ3tbmHiyHbahmC',
								msg: '@test.john',
								ts: '2023-10-16T23:26:38.611Z',
								u: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'roxie',
									name: 'test test',
								},
								_updatedAt: '2023-10-16T23:26:38.728Z',
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
						error: 'The required "roomId" query param is missing. [error-invalid-params]',
						errorType: 'error-invalid-params',
					},
				},
				'Incorrect room ID': {
					value: {
						success: false,
						error: 'error-not-allowed',
					},
				},
			},
		},
	},
	'chat.getStarredMessages': {
		response: {
			'200': {
				'Example 1': {
					value: {
						messages: [
							{
								_id: '652dc4dda2f73c7460e18df8',
								t: 'discussion-created',
								rid: '6GFJ3tbmHiyHbahmC',
								ts: '2023-10-16T23:18:53.926Z',
								msg: 'test discuss',
								u: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'roxie',
									name: 'test test',
								},
								groupable: false,
								drid: '652dc4dda2f73c7460e18df6',
								_updatedAt: '2023-10-17T12:51:07.826Z',
								dcount: 3,
								dlm: '2023-10-16T23:25:58.375Z',
								starred: [
									{
										_id: '5fRTXMt7DMJbpPJfh',
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
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'The required "roomId" query param is missing. [error-invalid-params]',
						errorType: 'error-invalid-params',
					},
				},
				'Incorrect room ID': {
					value: {
						success: false,
						error: 'error-not-allowed',
					},
				},
			},
		},
	},
	'chat.getDiscussions': {
		response: {
			'200': {
				'Example 1': {
					value: {
						messages: [
							{
								_id: '652dc4dda2f73c7460e18df8',
								t: 'discussion-created',
								rid: '6GFJ3tbmHiyHbahmC',
								ts: '2023-10-16T23:18:53.926Z',
								msg: 'test discuss',
								u: {
									_id: 'rbAXPnMktTFbNpwtJ',
									username: 'roxie',
									name: 'test test',
								},
								groupable: false,
								drid: '652dc4dda2f73c7460e18df6',
								_updatedAt: '2023-10-16T23:19:18.992Z',
								dcount: 2,
								dlm: '2023-10-16T23:19:18.748Z',
							},
						],
						count: 1,
						offset: 0,
						total: 1,
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'The required "roomId" query param is missing. [error-invalid-params]',
						errorType: 'error-invalid-params',
					},
				},
				'Incorrect room ID': {
					value: {
						success: false,
						error: 'error-not-allowed',
					},
				},
			},
		},
	},
	'chat.getURLPreview': {
		response: {
			'200': {
				'Example 1': {
					value: {
						urlPreview: {
							url: 'http://www.w3schools.com/tags/movie.mp4',
							meta: {},
							headers: {
								contentLength: '318465',
								contentType: 'video/mp4',
							},
							ignoreParse: true,
						},
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: "must have required property 'url' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: "must have required property 'roomId' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
	},
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
