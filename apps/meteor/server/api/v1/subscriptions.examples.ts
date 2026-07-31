import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the subscriptions endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const subscriptionsExamples = {
	'subscriptions.get': {
		response: {
			'200': {
				'Success Example': {
					value: {
						update: [
							{
								t: 'c',
								ts: '2017-11-25T15:08:17.249Z',
								name: 'general',
								fname: null,
								rid: 'GENERAL',
								u: {
									_id: 'EoyAmF4mxx5HxJHJB',
									username: 'rocket.cat',
									name: 'Rocket Cat',
								},
								open: true,
								alert: true,
								unread: 1,
								userMentions: 1,
								groupMentions: 0,
								_updatedAt: '2017-11-25T15:08:17.249Z',
								_id: '5ALsG3QhpJfdMpyc8',
							},
						],
						remove: [],
						success: true,
					},
				},
			},
		},
	},
	'subscriptions.getOne': {
		response: {
			'200': {
				'Success Example': {
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
			'400': {
				'Invalid Parameter': {
					value: {
						success: false,
						error: "must have required property 'roomId' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
	},
	'subscriptions.read': {
		response: {
			'400': {
				'Invalid Parameter': {
					value: {
						success: false,
						error:
							"must have required property 'rid'\n must have required property 'roomId'\n must match a schema in anyOf [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
		body: {
			RoomId: {
				value: {
					roomId: 'L6su9mxwdDkvdSaT9hvzu8z6mHFigiXy6Y',
				},
			},
			Rid: {
				value: {
					rid: 'L6su9mxwdDkvdSaT9hvzu8z6mHFigiXy6Y',
				},
			},
		},
	},
	'subscriptions.unread': {
		response: {
			'400': {
				'Invalid Parameter': {
					value: {
						success: false,
						error:
							"must have required property 'roomId'\n must have required property 'firstUnreadMessage'\n must match a schema in anyOf [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
		body: {
			'Example': {
				value: {
					roomId: 'L6su9mxwdDkvdSaT9hvzu8z6mHFigiXy6Y',
				},
			},
			'Example 2': {
				value: {
					firstUnreadMessage: {
						_id: 'L6su9mxwdDkvdSaT9hvzu8z6mHFigiXy6Y',
					},
				},
			},
		},
	},
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
