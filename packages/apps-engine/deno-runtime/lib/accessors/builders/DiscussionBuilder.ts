import type { IDiscussionBuilder as _IDiscussionBuilder } from '@rocket.chat/apps-engine/definition/accessors/IDiscussionBuilder.ts';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages/IMessage.ts';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms/IRoom.ts';
import type { IRoomBuilder } from '@rocket.chat/apps-engine/definition/accessors/IRoomBuilder.ts';

import type { RocketChatAssociationModel as _RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations.ts';
import type { RoomType as _RoomType } from '@rocket.chat/apps-engine/definition/rooms/RoomType.ts';

import { RoomBuilder } from './RoomBuilder.ts';
import { require } from '../../../lib/require.ts';

const { RocketChatAssociationModel } = require('@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations.js') as {
    RocketChatAssociationModel: typeof _RocketChatAssociationModel;
};

const { RoomType } = require('@rocket.chat/apps-engine/definition/rooms/RoomType.js') as { RoomType: typeof _RoomType };

export interface IDiscussionBuilder extends _IDiscussionBuilder, IRoomBuilder {}

export class DiscussionBuilder extends RoomBuilder implements IDiscussionBuilder {
    public kind: _RocketChatAssociationModel.DISCUSSION;

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
