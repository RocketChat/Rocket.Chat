import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the settings endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const settingsExamples = {
	'settings.public': {
		response: {
			'200': {
				'Success Example': {
					value: {
						settings: [
							{
								_id: 'API_Drupal_URL',
								value: '',
							},
							{
								_id: 'API_Embed',
								value: true,
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
	'settings.oauth': {
		response: {
			'200': {
				'Success Example': {
					value: {
						services: [
							{
								_id: 'iJeY7x4wxnh2p3pLr',
								name: 'facebook',
								clientId: 'test',
								buttonLabelText: 'test',
								buttonColor: '#13679A',
								buttonLabelColor: '#FFFFFF',
								custom: false,
							},
							{
								_id: 'iJeY7x4wxnh2p3pLr',
								name: 'twitter',
								clientId: 'test',
								buttonLabelText: '',
								buttonColor: '',
								buttonLabelColor: '',
								custom: false,
							},
							{
								_id: '5RQ4SBL3NuZKsqxaF',
								service: 'test',
								clientId: 'test',
								custom: true,
								serverURL: '/test/test',
								tokenPath: '/oauth/token',
								identityPath: '/me',
								authorizePath: '/oauth/authorize',
								scope: 'openid',
								buttonLabelText: 'test',
								buttonLabelColor: '#FFFFFF',
								loginStyle: 'popup',
								buttonColor: '#13679A',
								tokenSentVia: 'payload',
								identityTokenSentVia: 'default',
								usernameField: 'dfsgdfgdfgdfgsd',
								mergeUsers: true,
							},
						],
						success: true,
					},
				},
			},
		},
	},
	'settings.addCustomOAuth': {
		response: {
			'400': {
				'Missing name param': {
					value: {
						success: false,
						error: 'The parameter "name" is required [error-name-param-not-provided]',
						errorType: 'error-name-param-not-provided',
					},
				},
			},
		},
	},
	'settings': {
		response: {
			'400': {
				'Invalid Params': {
					value: {
						success: false,
						error: "must have required property 'settings' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
			'403': {
				'Permission Error': {
					value: {
						success: false,
						error: 'Editing settings is not allowed [error-action-not-allowed]',
						errorType: 'error-action-not-allowed',
						details: {
							method: 'saveSettings',
							settingIds: ['API_Allow_Infinite_Count', 'API_CORS_Origin'],
						},
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					settings: [
						{
							_id: 'API_Allow_Infinite_Count',
							value: false,
						},
						{
							_id: 'API_CORS_Origin',
							value: 'https://example.com',
						},
					],
				},
			},
		},
	},
	'settings/:_id': {
		response: {
			'200': {
				'Success Example': {
					value: {
						_id: 'Livechat_enabled',
						value: false,
						success: true,
					},
				},
			},
		},
	},
	'service.configurations': {
		response: {
			'200': {
				'Success Example': {
					value: {
						configurations: [
							{
								_id: 'Hq5ahzz9MWWCdeDJ8',
								service: 'google',
								clientId: 'xxxxx',
							},
							{
								_id: '57kavS22achLH33PE',
								service: 'apple',
								clientId: 'xxxxxx',
							},
						],
						success: true,
					},
				},
			},
		},
	},
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
