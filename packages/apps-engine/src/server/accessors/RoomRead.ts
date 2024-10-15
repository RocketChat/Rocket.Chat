import type { IRoomRead } from '../../definition/accessors';
import type { IMessageRaw } from '../../definition/messages';
import type { IRoom } from '../../definition/rooms';
import type { IUser } from '../../definition/users';
import type { RoomBridge } from '../bridges';
import { type GetMessagesOptions, GetMessagesSortableFields } from '../bridges/RoomBridge';

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

    public getMessages(roomId: string, options: Partial<GetMessagesOptions> = {}): Promise<IMessageRaw[]> {
        if (typeof options.limit !== 'undefined' && (!Number.isFinite(options.limit) || options.limit > 100)) {
            throw new Error(`Invalid limit provided. Expected number <= 100, got ${options.limit}`);
        }

        options.limit ??= 100;

        if (options.sort) {
            this.validateSort(options.sort);
        }

        return this.roomBridge.doGetMessages(roomId, options as GetMessagesOptions, this.appId);
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

    // If there are any invalid fields or values, throw
    private validateSort(sort: Record<string, unknown>) {
        Object.entries(sort).forEach(([key, value]) => {
            if (!GetMessagesSortableFields.includes(key as (typeof GetMessagesSortableFields)[number])) {
                throw new Error(`Invalid key "${key}" used in sort. Available keys for sorting are ${GetMessagesSortableFields.join(', ')}`);
            }

            if (value !== 'asc' && value !== 'desc') {
                throw new Error(`Invalid sort direction for field "${key}". Expected "asc" or "desc", got ${value}`);
            }
        });
    }
}
