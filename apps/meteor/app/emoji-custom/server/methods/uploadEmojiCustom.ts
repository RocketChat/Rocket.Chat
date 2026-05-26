import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { uploadEmojiCustom } from '../lib/uploadEmojiCustom';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		uploadEmojiCustom(
			binaryContent: string,
			contentType: string,
			emojiData: {
				name: string;
				aliases?: string;
				extension: string;
			},
		): void;
	}
}

Meteor.methods<ServerMethods>({
	async uploadEmojiCustom(binaryContent, contentType, emojiData) {
		methodDeprecationLogger.method('uploadEmojiCustom', '9.0.0', '/v1/emoji-custom.create');
		await uploadEmojiCustom(this.userId, binaryContent, contentType, emojiData);
	},
});
