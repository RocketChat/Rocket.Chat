import { IMessage, MessageTypesValues } from '../../../definition/IMessage';
import type keys from '../../../packages/rocketchat-i18n/i18n/en.i18n.json';

export interface IMessageType {
	id: MessageTypesValues;
	system: boolean;
	message: keyof typeof keys;
	data?: (message: IMessage) => any;
}

type MessageTypes = {
	[k in MessageTypesValues]?: IMessageType;
};

export const MessageTypes = new (class {
	private types: MessageTypes = {};

	constructor() {
		this.types = {};
	}

	registerType(options: IMessageType): IMessageType {
		this.types[options.id] = options;
		return options;
	}

	getType(message: IMessage): IMessageType | undefined {
		if (!message?.t) {
			return;
		}
		return this.types[message.t];
	}

	isSystemMessage(message: IMessage): boolean {
		if (!message?.t) {
			return false;
		}

		const type = this.types[message.t];
		return type?.system || false;
	}
})();
