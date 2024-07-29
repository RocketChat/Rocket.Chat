import type { IRoomRead } from '../../definition/accessors';
import type { IMessage } from '../../definition/messages';
import type { IRoom } from '../../definition/rooms';
import type { IUser } from '../../definition/users';
import type { RoomBridge } from '../bridges';

export class RoomRead implements IRoomRead {
    constructor(private roomBridge: RoomBridge, private appId: string) {}

    public getById(id: string): Promise<IRoom> {
        return this.roomBridge.doGetById(id, this.appId);
    }

    public getCreatorUserById(id: string): Promise<IUser> {
        return this.roomBridge.doGetCreatorById(id, this.appId);
    }

    public getByName(name: string): Promise<IRoom> {
        return this.roomBridge.doGetByName(name, this.appId);
    }

    public getCreatorUserByName(name: string): Promise<IUser> {
        return this.roomBridge.doGetCreatorByName(name, this.appId);
    }

    public getMessages(roomId: string): Promise<IterableIterator<IMessage>> {
        throw new Error('Method not implemented.');
    }

    public getMembers(roomId: string): Promise<Array<IUser>> {
        return this.roomBridge.doGetMembers(roomId, this.appId);
    }

    public getDirectByUsernames(usernames: Array<string>): Promise<IRoom> {
        return this.roomBridge.doGetDirectByUsernames(usernames, this.appId);
    }

    public getModerators(roomId: string): Promise<Array<IUser>> {
        return this.roomBridge.doGetModerators(roomId, this.appId);
    }

    public getOwners(roomId: string): Promise<Array<IUser>> {
        return this.roomBridge.doGetOwners(roomId, this.appId);
    }

    public getLeaders(roomId: string): Promise<Array<IUser>> {
        return this.roomBridge.doGetLeaders(roomId, this.appId);
    }
}
