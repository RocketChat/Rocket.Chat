import { AsyncTest, Expect, SetupFixture } from 'alsatian';

import type { IUser } from '../../../src/definition/users';
import { UserRead } from '../../../src/server/accessors';
import type { UserBridge } from '../../../src/server/bridges';
import { TestData } from '../../test-data/utilities';

export class UserReadAccessorTestFixture {
	private user: IUser;

	private mockUserBridge: UserBridge;

	private mockAppId: 'test-appId';

	private mockRoomIds: Array<string>;

	@SetupFixture
	public setupFixture() {
		this.user = TestData.getUser();
		this.mockRoomIds = ['room-1', 'room-2'];

		const theUser = this.user;
		const roomIds = this.mockRoomIds;
		this.mockUserBridge = {
			doGetById(id, appId): Promise<IUser> {
				return Promise.resolve(theUser);
			},
			doGetByUsername(id, appId): Promise<IUser> {
				return Promise.resolve(theUser);
			},
			doGetAppUser(appId?: string): Promise<IUser> {
				return Promise.resolve(theUser);
			},
			doGetUserRoomIds(): Promise<Array<string>> {
				return Promise.resolve(roomIds);
			},
		} as UserBridge;
	}

	@AsyncTest()
	public async expectDataFromMessageRead() {
		Expect(() => new UserRead(this.mockUserBridge, 'testing-app')).not.toThrow();

		const ur = new UserRead(this.mockUserBridge, 'testing-app');

		Expect(await ur.getById('fake')).toBeDefined();
		Expect(await ur.getById('fake')).toEqual(this.user);

		Expect(await ur.getByUsername('username')).toBeDefined();
		Expect(await ur.getByUsername('username')).toEqual(this.user);

		Expect(await ur.getAppUser(this.mockAppId)).toBeDefined();
		Expect(await ur.getAppUser(this.mockAppId)).toEqual(this.user);
		Expect(await ur.getAppUser()).toEqual(this.user);

		Expect(await ur.getUserRoomIds(this.user.id)).toEqual(this.mockRoomIds);
	}
}
