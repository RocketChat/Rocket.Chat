import emojione from 'emojione';
import { Meteor } from 'meteor/meteor';

import { isRestrictedEmoji, parseRestrictedEmojis } from '../../../../lib/emoji/restrictedEmojis';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { settings } from '../../../settings/server';

export const assertNoRestrictedEmojis = async (uid: string, msg: string | undefined, method: string): Promise<void> => {
	const restrictedEmojisString = settings.get<string>('Emoji_Restricted_For_Users');
	if (!restrictedEmojisString || !msg) {
		return;
	}

	if (await hasPermissionAsync(uid, 'manage-emoji')) {
		return;
	}

	const restrictedEmojis = parseRestrictedEmojis(restrictedEmojisString);
	if (!restrictedEmojis.length) {
		return;
	}

	const textToCheck = emojione.toShort(msg);
	const emojiRegex = /:([a-zA-Z0-9_+-]+):/g;

	for (const match of textToCheck.matchAll(emojiRegex)) {
		const emojiName = match[1];
		if (isRestrictedEmoji(emojiName, restrictedEmojis)) {
			throw new Meteor.Error('error-emoji-restricted', `Emoji :${emojiName}: is restricted`, {
				method,
				emoji: emojiName,
			});
		}
	}
};
