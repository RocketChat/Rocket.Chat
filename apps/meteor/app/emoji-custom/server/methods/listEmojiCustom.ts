import { Meteor } from 'meteor/meteor';
import { EmojiCustom } from '@rocket.chat/models';
import { check, Match } from 'meteor/check';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import type { IEmojiCustom } from '@rocket.chat/core-typings';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		listEmojiCustom(options?: { name?: string; aliases?: string[] }): IEmojiCustom[];
	}
}

Meteor.methods<ServerMethods>({
	async listEmojiCustom(options = {}) {
		methodDeprecationLogger.warn('listEmojiCustom will be removed in future versions of Rocket.Chat');

		const user = Meteor.user();

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
