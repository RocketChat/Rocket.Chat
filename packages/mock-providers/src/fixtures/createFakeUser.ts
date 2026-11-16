import type { IUser } from '@rocket.chat/core-typings';

import { FIXTURE_EPOCH, nextFixtureId } from './sequence';

export function createFakeUser<TUser extends IUser>(overrides?: Partial<IUser> & Omit<TUser, keyof IUser>): TUser;
export function createFakeUser(overrides?: Partial<IUser>): IUser {
	const _id = overrides?._id ?? nextFixtureId('user');

	return {
		_id,
		_updatedAt: FIXTURE_EPOCH,
		username: _id,
		name: `User ${_id}`,
		createdAt: FIXTURE_EPOCH,
		roles: ['user'],
		active: true,
		type: 'user',
		...overrides,
	};
}
