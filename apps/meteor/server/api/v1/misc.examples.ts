import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the misc endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const miscExamples = {
	'me': {
		response: {
			'200': {
				'User profile': {
					value: {
						_id: 'aobEdbYhXfu5hkeqG',
						name: 'Example User',
						emails: [
							{
								address: 'example@example.com',
								verified: true,
							},
						],
						status: 'offline',
						statusConnection: 'offline',
						username: 'example',
						utcOffset: 0,
						active: true,
						roles: ['user', 'admin'],
						settings: {
							preferences: {
								enableAutoAway: false,
								idleTimeoutLimit: 300,
								desktopNotificationDuration: 0,
								audioNotifications: 'mentions',
								desktopNotifications: 'mentions',
								mobileNotifications: 'mentions',
								unreadAlert: true,
								useEmojis: true,
								convertAsciiEmoji: true,
								autoImageLoad: true,
								saveMobileBandwidth: true,
								collapseMediaByDefault: false,
								hideUsernames: false,
								hideRoles: false,
								hideFlexTab: false,
								hideAvatars: false,
								roomsListExhibitionMode: 'category',
								sidebarViewMode: 'medium',
								sidebarHideAvatar: false,
								sidebarShowUnread: false,
								sidebarShowFavorites: true,
								sendOnEnter: 'normal',
								messageViewMode: 0,
								emailNotificationMode: 'all',
								roomCounterSidebar: false,
								newRoomNotification: 'door',
								newMessageNotification: 'chime',
								muteFocusedConversations: true,
								notificationsSoundVolume: 100,
							},
						},
						customFields: {
							twitter: '@userstwi',
						},
						avatarUrl: 'http://localhost:3000/avatar/test',
						success: true,
					},
				},
			},
		},
	},
	'shield.svg': {
		response: {
			'200': {
				Example: {
					value:
						'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="141" height="20"> <linearGradient id="b" x2="0" y2="100%"> <stop offset="0" stop-color="#bbb" stop-opacity=".1"/> <stop offset="1" stop-opacity=".1"/> </linearGradient> <mask id="a"> <rect width="141" height="20" rx="3" fill="#fff"/> </mask> <g mask="url(#a)"> <path fill="#555" d="M0 0h67v20H0z"/> <path fill="#4c1" d="M67 0h74v20H67z"/> <path fill="url(#b)" d="M0 0h141v20H0z"/> </g> <image x="5" y="3" width="14" height="14" xlink:href="/assets/favicon.svg"/> <g fill="#fff" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11"> <text x="24" y="15" fill="#010101" fill-opacity=".3">Rocket</text> <text x="24" y="14">Rocket</text> <text x="74" y="15" fill="#010101" fill-opacity=".3">JOIN CHAT</text> <text x="74" y="14">JOIN CHAT</text> </g> </svg>',
				},
			},
		},
	},
	'spotlight': {
		response: {
			'200': {
				Success: {
					value: {
						users: [
							{
								_id: 'rocket.cat',
								name: 'Rocket.Cat',
								username: 'rocket.cat',
								status: 'online',
								avatarETag: '5BB9B5ny5DkKdrwkq',
							},
						],
						rooms: [],
						success: true,
					},
				},
			},
		},
	},
	'directory': {
		response: {
			'200': {
				Success: {
					value: {
						result: [
							{
								_id: 'jRca8kibJx8NkLJxt',
								createdAt: '2018-04-13T12:46:26.517Z',
								emails: [
									{
										address: 'user.test.1523623548558@rocket.chat',
										verified: false,
									},
								],
								name: 'EditedRealNameuser.test.1523623548558',
								username: 'editedusernameuser.test.1523623548558',
								avatarETag: '6YbLtc4v9b4conXon',
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
	'pw.getPolicy': {
		response: {
			'200': {
				Success: {
					value: {
						enabled: true,
						policy: [
							[
								'get-password-policy-minLength',
								{
									minLength: 7,
								},
							],
							['get-password-policy-forbidRepeatingCharacters'],
							[
								'get-password-policy-forbidRepeatingCharactersCount',
								{
									forbidRepeatingCharactersCount: 3,
								},
							],
							['get-password-policy-mustContainAtLeastOneLowercase'],
							['get-password-policy-mustContainAtLeastOneUppercase'],
							['get-password-policy-mustContainAtLeastOneNumber'],
							['get-password-policy-mustContainAtLeastOneSpecialCharacter'],
						],
						success: true,
					},
				},
			},
		},
	},
	'method.call/:method': {
		response: {
			'200': {
				Example: {
					value: {
						message:
							'{"msg":"result","id":"2","result":{"rid":"67937a74f7ca7be1b5fcf599","inserted":true,"_id":"67937a74f7ca7be1b5fcf599","_updatedAt":{"$date":1737718388248},"fname":"test-websocket","name":"test-websocket","t":"c","msgs":0,"usersCount":0,"u":{"_id":"P2dgWPPw5veigwcdK","username":"funke.olasupo","name":"Funke Olasupo"},"ts":{"$date":1737718388248},"ro":false,"default":false,"sysMes":true}}',
						success: true,
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					message: '{"msg":"method","method":"createChannel","id":"2","params":["test-websocket",["doe.john"],false]}',
				},
			},
		},
	},
	'smtp.check': {
		response: {
			'200': {
				'Example 1': {
					value: {
						isSMTPConfigured: true,
						success: true,
					},
				},
			},
		},
	},
	'fingerprint': {
		response: {
			'400': {
				'Invalid Parameter': {
					value: {
						success: false,
						error: 'Invalid body params',
						errorType: 'error-invalid-body-params',
					},
				},
			},
			'403': {
				'Permission Error': {
					value: {
						success: false,
						error: 'User does not have the permissions required for this action [error-unauthorized]',
						errorType: 'error-unauthorized',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					setDeploymentAs: 'new-workspace',
				},
			},
		},
	},
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
