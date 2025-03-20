import { faker } from '@faker-js/faker';
import type { IUser } from '@rocket.chat/core-typings';

export function createFakeUser<TUser extends IUser>(overrides?: Partial<IUser> & Omit<TUser, keyof IUser>): TUser;
export function createFakeUser(overrides?: Partial<IUser>): IUser {
	return {
		_id: faker.database.mongodbObjectId(),
		_updatedAt: faker.date.recent(),
		username: faker.internet.userName(),
		name: faker.person.fullName(),
		createdAt: faker.date.recent(),
		roles: ['user'],
		active: faker.datatype.boolean(),
		type: 'user',
		...overrides,
	};
}
