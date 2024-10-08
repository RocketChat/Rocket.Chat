import type { IUser } from '../users';
import type { RoomType } from './RoomType';

export interface IRoom {
    id: string;
    displayName?: string;
    slugifiedName: string;
    type: RoomType;
    creator: IUser;
    /**
     * @deprecated usernames will be removed on version 2.0.0
     */
    usernames: Array<string>;
    userIds?: Array<string>;
    isDefault?: boolean;
    isReadOnly?: boolean;
    displaySystemMessages?: boolean;
    messageCount?: number;
    createdAt?: Date;
    updatedAt?: Date;
    lastModifiedAt?: Date;
    description?: string;
    customFields?: { [key: string]: any };
    parentRoom?: IRoom;
    livechatData?: { [key: string]: any };
}
