import type { IMessage } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { TranslationProviderRegistry } from '..';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'autoTranslate.translateMessage'(message: IMessage | undefined, targetLanguage: string): Promise<void>;
	}
}

Meteor.methods<ServerMethods>({
	async 'autoTranslate.translateMessage'(message, targetLanguage) {
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
	},
});
