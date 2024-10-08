import type { IRoomBuilder } from '.';
import type { IMessage } from '../messages';
import type { RocketChatAssociationModel } from '../metadata';
import type { IRoom } from '../rooms';

/**
 * Interface for building out a room.
 * Please note, a room creator, name, and type must be set otherwise you will NOT
 * be able to successfully save the room object.
 */
export interface IDiscussionBuilder extends IRoomBuilder {
    kind: RocketChatAssociationModel.DISCUSSION;

    setParentRoom(parentRoom: IRoom): IDiscussionBuilder;

    getParentRoom(): IRoom;

    setParentMessage(parentMessage: IMessage): IDiscussionBuilder;

    getParentMessage(): IMessage;

    setReply(reply: string): IDiscussionBuilder;

    getReply(): string;
}
