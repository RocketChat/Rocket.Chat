import type { IMessageBuilder, INotifier } from '@rocket.chat/apps-engine/definition/accessors';
import type { ITypingOptions } from '@rocket.chat/apps-engine/definition/accessors/INotifier.ts';
import type { _TypingScope } from '@rocket.chat/apps-engine/definition/accessors/INotifier.ts';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';
import { MessageBuilder } from './builders/MessageBuilder.ts';
import { AppObjectRegistry } from '../../AppObjectRegistry.ts';
import * as Messenger from '../messenger.ts';
import { require } from "../require.ts";

const { TypingScope } = require('@rocket.chat/apps-engine/definition/accessors/INotifier.js') as {
    TypingScope: typeof _TypingScope;
};

export class Notifier implements INotifier {
    private senderFn: typeof Messenger.sendRequest;

    constructor(senderFn: typeof Messenger.sendRequest) {
        this.senderFn = senderFn;
    }

    public async notifyUser(user: IUser, message: IMessage): Promise<void> {
        if (!message.sender || !message.sender.id) {
            const appUser = await this.getAppUser();

            message.sender = appUser;
        }

        await this.callMessageBridge('doNotifyUser', [user, message, AppObjectRegistry.get<string>('id')]);
    }

    public async notifyRoom(room: IRoom, message: IMessage): Promise<void> {
        if (!message.sender || !message.sender.id) {
            const appUser = await this.getAppUser();

            message.sender = appUser;
        }

        await this.callMessageBridge('doNotifyRoom', [room, message, AppObjectRegistry.get<string>('id')]);
    }

    public async typing(options: ITypingOptions): Promise<() => Promise<void>> {
        options.scope = options.scope || TypingScope.Room;

        if (!options.username) {
            const appUser = await this.getAppUser();
            options.username = (appUser && appUser.name) || '';
        }

        const appId = AppObjectRegistry.get<string>('id');

        await this.callMessageBridge('doTyping', [{ ...options, isTyping: true }, appId]);

        return async () => {
            await this.callMessageBridge('doTyping', [{ ...options, isTyping: false }, appId]);
        };
    }

    public getMessageBuilder(): IMessageBuilder {
        return new MessageBuilder();
    }

    private async callMessageBridge(method: string, params: Array<unknown>): Promise<void> {
        await this.senderFn({
            method: `bridges:getMessageBridge:${method}`,
            params,
        });
    }

    private async getAppUser(): Promise<IUser | undefined> {
        const response = await this.senderFn({ method: 'bridges:getUserBridge:doGetAppUser', params: [AppObjectRegistry.get<string>('id')] });
        return response.result;
    }
}
