import type { IEmojiCustom } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { EmojiCustom } from '@rocket.chat/models';
import { check, Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		listEmojiCustom(options?: { name?: string; aliases?: string[] }): IEmojiCustom[];
	}
}

Meteor.methods<ServerMethods>({
	async listEmojiCustom(options = {}) {
		methodDeprecationLogger.method('listEmojiCustom', '7.0.0');

		const user = await Meteor.userAsync();

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'listEmojiCustom',
			});
		}

		check(options, {
			name: Match.Optional(String),
			aliases: Match.Optional([String]),
		});

		return EmojiCustom.find(options).toArray();
	},
});
