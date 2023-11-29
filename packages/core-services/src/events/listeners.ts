import type { IMessage } from '@rocket.chat/core-typings';

import type { IServiceClass } from '../types/ServiceClass';

export const dbWatchersDisabled = ['yes', 'true'].includes(String(process.env.DISABLE_DB_WATCHERS).toLowerCase());

export const listenToMessageSentEvent = (service: IServiceClass, action: (message: IMessage) => Promise<void>): void => {
	if (dbWatchersDisabled) {
		return service.onEvent('message.sent', (message: IMessage) => action(message));
	}
	return service.onEvent('watch.messages', ({ message }) => action(message));
};
