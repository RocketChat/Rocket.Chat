import type { LayoutBlock } from '@rocket.chat/ui-kit';
import type { IMessage, IMessageAttachment, IMessageFile, IMessageReactions } from '../../definition/messages';
import type { IUser, IUserLookup } from '../../definition/users';
import type { AppManager } from '../AppManager';
import { Room } from '../rooms/Room';
export declare class Message implements IMessage {
    private manager;
    id?: string;
    sender: IUser;
    text?: string;
    createdAt?: Date;
    updatedAt?: Date;
    editor?: IUser;
    editedAt?: Date;
    emoji?: string;
    avatarUrl?: string;
    alias?: string;
    attachments?: Array<IMessageAttachment>;
    reactions?: IMessageReactions;
    groupable?: boolean;
    parseUrls?: boolean;
    customFields?: {
        [key: string]: any;
    };
    threadId?: string;
    file?: IMessageFile;
    blocks?: Array<LayoutBlock>;
    starred?: Array<{
        _id: string;
    }>;
    pinned?: boolean;
    pinnedAt?: Date;
    pinnedBy?: IUserLookup;
    private _ROOM;
    get room(): Room;
    set room(room: Room);
    constructor(message: IMessage, manager: AppManager);
    get value(): object;
    toJSON(): object;
    toString(): object;
    valueOf(): object;
}
