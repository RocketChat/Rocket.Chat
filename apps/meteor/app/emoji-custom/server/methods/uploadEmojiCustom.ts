import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { uploadEmojiCustom } from '../lib/uploadEmojiCustom';

declare module '@rocket.chat/ui-contexts' {
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
		await uploadEmojiCustom(this.userId, binaryContent, contentType, emojiData);
	},
});
