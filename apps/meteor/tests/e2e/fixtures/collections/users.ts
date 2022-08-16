import type { IUser } from '@rocket.chat/core-typings';
import { faker } from '@faker-js/faker';

type UserFixture = IUser & {
	username: string;
	__rooms: string[];
};

export function createUserFixture(username: string): UserFixture {
	return {
		_id: `${username}`,
		type: 'user',
		active: true,
		emails: [{ address: `${username}@email.com`, verified: false }],
		roles: ['user'],
		name: username,
		lastLogin: new Date(),
		statusConnection: 'offline',
		utcOffset: -3,
		username,
		services: {
			password: { bcrypt: '$2b$10$EMxaeQQbSw9JLL.YvOVPaOW8MKta6pgmp2BcN5Op4cC9bJiOqmUS.' },
			email2fa: { enabled: true, changedAt: new Date() },
			email: {
				verificationTokens: [
					{
						token: faker.datatype.uuid(),
						address: `${username}@email.com`,
						when: new Date(),
					},
				],
			},
			resume: { loginTokens: [] },
			emailCode: [{ code: '', expire: new Date() }],
		},
		createdAt: new Date(),
		_updatedAt: new Date(),
		__rooms: ['GENERAL'],
	};
}
