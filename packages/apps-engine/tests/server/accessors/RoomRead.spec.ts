import { AsyncTest, Expect, SetupFixture } from 'alsatian';

import type { IMessageRaw } from '../../../src/definition/messages';
import type { IRoom } from '../../../src/definition/rooms';
import type { IUser } from '../../../src/definition/users';
import { RoomRead } from '../../../src/server/accessors';
import type { RoomBridge } from '../../../src/server/bridges';
import { TestData } from '../../test-data/utilities';

export class RoomReadAccessorTestFixture {
    private room: IRoom;

    private user: IUser;

    private messages: IMessageRaw[];

    private unreadRoomId: string;

    private unreadUserId: string;

    private mockRoomBridgeWithRoom: RoomBridge;

    @SetupFixture
    public setupFixture() {
        this.room = TestData.getRoom();
        this.user = TestData.getUser();
        this.messages = ['507f1f77bcf86cd799439011', '507f191e810c19729de860ea'].map((id) => TestData.getMessageRaw(id));
        this.unreadRoomId = this.messages[0].roomId;
        this.unreadUserId = this.messages[0].sender._id;

        const theRoom = this.room;
        const theUser = this.user;
        const theMessages = this.messages;

        const theUnreadMsg = this.messages;
        const { unreadRoomId } = this;
        const { unreadUserId } = this;
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
            doGetMessages(roomId, options, appId): Promise<IMessageRaw[]> {
                return Promise.resolve(theMessages);
            },
            doGetUnreadByUser(roomId, uid, options, appId): Promise<IMessageRaw[]> {
                if (roomId === unreadRoomId && uid === unreadUserId) {
                    return Promise.resolve(theUnreadMsg);
                }
                return Promise.resolve([]);
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
        Expect(await rr.getMessages('testing')).toBeDefined();
        Expect(await rr.getMessages('testing')).toBe(this.messages);
        Expect(await rr.getUnreadByUser(this.unreadRoomId, this.unreadUserId)).toBeDefined();
        Expect(await rr.getUnreadByUser(this.unreadRoomId, this.unreadUserId)).toEqual(this.messages);

        Expect(await rr.getUnreadByUser('fake', 'fake')).toBeDefined();
        Expect(await rr.getUnreadByUser('fake', 'fake')).toEqual([]);
    }

    @AsyncTest()
    public async useTheIterators() {
        Expect(() => new RoomRead(this.mockRoomBridgeWithRoom, 'testing-app')).not.toThrow();

        const rr = new RoomRead(this.mockRoomBridgeWithRoom, 'testing-app');

        Expect(await rr.getMembers('testing')).toBeDefined();
        Expect((await rr.getMembers('testing')) as Array<IUser>).not.toBeEmpty();
        Expect((await rr.getMembers('testing'))[0]).toBe(this.user);
    }
}
