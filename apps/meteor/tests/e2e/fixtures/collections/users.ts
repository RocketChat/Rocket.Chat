import { faker } from '@faker-js/faker';
import type { IUser } from '@rocket.chat/core-typings';

import { DEFAULT_USER_CREDENTIALS } from '../../config/constants';
import { type IUserState } from '../userStates';

type UserFixture = IUser & {
	username: string;
	__rooms: string[];
};

export function createUserFixture(user: IUserState): UserFixture {
	const { username, hashedToken, loginExpire, e2e } = user.data;

	return {
		_id: `${username}`,
		type: 'user',
		active: true,
		emails: [{ address: `${username}@email.com`, verified: true }],
		roles: ['user'],
		name: username,
		lastLogin: new Date(),
		statusConnection: 'offline',
		utcOffset: -3,
		username,
		services: {
			password: { bcrypt: DEFAULT_USER_CREDENTIALS.bcrypt },
			email2fa: { enabled: true, changedAt: new Date() },
			email: {
				verificationTokens: [
					{
						token: faker.string.uuid(),
						address: `${username}@email.com`,
						when: new Date(),
					},
				],
			},
			resume: {
				loginTokens: [
					{
						when: loginExpire,
						hashedToken,
					},
				],
			},
			emailCode: { code: '', attempts: 0, expire: new Date() },
		},
		createdAt: new Date(),
		_updatedAt: new Date(),
		__rooms: ['GENERAL'],
		e2e,
	};
}
