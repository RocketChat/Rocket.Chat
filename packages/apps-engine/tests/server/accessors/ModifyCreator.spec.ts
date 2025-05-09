import { AsyncTest, Expect, SetupFixture, SpyOn } from 'alsatian';

import type { IMessage } from '../../../src/definition/messages';
import type { IRoom } from '../../../src/definition/rooms';
import { RoomType } from '../../../src/definition/rooms';
import type { IUser } from '../../../src/definition/users';
import { UserStatusConnection, UserType } from '../../../src/definition/users';
import { ModifyCreator } from '../../../src/server/accessors';
import type { AppBridges, MessageBridge, RoomBridge, UserBridge } from '../../../src/server/bridges';
import { TestData } from '../../test-data/utilities';

export class ModifyCreatorTestFixture {
    private mockAppId: string;

    private mockRoomBridge: RoomBridge;

    private mockMessageBridge: MessageBridge;

    private mockAppBridge: AppBridges;

    private mockAppUser: IUser;

    private mockUserBridge: UserBridge;

    @SetupFixture
    public setupFixture() {
        this.mockAppId = 'testing-app';

        this.mockAppUser = {
            id: 'mockAppUser',
            isEnabled: true,
            name: 'mockAppUser',
            roles: ['app'],
            status: 'online',
            statusConnection: UserStatusConnection.UNDEFINED,
            type: UserType.APP,
            username: 'mockAppUser',
            emails: [],
            utcOffset: -5,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLoginAt: new Date(),
        };

        this.mockRoomBridge = {
            doCreate(room: IRoom, members: Array<string>, appId: string): Promise<string> {
                return Promise.resolve('roomId');
            },
        } as RoomBridge;

        this.mockMessageBridge = {
            doCreate(msg: IMessage, appId: string): Promise<string> {
                return Promise.resolve('msgId');
            },
        } as MessageBridge;

        this.mockUserBridge = {
            doGetAppUser: (appId: string) => {
                return Promise.resolve(this.mockAppUser);
            },
        } as UserBridge;

        this.mockAppBridge = {
            getMessageBridge: () => this.mockMessageBridge,
            getRoomBridge: () => this.mockRoomBridge,
            getUserBridge: () => this.mockUserBridge,
        } as AppBridges;
    }

    @AsyncTest()
    public async basicModifyCreator() {
        Expect(() => new ModifyCreator(this.mockAppBridge, this.mockAppId)).not.toThrow();

        const mc = new ModifyCreator(this.mockAppBridge, this.mockAppId);
        Expect(mc.startMessage()).toBeDefined();
        Expect(mc.startMessage({ id: 'value' } as IMessage)).toBeDefined();
        Expect(mc.startRoom()).toBeDefined();
        Expect(mc.startRoom({ id: 'value' } as IRoom)).toBeDefined();

        await Expect(() => mc.finish({} as any)).toThrowErrorAsync(Error, 'Invalid builder passed to the ModifyCreator.finish function.');
    }

    @AsyncTest()
    public async msgModifyCreator() {
        const mc = new ModifyCreator(this.mockAppBridge, this.mockAppId);

        const msg = {} as IMessage;
        const msgBd = mc.startMessage(msg);
        await Expect(() => mc.finish(msgBd)).toThrowErrorAsync(Error, 'The "room" property is required.');
        msgBd.setRoom(TestData.getRoom());
        Expect(msg.room).toBeDefined();
        await Expect(() => mc.finish(msgBd)).not.toThrowErrorAsync(Error, 'Invalid sender assigned to the message.');
        msgBd.setSender(TestData.getUser());
        Expect(msg.sender).toBeDefined();

        const msgBriSpy = SpyOn(this.mockMessageBridge, 'doCreate');
        Expect(await mc.finish(msgBd)).toBe('msgId');
        Expect(msgBriSpy).toHaveBeenCalledWith(msg, this.mockAppId);
        msgBriSpy.restore();
    }

    @AsyncTest()
    public async roomModifyCreator() {
        const mc = new ModifyCreator(this.mockAppBridge, this.mockAppId);

        const room = {} as IRoom;
        const roomBd = mc.startRoom(room);
        await Expect(() => mc.finish(roomBd)).toThrowErrorAsync(Error, 'Invalid type assigned to the room.');
        roomBd.setType(RoomType.CHANNEL);
        Expect(room.type).toBe(RoomType.CHANNEL);

        await Expect(() => mc.finish(roomBd)).toThrowErrorAsync(Error, 'Invalid creator assigned to the room.');
        roomBd.setCreator(TestData.getUser());
        Expect(room.creator).toBeDefined();

        await Expect(() => mc.finish(roomBd)).toThrowErrorAsync(Error, 'Invalid slugifiedName assigned to the room.');
        roomBd.setSlugifiedName('testing-room');
        Expect(room.slugifiedName).toBe('testing-room');

        await Expect(() => mc.finish(roomBd)).toThrowErrorAsync(Error, 'Invalid displayName assigned to the room.');
        roomBd.setDisplayName('Display Name');
        Expect(room.displayName).toBe('Display Name');

        const roomBriSpy = SpyOn(this.mockRoomBridge, 'doCreate');
        Expect(await mc.finish(roomBd)).toBe('roomId');
        Expect(roomBriSpy).toHaveBeenCalledWith(room, roomBd.getMembersToBeAddedUsernames(), this.mockAppId);
        roomBriSpy.restore();
    }
}
