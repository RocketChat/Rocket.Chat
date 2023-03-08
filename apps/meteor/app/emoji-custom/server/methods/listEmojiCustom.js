import { Meteor } from 'meteor/meteor';
import { EmojiCustom } from '@rocket.chat/models';
import { check, Match } from 'meteor/check';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

/**
 * @deprecated Will be removed in future versions.
 */

Meteor.methods({
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
