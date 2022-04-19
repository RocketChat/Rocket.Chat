export const userMock = {
	_id: 'vvsKGW5tKKqP9vj54',
	createdAt: new Date(),
	services: {
		password: {
			bcrypt: '$2b$10$EMxaeQQbSw9JLL.YvOVPaOW8MKta6pgmp2BcN5Op4cC9bJiOqmUS.',
			enroll: {
				token: 'NukGmrDVtX3AoiGS9TxWlkPa-rJhssOT-aliirvMHTb',
				email: 'user.name.test@email.com',
				when: new Date(),
				reason: 'enroll',
			},
		},
		email2fa: {
			enabled: true,
			changedAt: new Date(),
		},
		email: {
			verificationTokens: [
				{
					token: 'V8e1X2pMtYnVBzIgQx017Gmy37kq-WxohSHPjg-0qf8',
					address: 'user.name.test@email.com',
					when: new Date(),
				},
			],
		},
		resume: {
			loginTokens: [],
		},
	},
	emails: [
		{
			address: 'user.name.test@email.com',
			verified: false,
		},
	],
	type: 'user',
	status: 'offline',
	active: true,
	_updatedAt: new Date(),
	roles: ['user'],
	name: 'Normal User',
	lastLogin: new Date(),
	statusConnection: 'offline',
	utcOffset: -3,
	username: 'user.name.test',
	__rooms: ['GENERAL', '9kc9F8BghhCp5bc3T', 'fWJChTFjhQLXZrusq'],
};
