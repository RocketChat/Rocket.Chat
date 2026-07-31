import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the users endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const usersExamples = {
	'users.update': {
		response: {
			'200': {
				Example: {
					value: {
						user: {
							_id: 'PMGoujw82oETsaw9828rQh2oXM',
							createdAt: '2026-02-24T23:22:54.986Z',
							username: 'agent2',
							emails: [
								{
									address: 'agent2@agent.com',
									verified: false,
								},
							],
							type: 'user',
							roles: ['user', 'livechat-agent'],
							status: 'offline',
							active: true,
							inactiveReason: null,
							name: 'Agent 2 Updated',
							_updatedAt: '2026-02-25T14:25:59.157Z',
							__rooms: ['GENERAL'],
							requirePasswordChange: false,
							settings: {},
							statusText: '',
							livechatStatusSystemModified: false,
							statusLivechat: 'not-available',
						},
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'Editing user is not allowed [error-action-not-allowed]',
						errorType: 'error-action-not-allowed',
						details: {
							method: 'insertOrUpdateUser',
							action: 'Editing_user',
						},
					},
				},
			},
		},
	},
	'users.updateOwnBasicInfo': {
		response: {
			'200': {
				'Success Example': {
					value: {
						user: {
							_id: 'rbAXPnMktTFbNpwtJ',
							createdAt: '2023-02-20T13:42:07.119Z',
							services: {
								password: {
									bcrypt: '$2b$10$E9ppW3T2itbMEcDvOdWBR.NXiW3YbifRHwBhjVkt26r1XS8yNhh6u',
								},
								email2fa: {
									enabled: true,
									changedAt: '2023-02-20T13:42:07.118Z',
								},
								resume: {
									loginTokens: [
										{
											when: '2023-09-16T09:27:10.959Z',
											hashedToken: 'A1jmsVCHHH2SkXHrEJDfumN+VtUP3tcuJ/OGseGrRbA=',
											twoFactorAuthorizedHash: '3067196228a830eacd6181a6977fe86a',
											twoFactorAuthorizedUntil: '2023-09-19T16:40:58.767Z',
										},
										{
											when: '2023-09-18T10:37:58.218Z',
											hashedToken: 'RLdxvu9dDnk6QRwFdaK3my1AoPeGaR5lTkK+zEhTuPk=',
										},
										{
											when: '2023-09-18T10:41:25.814Z',
											hashedToken: 'zWZ8wW9PNlVuI2Q65vK/9vytaONk1BXxaWcNld4qvEc=',
										},
									],
								},
								email: {
									verificationTokens: [
										{
											token: 'lHq_4L8Orgxu2p5NhfVb0V9kA7kO1VaBXA5GmaJiuX3',
											address: 'test@test.com',
											when: '2023-05-23T18:47:07.142Z',
										},
									],
								},
								totp: {
									enabled: false,
								},
								passwordHistory: [
									'$2b$10$n1.FV8S2mxz7GzXA392V5OaDa5X0WR1DQ4eGGFKI/wpdhS9sVIC6S',
									'$2b$10$4I68O5mlR.C8dRhtZ4Mj6us6EMwRHNIUqEWQe/nOhISs4e8RtOliW',
									'$2b$10$AU9Ncfd8bO5TpE.5iLMjyujdd6RVJaoeKckVqo3MMO9Ngc3oyMAs2',
								],
							},
							username: 'roxie',
							emails: [
								{
									address: 'test@test.com',
									verified: true,
								},
							],
							type: 'user',
							status: 'offline',
							active: true,
							_updatedAt: '2023-09-19T16:10:58.873Z',
							__rooms: ['GENERAL', 'siyr2oWQJBjQjhLwr', '6GFJ3tbmHiyHbahmC', '64f0f82c2c26843a68c1f7ba'],
							roles: ['user', 'admin', 'livechat-agent', 'livechat-manager'],
							name: 'test test',
							settings: {
								preferences: {
									themeAppearence: 'light',
								},
								profile: {},
							},
							lastLogin: '2023-09-19T16:00:19.657Z',
							statusConnection: 'away',
							utcOffset: 1,
							banners: {
								'versionUpdate-6_0_0': {
									id: 'versionUpdate-6_0_0',
									priority: 10,
									title: 'Update_your_RocketChat',
									text: 'New_version_available_(s)',
									textArguments: ['6.0.0'],
									link: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/6.0.0',
									modifiers: [],
									read: true,
								},
								'versionUpdate-6_2_8': {
									id: 'versionUpdate-6_2_8',
									priority: 10,
									title: 'Update_your_RocketChat',
									text: 'New_version_available_(s)',
									textArguments: ['6.2.8'],
									link: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/6.2.8',
									modifiers: [],
								},
							},
							statusDefault: 'offline',
							statusText: 'On a vacation',
							operator: true,
							livechatStatusSystemModified: false,
							statusLivechat: 'available',
							livechatCount: 8,
							livechat: {
								maxNumberSimultaneousChat: '',
							},
							bio: 'Engineer',
							nickname: '',
						},
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: "must have required property 'data' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
	},
	'users.setPreferences': {
		response: {
			'200': {
				'Success Example': {
					value: {
						preferences: {
							enableAutoAway: true,
							idleTimeLimit: 300,
							desktopNotificationRequireInteraction: false,
							desktopNotifications: 'default',
							pushNotifications: 'all',
							unreadAlert: false,
							useEmojis: true,
							convertAsciiEmoji: true,
							autoImageLoad: true,
							saveMobileBandwidth: true,
							collapseMediaByDefault: false,
							hideUsernames: false,
							hideRoles: false,
							hideFlexTab: false,
							displayAvatars: true,
							sidebarGroupByType: true,
							sidebarViewMode: 'condensed',
							sidebarDisplayAvatar: true,
							sidebarShowUnread: true,
							sidebarSortby: 'activity',
							showMessageInMainThread: false,
							sidebarShowFavorites: true,
							sendOnEnter: 'normal',
							messageViewMode: 0,
							emailNotificationMode: 'mentions',
							newRoomNotification: 'door',
							newMessageNotification: 'chime',
							muteFocusedConversations: true,
							notificationsSoundVolume: 100,
							enableMessageParserEarlyAdoption: false,
							mobileNotifications: 'default',
							desktopNotificationDuration: 0,
							dontAskAgainList: [],
							highlights: [],
							language: 'en',
						},
					},
				},
			},
			'400': {
				'Invalid Parameter': {
					value: {
						success: false,
						error: "must have required property 'data' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					userId: 'rbAXPnMktTFbNpwtJ',
					data: {
						language: 'en',
						newRoomNotification: 'door',
						newMessageNotification: 'chime',
						muteFocusedConversations: true,
						clockMode: 0,
						useEmojis: true,
						convertAsciiEmoji: true,
						saveMobileBandwidth: true,
						collapseMediaByDefault: true,
						autoImageLoad: true,
						emailNotificationMode: 'mentions',
						unreadAlert: true,
						notificationsSoundVolume: 0,
						desktopNotifications: 'mentions',
						pushNotifications: 'mentions',
						enableAutoAway: true,
						highlights: ['["deploy", "docker"]'],
						messageViewMode: 0,
						hideUsernames: true,
						hideRoles: true,
						displayAvatars: true,
						hideFlexTab: true,
						sendOnEnter: 'string',
						idleTimeLimit: 300,
						sidebarShowFavorites: true,
						sidebarShowUnread: true,
						sidebarSortby: 'string',
						sidebarViewMode: 'string',
						sidebarDisplayAvatar: true,
						sidebarGroupByType: true,
						dontAskAgainList: [{}],
						notifyCalendarEvents: false,
						themeAppearence: 'auto',
					},
				},
			},
		},
	},
	'users.setAvatar': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'Missing Content-Type',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					avatarUrl: 'http://domain.tld/to/my/own/avatar.jpg',
				},
			},
		},
	},
	'users.create': {
		response: {
			'200': {
				'Success Example': {
					value: {
						user: {
							_id: 'BsNr28znDkG8aeo7W',
							createdAt: '2016-09-13T14:57:56.037Z',
							services: {
								password: {
									bcrypt: '$2a$i7BFS55uFYRf5TE4ErSUH8HymMNAbpMAvsOcl2C',
								},
							},
							username: 'uniqueusername',
							emails: [
								{
									address: 'email@user.tld',
									verified: false,
								},
							],
							type: 'user',
							status: 'offline',
							active: true,
							roles: ['user'],
							_updatedAt: '2016-09-13T14:57:56.175Z',
							name: 'name',
							settings: {},
						},
						success: true,
					},
				},
			},
			'400': {
				'Permission Error': {
					value: {
						success: false,
						error: 'Adding user is not allowed [error-action-not-allowed]',
						errorType: 'error-action-not-allowed',
						details: {
							method: 'insertOrUpdateUser',
							action: 'Adding_user',
						},
					},
				},
			},
		},
	},
	'users.delete': {
		response: {
			'400': {
				Example: {
					value: {
						success: false,
						error: 'The required "userId" or "username" param was not provided [error-user-param-not-provided]',
						errorType: 'error-user-param-not-provided',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					userId: 'BsNr28znDkG8aeo7W',
					confirmRelinquish: true,
				},
			},
		},
	},
	'users.deleteOwnAccount': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'Body parameter "password" is required.',
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					password: '8f0e2f76e22b43e2855189877e7dc1e1e7d98c226c95db247cd1d547928334a9',
					confirmRelinquish: false,
				},
			},
		},
	},
	'users.setActiveStatus': {
		response: {
			'200': {
				'Success Example': {
					value: {
						user: {
							_id: 'jJNyu4BQFqdgEcqnR',
							active: false,
						},
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: "must have required property 'activeStatus'\n[invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
	},
	'users.deactivateIdle': {
		response: {
			'200': {
				'Success Example': {
					value: {
						count: 1,
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: "must have required property 'daysIdle' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					daysIdle: 2,
					role: 'user',
				},
			},
		},
	},
	'users.info': {
		response: {
			'200': {
				'Success Example': {
					value: {
						user: {
							_id: '5fRTXMt7DMJbpPJfh',
							createdAt: '2023-07-10T16:44:58.548Z',
							services: {
								password: true,
								email2fa: {
									enabled: true,
									changedAt: '2023-07-10T16:44:58.546Z',
								},
								resume: {
									loginTokens: [
										{
											when: '2023-10-05T18:55:02.996Z',
											hashedToken: '...',
										},
										{
											when: '2023-10-05T19:09:30.415Z',
											hashedToken: '....',
										},
										{
											when: '2023-10-10T23:40:46.098Z',
											hashedToken: '....',
										},
									],
								},
							},
							username: 'test.john',
							emails: [
								{
									address: 'test.john@test.com',
									verified: true,
								},
							],
							type: 'user',
							status: 'offline',
							active: true,
							roles: ['user', 'admin'],
							name: 'Test John',
							requirePasswordChange: false,
							lastLogin: '2023-10-10T23:40:46.093Z',
							statusConnection: 'offline',
							utcOffset: 1,
							statusText: '',
							avatarETag: 'GFoEi6wv3uAxnzDcD',
							nickname: 'tesuser2',
							freeSwitchExtension: '1234',
							canViewAllInfo: true,
							rooms: [
								{
									_id: '651667dda2f73c7460e18cce',
									unread: 1,
									rid: 'JKa7R9zu2DinBhBN9',
									name: 'Livestream',
									t: 'c',
								},
								{
									_id: '64ac358a79f5c6e276cfe718',
									unread: 0,
									rid: 'GENERAL',
									name: 'general',
									t: 'c',
								},
								{
									_id: '64aca0e5aa5ad4273bfbfdb8',
									unread: 0,
									rid: '6GFJ3tbmHiyHbahmC',
									name: 'test-audit',
									t: 'c',
								},
								{
									_id: '64adb09baa5ad4273bfc0cc0',
									unread: 0,
									rid: '64adb09baa5ad4273bfc0cbf',
									name: 'test-room',
									t: 'c',
									roles: ['owner'],
								},
								{
									_id: '64fd791c2c26843a68c1f7e5',
									unread: 0,
									rid: 'siyr2oWQJBjQjhLwr',
									name: 'try',
									t: 'c',
									roles: [],
								},
								{
									_id: 'g5xHGWAGLA7vZXwW8',
									rid: '5fRTXMt7DMJbpPJfhrbAXPnMktTFbNpwtJ',
									name: 'roxie',
									t: 'd',
									unread: 2,
								},
								{
									_id: '64ef8a982c26843a68c1f7ae',
									unread: 0,
									rid: 'WDuJLFkjwk6L7LdFC',
									name: 'new',
									t: 'p',
									roles: ['leader'],
								},
							],
						},
						success: true,
					},
				},
			},
			'400': {
				'Missing / invalid lookup': {
					value: {
						success: false,
						error:
							"must have required property 'userId'\n must have required property 'username'\n must have required property 'importId'\n must match a schema in anyOf [invalid-params]",
						errorType: 'invalid-params',
					},
				},
				'User not found': {
					value: {
						success: false,
						error: 'User not found.',
					},
				},
			},
		},
	},
	'users.listByStatus': {
		response: {
			'200': {
				Success: {
					value: {
						users: [
							{
								_id: 'W7MRNgkYLXKKAGNvW',
								username: 'agent1',
								emails: [
									{
										address: 'agent1@agent.com',
										verified: false,
									},
								],
								type: 'user',
								roles: ['user', 'livechat-agent'],
								status: 'offline',
								active: true,
								name: 'Agent 1',
								lastLogin: '2024-04-24T17:47:50.485Z',
							},
							{
								_id: 'Tf44Q5AaYDehtJLzA',
								username: 'agent2',
								emails: [
									{
										address: 'agent2@agent.com',
										verified: false,
									},
								],
								type: 'user',
								roles: ['user', 'livechat-agent'],
								status: 'offline',
								active: true,
								name: 'Agent 2',
								lastLogin: '2024-04-29T16:38:56.809Z',
							},
							{
								_id: 'JwATAtGzrzHYHCXFy',
								username: 'agent3',
								emails: [
									{
										address: 'agent3@agent.com',
										verified: false,
									},
								],
								type: 'user',
								roles: ['user', 'livechat-agent'],
								status: 'online',
								active: true,
								name: 'Agent3',
								lastLogin: '2024-04-30T16:59:21.879Z',
							},
							{
								_id: 'u6C62WdHKNk5X8Rzr',
								username: 'guy',
								emails: [
									{
										address: 'guy@guy.com',
										verified: false,
									},
								],
								type: 'user',
								roles: ['user'],
								status: 'offline',
								active: true,
								name: 'guy',
							},
							{
								_id: 'rocket.cat',
								name: 'Rocket.Cat',
								username: 'rocket.cat',
								status: 'online',
								active: true,
								type: 'bot',
								roles: ['bot'],
								avatarETag: 'MEhPLkenJqs3jTJP5',
							},
						],
						count: 5,
						offset: 0,
						total: 5,
						success: true,
					},
				},
			},
		},
	},
	'users.sendWelcomeEmail': {
		response: {
			'400': {
				'SMPT not configured': {
					value: {
						success: false,
						error: 'SMTP is not configured [error-email-send-failed]',
						errorType: 'error-email-send-failed',
						details: {
							method: 'sendWelcomeEmail',
						},
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					email: 'test@email.com',
				},
			},
		},
	},
	'users.register': {
		response: {
			'200': {
				'Success Example': {
					value: {
						user: {
							_id: 'nSYqWzZ4GsKTX4dyK',
							type: 'user',
							status: 'offline',
							active: true,
							name: 'Example User',
							utcOffset: 0,
							username: 'example',
						},
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: "must have required property 'pass' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
	},
	'users.resetAvatar': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'The required "userId" or "username" param was not provided [error-user-param-not-provided]',
						errorType: 'error-user-param-not-provided',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: 'Reset avatar is not allowed [error-not-allowed]',
						errorType: 'error-not-allowed',
						details: {
							method: 'users.resetAvatar',
						},
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					userId: 'BsNr28znDkG8aeo7W',
				},
			},
		},
	},
	'users.createToken': {
		response: {
			'200': {
				'Token created': {
					value: {
						data: {
							userId: 'BsNr28znDkG8aeo7W',
							authToken: '2jdk99wuSjXPO201XlAks9sjDjAhSJmskAKW301mSuj9Sk',
						},
						success: true,
					},
				},
			},
			'400': {
				'Invalid user': {
					value: {
						success: false,
						error: 'The required "userId" or "username" param was not provided [error-user-param-not-provided]',
						errorType: 'error-user-param-not-provided',
					},
				},
				'Invalid secret': {
					value: {
						success: false,
						error: 'Not authorized [error-not-authorized]',
						errorType: 'error-not-authorized',
					},
				},
				'Missing permission': {
					value: {
						success: false,
						error: 'Not authorized [error-not-authorized]',
						errorType: 'error-not-authorized',
					},
				},
			},
		},
		body: {
			'Create token for a user': {
				value: {
					userId: 'BsNr28znDkG8aeo7W',
					secret: 'pass123',
				},
			},
		},
	},
	'users.getAvatarSuggestion': {
		response: {
			'200': {
				'Example 1': {
					value: {
						suggestions: {
							gravatar: {
								service: 'gravatar',
								url: 'https://s.gravatar.com/avatar/6da0187ff0de738a86a62b0e9e34ffbf?default=404&size=200',
								blob: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAgAElEQVR42my9y49k2ZHm9zM75153j8jIjMysyqxKVrGKZJNsstjvbrTUg1bPQAIaGgkYCCMtpIWglTba6g+YP0CA/gBBO61moYUEYQRpMNBooWlyptmcLrJZZFXWu/L9iqe733uOmRZ27nWP4hSQiKjMCPfr955j9tn3fWZHfvCX/8iTLhA6/vCHP+TenWOuHR5Rxy0',
								contentType: 'image/png',
							},
						},
						success: true,
					},
				},
			},
		},
	},
	'users.getPreferences': {
		response: {
			'200': {
				'Success Example': {
					value: {
						preferences: {
							newRoomNotification: 'door',
							newMessageNotification: 'chime',
							muteFocusedConversations: true,
							useEmojis: true,
							convertAsciiEmoji: true,
							saveMobileBandwidth: true,
							collapseMediaByDefault: false,
							autoImageLoad: true,
							emailNotificationMode: 'all',
							roomsListExhibitionMode: 'category',
							unreadAlert: true,
							notificationsSoundVolume: 100,
							desktopNotifications: 'default',
							mobileNotifications: 'default',
							enableAutoAway: true,
							highlights: [],
							desktopNotificationDuration: 0,
							viewMode: 0,
							hideUsernames: false,
							hideRoles: false,
							hideAvatars: false,
							hideFlexTab: false,
							sendOnEnter: 'normal',
							roomCounterSidebar: false,
						},
						success: true,
					},
				},
			},
		},
	},
	'users.forgotPassword': {
		response: {
			'200': {
				'Success Example': {
					value: {
						status: 'success',
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: "The 'email' param is required",
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					email: 'email@rocket.cat',
				},
			},
		},
	},
	'users.getUsernameSuggestion': {
		response: {
			'200': {
				'Example 1': {
					value: {
						result: 'rocket.mic',
						success: true,
					},
				},
			},
		},
	},
	'users.checkUsernameAvailability': {
		response: {
			'200': {
				'Example 1': {
					value: {
						result: true,
						success: true,
					},
				},
				'Example 2': {
					value: {
						result: false,
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: "must have required property 'username' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: "system is blocked and can't be used! [error-blocked-username]",
						errorType: 'error-blocked-username',
						details: {
							method: 'checkUsernameAvailability',
							field: 'system',
						},
					},
				},
			},
		},
	},
	'users.generatePersonalAccessToken': {
		response: {
			'200': {
				'Success Example': {
					value: {
						token: '2jdk99wuSjXPO201XlAks9sjDjAhSJmskAKW301mSuj9Sk',
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'TOTP Required [totp-required]',
						errorType: 'totp-required',
						details: {
							method: 'password',
							codeGenerated: false,
							availableMethods: [],
						},
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: "The 'tokenName' param is required",
					},
				},
				'Example 3': {
					value: {
						success: false,
						error: 'Not Authorized [not-authorized]',
						errorType: 'not-authorized',
						details: {
							method: 'personalAccessTokens:generateToken',
						},
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					tokenName: 'mypersonaltoken',
					bypassTwoFactor: false,
				},
			},
		},
	},
	'users.regeneratePersonalAccessToken': {
		response: {
			'200': {
				'Success Example': {
					value: {
						token: '2jdk99wuSjXPO201XlAks9sjDjAhSJmskAKW301mSuj9Sk',
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'TOTP Required [totp-required]',
						errorType: 'totp-required',
						details: {
							method: 'password',
							codeGenerated: false,
							availableMethods: [],
						},
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: "The 'tokenName' param is required",
					},
				},
				'Example 3': {
					value: {
						success: false,
						error: 'Not Authorized [not-authorized]',
						errorType: 'not-authorized',
						details: {
							method: 'personalAccessTokens:generateToken',
						},
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					tokenName: 'mypersonaltoken',
				},
			},
		},
	},
	'users.getPersonalAccessTokens': {
		response: {
			'200': {
				'Success Example': {
					value: {
						tokens: [
							{
								name: 'myToken',
								createdAt: '2018-08-01T17:17:48.068Z',
								lastTokenPart: 'R8Agh3',
							},
						],
						success: true,
					},
				},
			},
		},
	},
	'users.removePersonalAccessToken': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'TOTP Required [totp-required]',
						errorType: 'totp-required',
						details: {
							method: 'password',
							codeGenerated: false,
							availableMethods: [],
						},
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: "The 'tokenName' param is required",
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					tokenName: 'mytoken',
				},
			},
		},
	},
	'users.2fa.disableEmail': {
		response: {
			'400': {
				'TOTP Required': {
					value: {
						success: false,
						error: 'TOTP Required [totp-required]',
						errorType: 'totp-required',
						details: {
							method: 'password',
							codeGenerated: false,
							availableMethods: [],
						},
					},
				},
			},
		},
	},
	'users.2fa.sendEmailCode': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'emailOrUsername is required [error-parameter-required]',
						errorType: 'error-parameter-required',
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					emailOrUsername: 'test@email.com',
				},
			},
		},
	},
	'users.sendConfirmationEmail': {
		response: {
			'400': {
				'Missing parameter': {
					value: {
						success: false,
						error: "must have required property 'email' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					email: 'example@example.com',
				},
			},
		},
	},
	'users.presence': {
		response: {
			'200': {
				'Success Example': {
					value: {
						users: [
							{
								_id: 'rocket.cat',
								name: 'Rocket.Cat',
								username: 'rocket.cat',
								status: 'online',
								utcOffset: 0,
								statusText: 'In a call',
								statusSource: 'internal',
								avatarETag: '5BB9B5ny5DkKdrwkq',
							},
							{
								_id: 'rocketchat.internal.admin.test',
								name: 'RocketChat Internal Admin Test',
								username: 'rocketchat.internal.admin.test',
								status: 'online',
								utcOffset: -2,
								statusText: 'Focus time',
								statusSource: 'manual',
								statusExpiresAt: '2026-06-22T18:00:00.000Z',
								avatarETag: 'iEbEm4bTT327NJjXt',
							},
						],
						full: true,
						success: true,
					},
				},
			},
		},
	},
	'users.requestDataDownload': {
		response: {
			'200': {
				'Success Example': {
					value: {
						requested: false,
						exportOperation: {
							_id: 'uDSuaW7vGd9B7j8qD',
							createdAt: '2019-06-07T23:02:13.359Z',
							userId: 'hjwGZafNqExtFNmN7',
							roomList: [
								{
									roomId: 'GENERAL',
									roomName: 'general',
									userId: null,
									exportedCount: 8,
									status: 'completed',
									targetFile: 'general.html',
									type: 'c',
								},
							],
							status: 'uploading',
							exportPath: '/tmp/userData/hjwGZafNqExtFNmN7/partial',
							assetsPath: '/tmp/userData/hjwGZafNqExtFNmN7/partial/assets',
							fileList: [],
							generatedFile: '/tmp/zipFiles/hjwGZafNqExtFNmN7.zip',
							fullExport: false,
							_updatedAt: '2019-06-07T23:15:00.326Z',
						},
						success: true,
					},
				},
			},
		},
	},
	'users.logoutOtherClients': {
		response: {
			'200': {
				'Success Example': {
					value: {
						token: 'SnS70r0VkngGFrSbxVK-pdwFMEzhefcjQgdnXaPeAaq',
						tokenExpires: '2021-12-27T14:33:09.851Z',
						success: true,
					},
				},
			},
		},
	},
	'users.autocomplete': {
		response: {
			'200': {
				'Success Example': {
					value: {
						items: [
							{
								_id: '6esQ6cpqSQYvoLTvC',
								username: 'Aaron.altamirano',
								status: 'offline',
								name: 'Aaron Altamirano ',
								nickname: 'aaron.altamirano@rocket.chat',
							},
							{
								_id: 'AySWYsyzToxy3239z',
								username: 'Balazs.Nemethi',
								status: 'offline',
								name: 'Balázs Némethi',
							},
							{
								_id: 'gxcJTYapi5mPxuAme',
								username: 'Bruno.Solis',
								status: 'offline',
								name: 'Bruno Solis',
								avatarETag: 'ZAHMxLQ6bW426Knwm',
							},
							{
								_id: 'kvqbntLso8y2dEx7C',
								username: 'Ivan.Belousov',
								status: 'offline',
								name: 'Ivan',
							},
							{
								_id: 'AkFjhgJFHAhNK3e6o',
								status: 'offline',
								name: 'Karina Monarkh',
								username: 'Karina',
							},
							{
								_id: 'M3ajjGeyg8SfKXopd',
								username: 'Rucks_guest2',
								status: 'offline',
								name: 'Rucks_guest2',
								nickname: 'anonymous3',
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
						error: "must have required property 'selector' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
	},
	'users.resetE2EKey': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'TOTP Required [totp-required]',
						errorType: 'totp-required',
						details: {
							method: 'password',
							codeGenerated: false,
							availableMethods: [],
						},
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: 'Not allowed [error-not-allowed]',
						errorType: 'error-not-allowed',
					},
				},
				'Example 3': {
					value: {
						success: false,
						error: 'The required "userId" or "username" param provided does not match any users [error-invalid-user]',
						errorType: 'error-invalid-user',
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					userId: 'GonjPyg3gB3Z9ur9s',
				},
			},
		},
	},
	'users.resetTOTP': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'TOTP Required [totp-required]',
						errorType: 'totp-required',
						details: {
							method: 'password',
							codeGenerated: false,
							availableMethods: [],
						},
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: 'Not allowed [error-not-allowed]',
						errorType: 'error-not-allowed',
					},
				},
				'Example 3': {
					value: {
						success: false,
						error: 'The required "userId" or "username" param provided does not match any users [error-invalid-user]',
						errorType: 'error-invalid-user',
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					userId: 'GonjPyg3gB3Z9ur9s',
				},
			},
		},
	},
	'users.listTeams': {
		response: {
			'200': {
				'Success Example': {
					value: {
						teams: [
							{
								_id: '612b8ae982d286c3',
								name: 'documentation-team',
								type: 0,
								createdAt: '2021-08-29T13:26:01.750Z',
								createdBy: {
									_id: 'JxemcN9PDCdfzJe',
									username: 'renato.b',
								},
								_updatedAt: '2021-08-29T13:26:01.762Z',
								roomId: 'GwktYAajqw4RiWiBK',
								isOwner: true,
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
						error: "must have required property 'userId' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
	},
	'users.logout': {
		response: {
			'200': {
				'Success Example': {
					value: {
						message: 'User JxemcN9PDCdfzJeZr has been logged out!',
						success: true,
					},
				},
			},
		},
	},
	'users.getPresence': {
		response: {
			'200': {
				'Success Example': {
					value: {
						presence: 'offline',
						success: true,
					},
				},
			},
		},
	},
	'users.setStatus': {
		response: {
			'400': {
				'Missing status or message parameter': {
					value: {
						success: false,
						error: 'Match error: Failed Match.OneOf, Match.Maybe or Match.Optional validation',
					},
				},
				'Invalid expiresAt date': {
					value: {
						success: false,
						error: 'expiresAt must be a future date [error-invalid-date]',
						errorType: 'error-invalid-date',
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					message: 'My status update',
					status: 'online',
					expiresAt: '2026-06-22T18:00:00.000Z',
					userId: 'zXuq7SvPKYbzYmfpo',
					username: 'bob',
				},
			},
		},
	},
	'users.getStatus': {
		response: {
			'200': {
				'Success Example': {
					value: {
						_id: 'W7NHuX5ri2e3mu2Fc',
						connectionStatus: 'online',
						status: 'online',
						statusSource: 'manual',
						statusExpiresAt: '2026-06-22T18:00:00.000Z',
						success: true,
					},
				},
			},
		},
	},
	'users.verifyEmail': {
		response: {
			'400': {
				'Missing token': {
					value: {
						success: false,
						error: "must have required property 'token' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
				'Verification link expired': {
					value: {
						success: false,
						error: 'Verify email link expired',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					token: 'hf5Wf4Kj9R3mR7cQ2xkPd',
				},
			},
		},
	},
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
