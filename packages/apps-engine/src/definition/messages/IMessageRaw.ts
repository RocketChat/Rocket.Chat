import type { IBlock, Block } from '@rocket.chat/ui-kit';

import type { IRoom } from '../rooms';
import type { IUserLookup } from '../users';
import type { IMessageAttachment } from './IMessageAttachment';
import type { IMessageFile } from './IMessageFile';
import type { IMessageReactions } from './IMessageReaction';

/**
 * The raw version of a message, without resolved information for relationship fields, i.e.
 * `room`, `sender` and `editor` are not the complete entity like they are in `IMessage`
 *
 * This is used in methods that fetch multiple messages at the same time, as resolving the relationship
 * fields require additional queries to the database and would hit the system's performance significantly.
 */
export interface IMessageRaw {
    id: string;
    roomId: IRoom['id'];
    sender: IUserLookup;
    createdAt: Date;
    threadId?: string;
    text?: string;
    updatedAt?: Date;
    editor?: IUserLookup;
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
    blocks?: Array<IBlock | Block>;
    starred?: Array<{ _id: string }>;
    pinned?: boolean;
    pinnedAt?: Date;
    pinnedBy?: IUserLookup;
}
