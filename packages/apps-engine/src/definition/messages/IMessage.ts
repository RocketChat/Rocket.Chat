import type { LayoutBlock } from '@rocket.chat/ui-kit';

import type { IRoom } from '../rooms';
import type { IBlock } from '../uikit';
import type { IUser, IUserLookup } from '../users';
import type { IMessageAttachment } from './IMessageAttachment';
import type { IMessageFile } from './IMessageFile';
import type { IMessageReactions } from './IMessageReaction';
import type { MessageType } from './MessageType';

export interface IMessage {
    id?: string;
    threadId?: string;
    room: IRoom;
    sender: IUser;
    text?: string;
    createdAt?: Date;
    updatedAt?: Date;
    editor?: IUser;
    editedAt?: Date;
    emoji?: string;
    avatarUrl?: string;
    alias?: string;
    file?: IMessageFile;
    attachments?: Array<IMessageAttachment>;
    reactions?: IMessageReactions;
    groupable?: boolean;
    parseUrls?: boolean;
    customFields?: { [key: string]: any };
    blocks?: Array<IBlock | LayoutBlock>;
    starred?: Array<{ _id: string }>;
    pinned?: boolean;
    pinnedAt?: Date;
    pinnedBy?: IUserLookup;
    type?: MessageType;
}
