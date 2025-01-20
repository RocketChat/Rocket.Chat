import type { IMessage } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { translateMessage } from '../functions/translateMessage';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'autoTranslate.translateMessage'(message: IMessage | undefined, targetLanguage: string): Promise<void>;
	}
}

Meteor.methods<ServerMethods>({
	async 'autoTranslate.translateMessage'(message, targetLanguage) {
		return translateMessage(targetLanguage, message);
	},
});
