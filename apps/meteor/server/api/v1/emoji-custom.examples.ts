import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the emoji-custom endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const emojiCustomExamples = {
	'emoji-custom.list': {
		response: {
			'200': {
				'Success Example': {
					value: {
						emojis: {
							update: [
								{
									_id: 'S5XvYppoLrLd9JvQm',
									name: 'teste',
									aliases: [],
									extension: 'jpg',
									_updatedAt: '2019-02-18T16:48:35.119Z',
								},
							],
							remove: [
								{
									_id: '2dbVBG434dnsdh23',
									name: 'teste3',
									aliases: [],
									extension: 'jpg',
									_updatedAt: '2019-02-18T16:48:35.119Z',
								},
							],
						},
						success: true,
					},
				},
			},
		},
	},
	'emoji-custom.all': {
		response: {
			'200': {
				Example: {
					value: {
						emojis: [
							{
								_id: '6542e83aa2f73c7460e18efb',
								name: 'happy',
								aliases: ['happy-gang'],
								extension: 'png',
								_updatedAt: '2023-11-02T00:07:22.433Z',
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
	'emoji-custom.create': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'Missing Content-Type',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: '[No file uploaded]',
						errorType: 'No file uploaded',
					},
				},
			},
		},
	},
	'emoji-custom.update': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: '[The required "_id" query param is missing.]',
						errorType: 'The required "_id" query param is missing.',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: '[Emoji not found.]',
						errorType: 'Emoji not found.',
					},
				},
			},
		},
	},
	'emoji-custom.delete': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'The "emojiId" params is required!',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: 'Invalid emoji [Custom_Emoji_Error_Invalid_Emoji]',
						errorType: 'Custom_Emoji_Error_Invalid_Emoji',
						details: {
							method: 'deleteEmojiCustom',
						},
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					emojiId: '6542e83aa2f73c7460e18efb',
				},
			},
		},
	},
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
