/**
 * Request and response examples for the email-inbox endpoints, imported from
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

export const emailInboxExamples: Record<string, PayloadExamples> = {
	'email-inbox.list': {
		response: {
			'200': {
				Success: {
					value: {
						emailInboxes: [
							{
								_id: '60197e8ff82d6c83b96c53ff',
								active: false,
								name: 'Rocket.Chat sample account',
								email: 'info@rocket.chat',
								description: '',
								senderInfo: '',
								department: 'GgYvrkAF63aeQmsh4',
								smtp: {
									server: 'smtp.gmail.com',
									port: 465,
									username: 'info@rocket.chat',
									password: 'kkviepoenakbccwf',
									secure: true,
								},
								imap: {
									server: 'imap.gmail.com',
									port: 993,
									username: 'info@rocket.chat',
									password: 'kkviepoenakbccwf',
									secure: true,
								},
								_createdAt: '2021-02-02T16:32:15.069Z',
								_updatedAt: '2021-09-06T17:43:49.257Z',
								_createdBy: {
									_id: 'JxemcN9PDCdfzJeZr',
									username: 'renato.becker',
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
	'email-inbox': {
		response: {
			'200': {
				Success: {
					value: {
						_id: 'JdVkn_dkOlms_',
						success: true,
					},
				},
			},
			'400': {
				'Duplicate': {
					value: {
						success: false,
						error: 'E11000 duplicate key error index: rocketchat.rocketchat_email_inbox.$email_1 dup key: { : "mdyemail@rocket.chat" }',
					},
				},
				'Invalid Inbox': {
					value: {
						success: false,
						error: 'error-invalid-email-inbox',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					name: 'new email',
					email: 'mdyemaasil@rocket.chat',
					active: false,
					description: 'This email has been set',
					senderInfo: 'email sender',
					department: 'awesome department',
					smtp: {
						password: '10fae4dc374fb87d',
						port: 25,
						secure: true,
						server: 'smtp.mailtrap.io',
						username: 'b5ef5safd6cb806c',
					},
					imap: {
						password: '10fae4374sdfb87d',
						port: 993,
						secure: true,
						server: 'imap.mailtrap.io',
						username: 'b5ef5aafd6cb806c',
					},
				},
			},
		},
	},
	'email-inbox/:_id': {
		response: {
			'200': {
				'Success Example': {
					value: {
						_id: '61717dd1066bc500096cb36d',
						success: true,
					},
				},
			},
		},
	},
	'email-inbox.search': {
		response: {
			'200': {
				'Success Example': {
					value: {
						emailInbox: {
							_id: '60197e8ff82d6c83b96c53ff',
							active: false,
							name: 'Rocket.Chat sample account',
							email: 'info@rocket.chat',
							description: '',
							senderInfo: '',
							department: 'GgYvrkAF63aeQmsh4',
							smtp: {
								server: 'smtp.gmail.com',
								port: 465,
								username: 'info@rocket.chat',
								password: 'kkviepoenakbccwf',
								secure: true,
							},
							imap: {
								server: 'imap.gmail.com',
								port: 993,
								username: 'info@rocket.chat',
								password: 'kkviepoenakbccwf',
								secure: true,
							},
							_createdAt: '2021-02-02T16:32:15.069Z',
							_updatedAt: '2021-09-06T17:43:49.257Z',
							_createdBy: {
								_id: 'JxemcN9PDCdfzJeZr',
								username: 'renato.becker',
							},
						},
						success: true,
					},
				},
			},
		},
	},
};
