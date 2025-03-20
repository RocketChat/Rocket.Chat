import type { IMessage } from '@rocket.chat/core-typings';

import type { IAppsMessage, IAppsMesssageRaw } from '../AppsEngine';

export interface IAppMessagesConverter {
	convertById(messageId: IMessage['_id']): Promise<IAppsMessage | undefined>;
	convertMessage(message: undefined | null): Promise<undefined>;
	convertMessage(message: IMessage): Promise<IAppsMessage>;
	convertMessage(message: IMessage | undefined | null): Promise<IAppsMessage | undefined>;
	convertAppMessage(message: undefined | null): Promise<undefined>;
	convertAppMessage(message: IAppsMessage): Promise<IMessage | undefined>;
	convertAppMessage(message: IAppsMessage, isPartial: boolean): Promise<Partial<IMessage>>;
	convertAppMessage(message: IAppsMessage | undefined | null): Promise<IMessage | undefined>;
	convertMessageRaw(message: IMessage): Promise<IAppsMesssageRaw>;
	convertMessageRaw(message: IMessage | undefined | null): Promise<IAppsMesssageRaw | undefined>;
}
