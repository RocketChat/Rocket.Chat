import type { IMessage } from '../../../src/definition/messages';
import type { IRoom } from '../../../src/definition/rooms';
import type { IUser } from '../../../src/definition/users';
import { RoomBridge } from '../../../src/server/bridges';

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
}
