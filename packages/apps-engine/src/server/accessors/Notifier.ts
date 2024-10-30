import type { IMessageBuilder, INotifier } from '../../definition/accessors';
import type { ITypingOptions } from '../../definition/accessors/INotifier';
import { TypingScope } from '../../definition/accessors/INotifier';
import type { IMessage } from '../../definition/messages';
import type { IRoom } from '../../definition/rooms';
import type { IUser } from '../../definition/users';
import type { MessageBridge, UserBridge } from '../bridges';
import { MessageBuilder } from './MessageBuilder';

export class Notifier implements INotifier {
    constructor(
        private readonly userBridge: UserBridge,
        private readonly msgBridge: MessageBridge,
        private readonly appId: string,
    ) {}

    public async notifyUser(user: IUser, message: IMessage): Promise<void> {
        if (!message.sender || !message.sender.id) {
            const appUser = await this.userBridge.doGetAppUser(this.appId);

            message.sender = appUser;
        }

        await this.msgBridge.doNotifyUser(user, message, this.appId);
    }

    public async notifyRoom(room: IRoom, message: IMessage): Promise<void> {
        if (!message.sender || !message.sender.id) {
            const appUser = await this.userBridge.doGetAppUser(this.appId);

            message.sender = appUser;
        }

        await this.msgBridge.doNotifyRoom(room, message, this.appId);
    }

    public async typing(options: ITypingOptions): Promise<() => Promise<void>> {
        options.scope = options.scope || TypingScope.Room;

        if (!options.username) {
            const appUser = await this.userBridge.doGetAppUser(this.appId);
            options.username = (appUser && appUser.name) || '';
        }

        this.msgBridge.doTyping({ ...options, isTyping: true }, this.appId);

        return () => this.msgBridge.doTyping({ ...options, isTyping: false }, this.appId);
    }

    public getMessageBuilder(): IMessageBuilder {
        return new MessageBuilder();
    }
}
