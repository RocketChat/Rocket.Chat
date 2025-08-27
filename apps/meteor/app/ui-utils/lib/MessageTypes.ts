import type { IMessage, MessageTypesValues } from '@rocket.chat/core-typings';
import type { TFunction } from 'i18next';

export type MessageType = {
	id: MessageTypesValues;
	system?: boolean;
	text: (t: TFunction, message: IMessage) => string;
};

class MessageTypes {
	private types = new Map<MessageTypesValues, MessageType>();

	registerType(options: MessageType): MessageType {
		this.types.set(options.id, options);
		return options;
	}

	getType(message: Pick<IMessage, 't'>): MessageType | undefined {
		return message.t && this.types.get(message.t);
	}

	isSystemMessage(message: Pick<IMessage, 't'>): boolean {
		const type = this.getType(message);
		return Boolean(type?.system);
	}
}

const instance = new MessageTypes();

export { instance as MessageTypes };
