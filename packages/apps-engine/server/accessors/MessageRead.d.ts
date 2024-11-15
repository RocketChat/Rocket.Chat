import type { IMessageRead } from '../../definition/accessors';
import type { IMessage } from '../../definition/messages';
import type { IRoom } from '../../definition/rooms';
import type { IUser } from '../../definition/users';
import type { MessageBridge } from '../bridges/MessageBridge';
export declare class MessageRead implements IMessageRead {
    private messageBridge;
    private appId;
    constructor(messageBridge: MessageBridge, appId: string);
    getById(id: string): Promise<IMessage>;
    getSenderUser(messageId: string): Promise<IUser>;
    getRoom(messageId: string): Promise<IRoom>;
}
