import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { insertOrUpdateEmoji } from '../lib/insertOrUpdateEmoji';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		insertOrUpdateEmoji(emojiData: {
			_id?: string;
			name: string;
			aliases: string;
			extension: string;
			previousName?: string;
			previousExtension?: string;
			newFile?: boolean;
		}): string | boolean;
	}
}

Meteor.methods<ServerMethods>({
	async insertOrUpdateEmoji(emojiData) {
		methodDeprecationLogger.method('insertOrUpdateEmoji', '9.0.0', ['/v1/emoji-custom.create', '/v1/emoji-custom.update']);
		const emoji = await insertOrUpdateEmoji(this.userId, emojiData);

		if (!emojiData._id) {
			return emoji._id;
		}

		return !!emoji;
	},
});
