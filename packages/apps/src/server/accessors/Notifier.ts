import type { IMessageBuilder, INotifier } from '@rocket.chat/apps-engine/definition/accessors';
import type { ITypingOptions } from '@rocket.chat/apps-engine/definition/accessors/INotifier';
import { TypingScope } from '@rocket.chat/apps-engine/definition/accessors/INotifier';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';

import type { MessageBridge, UserBridge } from '../bridges';
import { MessageBuilder } from './MessageBuilder';

export class Notifier implements INotifier {
	constructor(
		private readonly userBridge: UserBridge,
		private readonly msgBridge: MessageBridge,
		private readonly appId: string,
	) {}

	public async notifyUser(user: IUser, message: IMessage): Promise<void> {
		if (!message.sender?.id) {
			const appUser = (await this.userBridge.doGetAppUser(this.appId)) as IUser;

			message.sender = appUser;
		}

		await this.msgBridge.doNotifyUser(user, message, this.appId);
	}

	public async notifyRoom(room: IRoom, message: IMessage): Promise<void> {
		if (!message.sender?.id) {
			const appUser = (await this.userBridge.doGetAppUser(this.appId)) as IUser;

			message.sender = appUser;
		}

		await this.msgBridge.doNotifyRoom(room, message, this.appId);
	}

	public async typing(options: ITypingOptions): Promise<() => Promise<void>> {
		options.scope = options.scope || TypingScope.Room;

		if (!options.username) {
			const appUser = await this.userBridge.doGetAppUser(this.appId);
			options.username = appUser?.name || '';
		}

		void this.msgBridge.doTyping({ ...options, isTyping: true }, this.appId);

		return () => this.msgBridge.doTyping({ ...options, isTyping: false }, this.appId);
	}

	public getMessageBuilder(): IMessageBuilder {
		return new MessageBuilder();
	}
}
