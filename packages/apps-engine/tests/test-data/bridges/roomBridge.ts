import type { IMessage, IMessageRaw } from '../../../src/definition/messages';
import type { IRoom } from '../../../src/definition/rooms';
import type { IUser } from '../../../src/definition/users';
import { RoomBridge } from '../../../src/server/bridges';
import type { GetMessagesOptions } from '../../../src/server/bridges/RoomBridge';

export class TestsRoomBridge extends RoomBridge {
    public create(room: IRoom, members: Array<string>, appId: string): Promise<string> {
        throw new Error('Method not implemented.');
    }

    public getById(roomId: string, appId: string): Promise<IRoom> {
        throw new Error('Method not implemented.');
    }

    public getCreatorById(roomId: string, appId: string): Promise<IUser> {
        throw new Error('Method not implemented.');
    }

    public getByName(roomName: string, appId: string): Promise<IRoom> {
        throw new Error('Method not implemented.');
    }

    public getCreatorByName(roomName: string, appId: string): Promise<IUser> {
        throw new Error('Method not implemented.');
    }

    public getDirectByUsernames(username: Array<string>, appId: string): Promise<IRoom> {
        throw new Error('Method not implemented');
    }

    public getMembers(roomName: string, appId: string): Promise<Array<IUser>> {
        throw new Error('Method not implemented.');
    }

    public getMessages(roomId: string, options: GetMessagesOptions, appId: string): Promise<IMessageRaw[]> {
        throw new Error('Method not implemented.');
    }

    public update(room: IRoom, members: Array<string>, appId: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    public createDiscussion(room: IRoom, parentMessage: IMessage, reply: string, members: Array<string>, appId: string): Promise<string> {
        throw new Error('Method not implemented.');
    }

    public delete(roomId: string, appId: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    public getLeaders(roomId: string, appId: string): Promise<Array<IUser>> {
        throw new Error('Method not implemented.');
    }

    public getModerators(roomId: string, appId: string): Promise<Array<IUser>> {
        throw new Error('Method not implemented.');
    }

    public getOwners(roomId: string, appId: string): Promise<Array<IUser>> {
        throw new Error('Method not implemented.');
    }

    public removeUsers(roomId: string, usernames: string[], appId: string): Promise<void> {
        throw new Error('Method not implemented');
    }

    public getUnreadByUser(roomId: string, uid: string, options: GetMessagesOptions, appId: string): Promise<IMessageRaw[]> {
        throw new Error('Method not implemented.');
    }

    protected getUserUnreadMessageCount(roomId: string, uid: string, appId: string): Promise<number> {
        throw new Error('Method not implemented.');
    }
}
