import type { IRoomRead } from '../../definition/accessors';
import type { IMessageRaw } from '../../definition/messages';
import type { IRoom } from '../../definition/rooms';
import type { IUser } from '../../definition/users';
import type { RoomBridge } from '../bridges';
import { type GetMessagesOptions } from '../bridges/RoomBridge';
export declare class RoomRead implements IRoomRead {
    private roomBridge;
    private appId;
    constructor(roomBridge: RoomBridge, appId: string);
    getById(id: string): Promise<IRoom>;
    getCreatorUserById(id: string): Promise<IUser>;
    getByName(name: string): Promise<IRoom>;
    getCreatorUserByName(name: string): Promise<IUser>;
    getMessages(roomId: string, options?: Partial<GetMessagesOptions>): Promise<IMessageRaw[]>;
    getMembers(roomId: string): Promise<Array<IUser>>;
    getDirectByUsernames(usernames: Array<string>): Promise<IRoom>;
    getModerators(roomId: string): Promise<Array<IUser>>;
    getOwners(roomId: string): Promise<Array<IUser>>;
    getLeaders(roomId: string): Promise<Array<IUser>>;
    getUnreadByUser(roomId: string, uid: string, options?: Partial<GetMessagesOptions>): Promise<IMessageRaw[]>;
    getUserUnreadMessageCount(roomId: string, uid: string): Promise<number>;
    private validateSort;
}
