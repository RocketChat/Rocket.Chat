import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the import endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const importExamples = {
	'uploadImportFile': {
		response: {
			'400': {
				'Importer not Defined': {
					value: {
						success: false,
						error: 'The importer (png) has no import class defined. [error-importer-not-defined]',
						errorType: 'error-importer-not-defined',
						details: 'uploadImportFile',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					binaryContent: '/testfile.csv',
					importerKey: 'csv',
					fileName: 'Testfile',
					contentType: 'text/csv',
				},
			},
		},
	},
	'downloadPublicImportFile': {
		response: {
			'400': {
				'Importer not Defined': {
					value: {
						success: false,
						error: 'The importer (png) has no import class defined. [error-importer-not-defined]',
						errorType: 'error-importer-not-defined',
						details: 'uploadImportFile',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					fileUrl: 'https://www.freepik.com/photos/dog',
					importerKey: 'pending-avatars',
				},
			},
		},
	},
	'startImport': {
		body: {
			Example: {
				value: {
					input: {
						users: {
							all: true,
							list: ['testbh'],
						},
						channels: {
							all: false,
							list: ['WDuJLFkjwk6L7LdFC'],
						},
					},
				},
			},
		},
	},
	'getImportFileData': {
		response: {
			'200': {
				Example: {
					value: {
						users: [],
						channels: [],
						message_count: 0,
						success: true,
					},
				},
			},
		},
	},
	'getImportProgress': {
		response: {
			'200': {
				Success: {
					value: {
						key: 'pending-avatars',
						name: 'Pending Avatars',
						step: 'importer_user_selection',
						count: {
							completed: 0,
							total: 0,
						},
						success: true,
					},
				},
			},
		},
	},
	'getLatestImportOperations': {
		response: {
			'200': {
				Success: {
					value: [
						{
							_id: 'MJxTRZsYdho8Ww2qq',
							type: 'Pending Avatars',
							importerKey: 'pending-avatars',
							ts: 1635280600083,
							status: 'importer_user_selection',
							valid: false,
							user: 'd26x6zSkaPSe5gCyy',
							_updatedAt: '2021-10-27T11:26:24.430Z',
						},
						{
							_id: 'YzSCu9WgqJ3wutF4T',
							type: 'Pending Files',
							importerKey: 'pending-files',
							ts: 1635280596592,
							status: 'importer_done',
							valid: false,
							user: 'd26x6zSkaPSe5gCyy',
							_updatedAt: '2021-10-27T08:32:42.609Z',
						},
						{
							_id: '96WJDaxXpwXC3fTD5',
							type: 'Pending Files',
							importerKey: 'pending-files',
							ts: 1635277590992,
							status: 'importer_user_selection',
							valid: false,
							user: 'd26x6zSkaPSe5gCyy',
							_updatedAt: '2021-10-27T08:32:42.609Z',
						},
						{
							_id: 'zYc5kuFRaszfqCegB',
							type: 'Pending Avatars',
							importerKey: 'pending-avatars',
							ts: 1635277492185,
							status: 'importer_done',
							valid: false,
							user: 'd26x6zSkaPSe5gCyy',
							_updatedAt: '2021-10-27T08:32:42.609Z',
						},
						{
							_id: 'XckCNn9ZsdywHso4f',
							type: 'Pending Avatars',
							importerKey: 'pending-avatars',
							ts: 1635277452755,
							status: 'importer_done',
							valid: false,
							user: 'd26x6zSkaPSe5gCyy',
							_updatedAt: '2021-10-27T08:32:42.609Z',
						},
					],
				},
			},
		},
	},
	'downloadPendingFiles': {
		response: {
			'200': {
				Success: {
					value: {
						success: true,
						count: 0,
					},
				},
			},
		},
	},
	'downloadPendingAvatars': {
		response: {
			'200': {
				Success: {
					value: {
						success: true,
						count: 0,
					},
				},
			},
		},
	},
	'getCurrentImportOperation': {
		response: {
			'200': {
				Success: {
					value: {
						success: true,
						operation: {
							_id: '7PbvsnKJD9ZAqw38C',
							type: 'Pending Avatars',
							importerKey: 'pending-avatars',
							ts: 1635337234169,
							status: 'importer_done',
							valid: true,
							user: 'd26x6zSkaPSe5gCyy',
							_updatedAt: '2021-10-27T12:20:34.184Z',
						},
					},
				},
			},
		},
	},
	'importers.list': {
		response: {
			'200': {
				'Example 1': {
					value: [
						{
							key: 'csv',
							name: 'CSV',
						},
						{
							key: 'slack',
							name: 'Slack',
						},
						{
							key: 'slack-users',
							name: 'Slack_Users',
						},
						{
							key: 'omnichannel_contact',
							name: 'omnichannel_contacts_importer',
						},
					],
				},
			},
		},
	},
	'import.new': {
		response: {
			'200': {
				Success: {
					value: {
						operation: {
							_id: '64d69545ee8ae821983005f5',
							type: 'api',
							importerKey: 'api',
							ts: '2023-08-11T20:08:37.655Z',
							status: 'importer_new',
							valid: true,
							user: 'rbAXPnMktTFbNpwtJ',
							_updatedAt: '2023-08-11T20:08:37.655Z',
						},
						success: true,
					},
				},
			},
		},
	},
	'import.status': {
		response: {
			'200': {
				'Success Example': {
					value: {
						state: 'ready',
						operation: {
							_id: '64d51ea91558939980aab371',
							type: 'api',
							importerKey: 'api',
							ts: '2023-08-10T17:30:17.519Z',
							status: 'importer_user_selection',
							valid: true,
							user: '7TY57bBj3xQXvf2i2',
							_updatedAt: '2023-08-10T17:41:20.052Z',
							count: {
								total: 2,
								users: 2,
							},
						},
						success: true,
					},
				},
			},
		},
	},
	'import.addUsers': {
		body: {
			Example: {
				value: {
					users: [
						{
							username: 'john.doe',
							emails: ['john.doe@example.com'],
							importIds: ['1523'],
							name: 'John Doe',
							password: 'P@ssw0rd',
						},
						{
							username: 'jane.doe',
							emails: ['jane.doe@example.com'],
							importIds: ['1524'],
							name: 'Jane Doe',
						},
					],
				},
			},
		},
	},
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
