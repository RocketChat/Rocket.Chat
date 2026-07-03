import type { IDiscussionBuilder } from '@rocket.chat/apps-engine/definition/accessors/IDiscussionBuilder';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages/IMessage';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms/IRoom';

import { RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms/RoomType';

import { RoomBuilder } from './RoomBuilder';

export class DiscussionBuilder extends RoomBuilder implements IDiscussionBuilder {
	public override kind: RocketChatAssociationModel.DISCUSSION;

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
		return this.room.parentRoom!;
	}

	public setReply(reply: string): IDiscussionBuilder {
		this.reply = reply;
		return this;
	}

	public getReply(): string {
		return this.reply!;
	}

	public setParentMessage(parentMessage: IMessage): IDiscussionBuilder {
		this.parentMessage = parentMessage;
		return this;
	}

	public getParentMessage(): IMessage {
		return this.parentMessage!;
	}
}
