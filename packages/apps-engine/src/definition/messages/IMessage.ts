import type { LayoutBlock } from '@rocket.chat/ui-kit';

import type { IRoom } from '../rooms';
import type { IBlock } from '../uikit';
import type { IUser, IUserLookup } from '../users';
import type { IMessageAttachment } from './IMessageAttachment';
import type { IMessageFile } from './IMessageFile';
import type { IMessageReactions } from './IMessageReaction';
import type { MessageType } from './MessageType';

/**
 * A message in a room.
 *
 * The same shape describes a message being read and one being built, which is
 * why only the room and the sender are required: a message an App creates
 * through `IMessageBuilder` has no id until it is saved.
 */
export interface IMessage {
	/** The message's identifier, once it is saved. */
	id?: string;
	/** The thread the message belongs to, when it is a reply in one. */
	threadId?: string;
	/** The room the message is in. */
	room: IRoom;
	/** Who the message is from. */
	sender: IUser;
	/** The message's text, in Rocket.Chat's markdown. */
	text?: string;
	/** When the message was posted. */
	createdAt?: Date;
	/** When the message record last changed. */
	updatedAt?: Date;
	/** Who last edited the message. */
	editor?: IUser;
	/** When the message was last edited. */
	editedAt?: Date;
	/** An emoji to show in place of the sender's avatar. */
	emoji?: string;
	/** An image to show in place of the sender's avatar. */
	avatarUrl?: string;
	/** A name to show in place of the sender's. */
	alias?: string;
	/** @deprecated Deprecated in favor of files */
	file?: IMessageFile;
	/** The files attached to the message. */
	files?: Array<IMessageFile>;
	/** The rich previews and quotes shown under the message. */
	attachments?: Array<IMessageAttachment>;
	/** Who reacted to the message, keyed by emoji. */
	reactions?: IMessageReactions;
	/** Whether the client may fold this message into the one above it. */
	groupable?: boolean;
	/** Whether Rocket.Chat should look for links in the text and build previews. */
	parseUrls?: boolean;
	/** The values filled into the workspace's custom message fields. */
	customFields?: { [key: string]: any };
	/** The UIKit blocks rendered under the message. */
	blocks?: Array<IBlock | LayoutBlock>;
	/** The users who starred the message. */
	starred?: Array<{ _id: string }>;
	/** Whether the message is pinned in its room. */
	pinned?: boolean;
	/** When the message was pinned. */
	pinnedAt?: Date;
	/** Who pinned the message. */
	pinnedBy?: IUserLookup;
	/** What the message announces, when it is a system message rather than one somebody wrote. */
	type?: MessageType;
}
