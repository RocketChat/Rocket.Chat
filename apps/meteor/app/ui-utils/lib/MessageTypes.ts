import type { IMessage, MessageTypesValues } from '@rocket.chat/core-typings';
import type { TranslationKey } from '@rocket.chat/ui-contexts';

export type MessageType = {
	id: MessageTypesValues;
	system?: boolean;
	/* deprecated */
	template?: (message: IMessage) => unknown;
	message: TranslationKey;
	data?: (message: IMessage) => Record<string, string>;
};

class MessageTypes {
	private types = new Map<MessageTypesValues, MessageType>();

	registerType(options: MessageType): MessageType {
		if ('render' in options) {
			console.warn('MessageType.render is deprecated. Use MessageType.message instead.', options.id);
		}
		if ('template' in options) {
			console.warn('MessageType.template is deprecated. Use MessageType.message instead.', options.id);
		}
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
