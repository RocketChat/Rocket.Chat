import { AsyncTest, Expect, SetupFixture } from 'alsatian';

import type { IRoom } from '../../../src/definition/rooms';
import type { IUser } from '../../../src/definition/users';
import { RoomRead } from '../../../src/server/accessors';
import type { RoomBridge } from '../../../src/server/bridges';
import { TestData } from '../../test-data/utilities';

export class RoomReadAccessorTestFixture {
    private room: IRoom;

    private user: IUser;

    private mockRoomBridgeWithRoom: RoomBridge;

    @SetupFixture
    public setupFixture() {
        this.room = TestData.getRoom();
        this.user = TestData.getUser();

        const theRoom = this.room;
        const theUser = this.user;
        this.mockRoomBridgeWithRoom = {
            doGetById(id, appId): Promise<IRoom> {
                return Promise.resolve(theRoom);
            },
            doGetByName(name, appId): Promise<IRoom> {
                return Promise.resolve(theRoom);
            },
            doGetCreatorById(id, appId): Promise<IUser> {
                return Promise.resolve(theUser);
            },
            doGetCreatorByName(name, appId): Promise<IUser> {
                return Promise.resolve(theUser);
            },
            doGetDirectByUsernames(usernames, appId): Promise<IRoom> {
                return Promise.resolve(theRoom);
            },
            doGetMembers(name, appId): Promise<Array<IUser>> {
                return Promise.resolve([theUser]);
            },
        } as RoomBridge;
    }

    @AsyncTest()
    public async expectDataFromRoomRead() {
        Expect(() => new RoomRead(this.mockRoomBridgeWithRoom, 'testing-app')).not.toThrow();

        const rr = new RoomRead(this.mockRoomBridgeWithRoom, 'testing-app');

        Expect(await rr.getById('fake')).toBeDefined();
        Expect(await rr.getById('fake')).toBe(this.room);
        Expect(await rr.getByName('testing-room')).toBeDefined();
        Expect(await rr.getByName('testing-room')).toBe(this.room);
        Expect(await rr.getCreatorUserById('testing')).toBeDefined();
        Expect(await rr.getCreatorUserById('testing')).toBe(this.user);
        Expect(await rr.getCreatorUserByName('testing')).toBeDefined();
        Expect(await rr.getCreatorUserByName('testing')).toBe(this.user);
        Expect(await rr.getDirectByUsernames([this.user.username])).toBeDefined();
        Expect(await rr.getDirectByUsernames([this.user.username])).toBe(this.room);
    }

    @AsyncTest()
    public async useTheIterators() {
        Expect(() => new RoomRead(this.mockRoomBridgeWithRoom, 'testing-app')).not.toThrow();

        const rr = new RoomRead(this.mockRoomBridgeWithRoom, 'testing-app');
        await Expect(() => rr.getMessages('faker')).toThrowErrorAsync(Error, 'Method not implemented.');

        Expect(await rr.getMembers('testing')).toBeDefined();
        Expect((await rr.getMembers('testing')) as Array<IUser>).not.toBeEmpty();
        Expect((await rr.getMembers('testing'))[0]).toBe(this.user);
    }
}
