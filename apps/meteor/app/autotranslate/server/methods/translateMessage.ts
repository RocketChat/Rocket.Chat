import { Meteor } from 'meteor/meteor';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import type { IMessage } from '@rocket.chat/core-typings';

import { Rooms } from '../../../models/server';
import { TranslationProviderRegistry } from '..';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'autoTranslate.translateMessage'(message: IMessage | undefined, targetLanguage: string): void;
	}
}

Meteor.methods<ServerMethods>({
	async 'autoTranslate.translateMessage'(message, targetLanguage) {
		if (!TranslationProviderRegistry.enabled) {
			return;
		}
		const room = Rooms.findOneById(message?.rid);
		if (message && room) {
			await TranslationProviderRegistry.translateMessage(message, room, targetLanguage);
		}
	},
});
