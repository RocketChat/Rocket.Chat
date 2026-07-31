import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the customField endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const customFieldExamples = {
	'livechat/custom-fields.save': {
		response: {
			'200': {
				Example: {
					value: {
						customField: {
							label: 'address11',
							scope: 'visitor',
							visibility: 'hidden',
							type: 'input',
							searchable: true,
							regexp: '',
							required: false,
							defaultValue: '',
							options: '',
							public: true,
							_updatedAt: '2025-10-06T06:52:40.102Z',
						},
						success: true,
					},
				},
			},
			'403': {
				Example: {
					value: {
						success: false,
						error: 'User does not have the permissions required for this action [error-unauthorized]',
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					customFieldData: {
						field: 'new1',
						label: 'new11',
						visibility: true,
						scope: 'visitor',
						type: 'select',
						searchable: true,
						regexp: '',
						required: false,
						defaultValue: '',
						options: 'optionA, optionB',
						public: true,
					},
				},
			},
		},
	},
	'livechat/custom-fields.delete': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						errorType: 'invalid-params',
						error: "must have required property 'customFieldId'",
					},
				},
			},
			'403': {
				'Example 1': {
					value: {
						success: false,
						error: 'User does not have the permissions required for this action [error-unauthorized]',
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					customFieldId: 'class',
				},
			},
		},
	},
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
