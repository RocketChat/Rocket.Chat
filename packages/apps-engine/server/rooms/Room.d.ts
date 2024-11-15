import type { IRoom, RoomType } from '../../definition/rooms';
import type { IUser } from '../../definition/users';
import type { AppManager } from '../AppManager';
declare const PrivateManager: unique symbol;
export declare class Room implements IRoom {
    id: string;
    displayName?: string;
    slugifiedName: string;
    type: RoomType;
    creator: IUser;
    isDefault?: boolean;
    isReadOnly?: boolean;
    displaySystemMessages?: boolean;
    messageCount?: number;
    createdAt?: Date;
    updatedAt?: Date;
    lastModifiedAt?: Date;
    customFields?: {
        [key: string]: any;
    };
    userIds?: Array<string>;
    private _USERNAMES;
    private [PrivateManager];
    /**
     * @deprecated
     */
    get usernames(): Array<string>;
    set usernames(usernames: Array<string>);
    constructor(room: IRoom, manager: AppManager);
    get value(): object;
    getUsernames(): Promise<Array<string>>;
    toJSON(): object;
    toString(): object;
    valueOf(): object;
}
export {};
