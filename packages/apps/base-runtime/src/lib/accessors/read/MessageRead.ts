import type { IMessageRead } from '@rocket.chat/apps-engine/definition/accessors';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';

import type { RemoteBridges } from '../../bridges/RemoteBridges';

export class MessageRead implements IMessageRead {
	constructor(private readonly bridges: RemoteBridges) {}

	public getById(id: string): Promise<IMessage> {
		return this.bridges.getMessageBridge().doGetById(id, 'APP_ID') as Promise<IMessage>;
	}

	public async getSenderUser(messageId: string): Promise<IUser> {
		const msg = (await this.bridges.getMessageBridge().doGetById(messageId, 'APP_ID')) as IMessage;

		if (!msg) {
			return undefined;
		}

		return msg.sender;
	}

	public async getRoom(messageId: string): Promise<IRoom> {
		const msg = (await this.bridges.getMessageBridge().doGetById(messageId, 'APP_ID')) as IMessage;

		if (!msg) {
			return undefined;
		}

		return msg.room;
	}
}
