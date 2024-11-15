import { BaseBridge } from './BaseBridge';
import type { ITypingOptions } from '../../definition/accessors/INotifier';
import type { IMessage, Reaction } from '../../definition/messages';
import type { IRoom } from '../../definition/rooms';
import type { IUser } from '../../definition/users';
export interface ITypingDescriptor extends ITypingOptions {
    isTyping: boolean;
}
export declare abstract class MessageBridge extends BaseBridge {
    doCreate(message: IMessage, appId: string): Promise<string>;
    doUpdate(message: IMessage, appId: string): Promise<void>;
    doNotifyUser(user: IUser, message: IMessage, appId: string): Promise<void>;
    doNotifyRoom(room: IRoom, message: IMessage, appId: string): Promise<void>;
    doTyping(options: ITypingDescriptor, appId: string): Promise<void>;
    doGetById(messageId: string, appId: string): Promise<IMessage>;
    doDelete(message: IMessage, user: IUser, appId: string): Promise<void>;
    doAddReaction(messageId: string, userId: string, reaction: Reaction, appId: string): Promise<void>;
    doRemoveReaction(messageId: string, userId: string, reaction: Reaction, appId: string): Promise<void>;
    protected abstract create(message: IMessage, appId: string): Promise<string>;
    protected abstract update(message: IMessage, appId: string): Promise<void>;
    protected abstract notifyUser(user: IUser, message: IMessage, appId: string): Promise<void>;
    protected abstract notifyRoom(room: IRoom, message: IMessage, appId: string): Promise<void>;
    protected abstract typing(options: ITypingDescriptor, appId: string): Promise<void>;
    protected abstract getById(messageId: string, appId: string): Promise<IMessage>;
    protected abstract delete(message: IMessage, user: IUser, appId: string): Promise<void>;
    protected abstract addReaction(messageId: string, userId: string, reaction: Reaction): Promise<void>;
    protected abstract removeReaction(messageId: string, userId: string, reaction: Reaction): Promise<void>;
    private hasReadPermission;
    private hasWritePermission;
}
