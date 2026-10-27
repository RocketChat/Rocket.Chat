import type { IMessageRead } from '@rocket.chat/apps-engine/definition/accessors';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';

import { bridgeCall } from '../../bridges/bridgeCall';
import type * as Messenger from '../../messenger';

export class MessageRead implements IMessageRead {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	public getById(id: string): Promise<IMessage> {
		return bridgeCall<IMessage>(this.senderFn, 'getMessageBridge', 'doGetById', id, 'APP_ID');
	}

	public async getSenderUser(messageId: string): Promise<IUser> {
		const msg = (await bridgeCall(this.senderFn, 'getMessageBridge', 'doGetById', messageId, 'APP_ID')) as IMessage;

		if (!msg) {
			return undefined;
		}

		return msg.sender;
	}

	public async getRoom(messageId: string): Promise<IRoom> {
		const msg = (await bridgeCall(this.senderFn, 'getMessageBridge', 'doGetById', messageId, 'APP_ID')) as IMessage;

		if (!msg) {
			return undefined;
		}

		return msg.room;
	}
}
