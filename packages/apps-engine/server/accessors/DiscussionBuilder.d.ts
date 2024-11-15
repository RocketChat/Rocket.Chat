import { RoomBuilder } from './RoomBuilder';
import type { IDiscussionBuilder } from '../../definition/accessors';
import type { IMessage } from '../../definition/messages';
import { RocketChatAssociationModel } from '../../definition/metadata';
import type { IRoom } from '../../definition/rooms/IRoom';
export declare class DiscussionBuilder extends RoomBuilder implements IDiscussionBuilder {
    kind: RocketChatAssociationModel.DISCUSSION;
    private reply;
    private parentMessage;
    constructor(data?: Partial<IRoom>);
    setParentRoom(parentRoom: IRoom): IDiscussionBuilder;
    getParentRoom(): IRoom;
    setReply(reply: string): IDiscussionBuilder;
    getReply(): string;
    setParentMessage(parentMessage: IMessage): IDiscussionBuilder;
    getParentMessage(): IMessage;
}
