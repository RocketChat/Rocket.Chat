import type { IMessage } from '@rocket.chat/core-typings';

import { sdk } from '../SDKClient';
import { mapMessageFromApi } from '../utils/mapMessageFromApi';

/**
 * Labeled messages arrive on the room stream without content, so each reader fetches the copy it is cleared for.
 */
export const resolveWithheldMessage = async (message: IMessage): Promise<IMessage> => {
	if (!message.securityWithheld) {
		return message;
	}
	try {
		const { message: resolved } = await sdk.rest.get('/v1/chat.getMessage', { msgId: message._id });
		return mapMessageFromApi(resolved);
	} catch {
		return message;
	}
};
