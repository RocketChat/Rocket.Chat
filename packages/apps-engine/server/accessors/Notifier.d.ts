import type { IMessageBuilder, INotifier } from '../../definition/accessors';
import type { ITypingOptions } from '../../definition/accessors/INotifier';
import type { IMessage } from '../../definition/messages';
import type { IRoom } from '../../definition/rooms';
import type { IUser } from '../../definition/users';
import type { MessageBridge, UserBridge } from '../bridges';
export declare class Notifier implements INotifier {
    private readonly userBridge;
    private readonly msgBridge;
    private readonly appId;
    constructor(userBridge: UserBridge, msgBridge: MessageBridge, appId: string);
    notifyUser(user: IUser, message: IMessage): Promise<void>;
    notifyRoom(room: IRoom, message: IMessage): Promise<void>;
    typing(options: ITypingOptions): Promise<() => Promise<void>>;
    getMessageBuilder(): IMessageBuilder;
}
