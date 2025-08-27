import type { MessageTypesValues, IMessage } from '@rocket.chat/core-typings';
import type { TFunction } from 'i18next';

type MessageType = {
	readonly id: MessageTypesValues;
	readonly system: boolean;
	readonly text: (t: TFunction, message: IMessage) => string;
};

export class MessageTypes {
	private types = new Map<MessageTypesValues, MessageType>();

	registerType(options: MessageType): void {
		this.types.set(options.id, options);
	}

	getType(message: Pick<IMessage, 't'>): MessageType | undefined {
		return message.t ? this.types.get(message.t) : undefined;
	}

	isSystemMessage(message: Pick<IMessage, 't'>): boolean {
		return this.getType(message)?.system ?? false;
	}
}
