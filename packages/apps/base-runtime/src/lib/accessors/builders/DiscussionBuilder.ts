import type { IDiscussionBuilder } from '@rocket.chat/apps-engine/definition/accessors/IDiscussionBuilder.js';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages/IMessage.js';
import { RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations.js';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms/IRoom.js';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms/RoomType.js';

import { RoomBuilder } from './RoomBuilder.js';

export class DiscussionBuilder extends RoomBuilder implements IDiscussionBuilder {
	declare public kind: RocketChatAssociationModel.DISCUSSION;

	private reply?: string;

	private parentMessage?: IMessage;

	constructor(data?: Partial<IRoom>) {
		super(data);
		this.kind = RocketChatAssociationModel.DISCUSSION;
		this.room.type = RoomType.PRIVATE_GROUP;
	}

	public setParentRoom(parentRoom: IRoom): IDiscussionBuilder {
		this.room.parentRoom = parentRoom;
		return this;
	}

	public getParentRoom(): IRoom {
		return this.room.parentRoom;
	}

	public setReply(reply: string): IDiscussionBuilder {
		this.reply = reply;
		return this;
	}

	public getReply(): string {
		return this.reply;
	}

	public setParentMessage(parentMessage: IMessage): IDiscussionBuilder {
		this.parentMessage = parentMessage;
		return this;
	}

	public getParentMessage(): IMessage {
		return this.parentMessage;
	}
}
