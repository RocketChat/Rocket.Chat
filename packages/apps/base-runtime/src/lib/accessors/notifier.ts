import type { IMessageBuilder, INotifier } from '@rocket.chat/apps-engine/definition/accessors';
import type { ITypingOptions } from '@rocket.chat/apps-engine/definition/accessors/INotifier';
import { TypingScope } from '@rocket.chat/apps-engine/definition/accessors/INotifier';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';

import type * as Messenger from '../messenger';
import { MessageBuilder } from './builders/MessageBuilder';
import { RemoteBridges } from '../bridges/RemoteBridges';

export class Notifier implements INotifier {
	private readonly senderFn: typeof Messenger.sendRequest;

	private readonly bridges: RemoteBridges;

	constructor(senderFn: typeof Messenger.sendRequest) {
		this.senderFn = senderFn;
		// The facade reads `this.senderFn` at call time (rather than capturing it) so
		// that tests which swap out `senderFn` after construction remain intercepted.
		this.bridges = new RemoteBridges((request) => this.senderFn(request));
	}

	public async notifyUser(user: IUser, message: IMessage): Promise<void> {
		if (!message.sender?.id) {
			const appUser = await this.getAppUser();

			message.sender = appUser as IUser;
		}

		await this.bridges.getMessageBridge().doNotifyUser(user, message, 'APP_ID');
	}

	public async notifyRoom(room: IRoom, message: IMessage): Promise<void> {
		if (!message.sender?.id) {
			const appUser = await this.getAppUser();

			message.sender = appUser as IUser;
		}

		await this.bridges.getMessageBridge().doNotifyRoom(room, message, 'APP_ID');
	}

	public async typing(options: ITypingOptions): Promise<() => Promise<void>> {
		options.scope = options.scope || TypingScope.Room;

		if (!options.username) {
			const appUser = await this.getAppUser();
			options.username = appUser?.name || '';
		}

		await this.bridges.getMessageBridge().doTyping({ ...options, isTyping: true }, 'APP_ID');

		return async () => {
			await this.bridges.getMessageBridge().doTyping({ ...options, isTyping: false }, 'APP_ID');
		};
	}

	public getMessageBuilder(): IMessageBuilder {
		return new MessageBuilder();
	}

	private async getAppUser(): Promise<IUser | undefined> {
		return this.bridges.getUserBridge().doGetAppUser('APP_ID') as Promise<IUser | undefined>;
	}
}
