import type { ITypingOptions } from '../../definition/accessors/INotifier';
import type { IMessage } from '../../definition/messages';
import type { IRoom } from '../../definition/rooms';
import type { IUser } from '../../definition/users';
import { PermissionDeniedError } from '../errors/PermissionDeniedError';
import { AppPermissionManager } from '../managers/AppPermissionManager';
import { AppPermissions } from '../permissions/AppPermissions';
import { BaseBridge } from './BaseBridge';

export interface ITypingDescriptor extends ITypingOptions {
    isTyping: boolean;
}

export abstract class MessageBridge extends BaseBridge {
    public async doCreate(message: IMessage, appId: string): Promise<string> {
        if (this.hasWritePermission(appId)) {
            return this.create(message, appId);
        }
    }

    public async doUpdate(message: IMessage, appId: string): Promise<void> {
        if (this.hasWritePermission(appId)) {
            return this.update(message, appId);
        }
    }

    public async doNotifyUser(user: IUser, message: IMessage, appId: string): Promise<void> {
        if (this.hasWritePermission(appId)) {
            return this.notifyUser(user, message, appId);
        }
    }

    public async doNotifyRoom(room: IRoom, message: IMessage, appId: string): Promise<void> {
        if (this.hasWritePermission(appId)) {
            return this.notifyRoom(room, message, appId);
        }
    }

    public async doTyping(options: ITypingDescriptor, appId: string): Promise<void> {
        if (this.hasWritePermission(appId)) {
            return this.typing(options, appId);
        }
    }

    public async doGetById(messageId: string, appId: string): Promise<IMessage> {
        if (this.hasReadPermission(appId)) {
            return this.getById(messageId, appId);
        }
    }

    public async doDelete(message: IMessage, user: IUser, appId: string): Promise<void> {
        if (this.hasWritePermission(appId)) {
            return this.delete(message, user, appId);
        }
    }

    protected abstract create(message: IMessage, appId: string): Promise<string>;

    protected abstract update(message: IMessage, appId: string): Promise<void>;

    protected abstract notifyUser(user: IUser, message: IMessage, appId: string): Promise<void>;

    protected abstract notifyRoom(room: IRoom, message: IMessage, appId: string): Promise<void>;

    protected abstract typing(options: ITypingDescriptor, appId: string): Promise<void>;

    protected abstract getById(messageId: string, appId: string): Promise<IMessage>;

    protected abstract delete(message: IMessage, user: IUser, appId: string): Promise<void>;

    private hasReadPermission(appId: string): boolean {
        if (AppPermissionManager.hasPermission(appId, AppPermissions.message.read)) {
            return true;
        }

        AppPermissionManager.notifyAboutError(
            new PermissionDeniedError({
                appId,
                missingPermissions: [AppPermissions.message.read],
            }),
        );

        return false;
    }

    private hasWritePermission(appId: string): boolean {
        if (AppPermissionManager.hasPermission(appId, AppPermissions.message.write)) {
            return true;
        }

        AppPermissionManager.notifyAboutError(
            new PermissionDeniedError({
                appId,
                missingPermissions: [AppPermissions.message.write],
            }),
        );

        return false;
    }
}
