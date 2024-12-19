import type { IMessage } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';

import { TranslationProviderRegistry } from '..';

export const translateMessage = async (targetLanguage?: string, message?: IMessage) => {
	if (!TranslationProviderRegistry.enabled) {
		return;
	}
	if (!message?.rid) {
		return;
	}

	const room = await Rooms.findOneById(message?.rid);
	if (message && room) {
		await TranslationProviderRegistry.translateMessage(message, room, targetLanguage);
	}
};
