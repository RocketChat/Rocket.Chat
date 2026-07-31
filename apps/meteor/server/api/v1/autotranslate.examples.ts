import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the autotranslate endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const autotranslateExamples = {
	'autotranslate.getSupportedLanguages': {
		response: {
			'200': {
				'Success Example': {
					value: {
						languages: [
							{
								name: 'Arabic',
								supports_formality: false,
								language: 'ar',
							},
							{
								name: 'Bulgarian',
								supports_formality: false,
								language: 'bg',
							},
							{
								name: 'Czech',
								supports_formality: false,
								language: 'cs',
							},
							{
								name: 'German',
								supports_formality: true,
								language: 'de',
							},
							{
								name: 'Spanish (Latin American)',
								supports_formality: true,
								language: 'es-419',
							},
							{
								name: 'Estonian',
								supports_formality: false,
								language: 'et',
							},
							{
								name: 'Indonesian',
								supports_formality: false,
								language: 'id',
							},
							{
								name: 'Korean',
								supports_formality: false,
								language: 'ko',
							},
							{
								name: 'Lithuanian',
								supports_formality: false,
								language: 'lt',
							},
							{
								name: 'Portuguese (Brazilian)',
								supports_formality: true,
								language: 'pt-BR',
							},
							{
								name: 'Thai',
								supports_formality: false,
								language: 'th',
							},
							{
								name: 'Vietnamese',
								supports_formality: false,
								language: 'vi',
							},
							{
								name: 'Chinese (simplified)',
								supports_formality: false,
								language: 'zh',
							},
						],
						success: true,
					},
				},
			},
			'400': {
				'Target Language Required': {
					value: {
						success: false,
						error: "must have required property 'targetLanguage' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
	},
	'autotranslate.saveSettings': {
		body: {
			Example: {
				value: {
					roomId: '7aDSXtjMA3KPLxLjt',
					field: 'autoTranslate',
					value: true,
					defaultLanguage: 'en',
				},
			},
		},
	},
	'autotranslate.translateMessage': {
		response: {
			'200': {
				Success: {
					value: {
						message: {
							_id: 'Fq7sQNSnDEfzj8qoS',
							rid: 'GENERAL',
							msg: 'Isso é um teste',
							ts: '2019-06-27T15:35:20.753Z',
							u: {
								_id: 'pC6Z2N2ijivxdsYSu',
								username: 'marcos',
								name: 'marcos',
							},
							_updatedAt: '2019-06-27T15:47:01.486Z',
							mentions: [],
							channels: [],
							translations: {
								en: 'This is a test',
							},
						},
						success: true,
					},
				},
			},
			'400': {
				'Invalid Params': {
					value: {
						success: false,
						error: 'Invalid request body. [error-invalid-params]',
						errorType: 'error-invalid-params',
					},
				},
				'Message Not Found': {
					value: {
						success: false,
						error: 'Message not found.',
					},
				},
			},
			'403': {
				'Permission Error': {
					value: {
						success: false,
						error: 'unauthorized',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					messageId: 'Fq7sQNSnDEfzj8qoS',
					targetLanguage: 'en',
				},
			},
		},
	},
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
