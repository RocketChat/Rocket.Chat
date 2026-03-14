import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { IUser } from '../../../../src/definition/users';
import { UserRead } from '../../../../src/server/accessors';
import type { UserBridge } from '../../../../src/server/bridges';
import { TestData } from '../../../test-data/utilities';

describe('UserRead', () => {
	const user = TestData.getUser();
	const roomIds = ['room-1', 'room-2'];
	const mockAppId = 'test-appId';

	const mockUserBridge = {
		doGetById(id: string, appId: string): Promise<IUser> {
			return Promise.resolve(user);
		},
		doGetByUsername(id: string, appId: string): Promise<IUser> {
			return Promise.resolve(user);
		},
		doGetAppUser(appId?: string): Promise<IUser> {
			return Promise.resolve(user);
		},
		doGetUserRoomIds(userId: string): Promise<Array<string>> {
			return Promise.resolve(roomIds);
		},
	} as unknown as UserBridge;

	it('expectDataFromMessageRead', async () => {
		assert.doesNotThrow(() => new UserRead(mockUserBridge, 'testing-app'));

		const ur = new UserRead(mockUserBridge, 'testing-app');

		assert.ok((await ur.getById('fake')) !== undefined);
		assert.deepStrictEqual(await ur.getById('fake'), user);

		assert.ok((await ur.getByUsername('username')) !== undefined);
		assert.deepStrictEqual(await ur.getByUsername('username'), user);

		assert.ok((await ur.getAppUser(mockAppId)) !== undefined);
		assert.deepStrictEqual(await ur.getAppUser(mockAppId), user);
		assert.deepStrictEqual(await ur.getAppUser(), user);
		assert.deepStrictEqual(await ur.getUserRoomIds(user.id), roomIds);
	});
});
