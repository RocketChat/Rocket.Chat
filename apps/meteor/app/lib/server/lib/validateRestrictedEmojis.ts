import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { settings } from '../../../settings/server';

export const assertNoRestrictedEmojis = async (uid: string, msg: string | undefined, method: string): Promise<void> => {
	const restrictedEmojisString = settings.get<string>('Emoji_Restricted_For_Users');
	if (!restrictedEmojisString || !msg) {
		return;
	}

	const hasManageEmojiPermission = await hasPermissionAsync(uid, 'manage-emoji');
	if (hasManageEmojiPermission) {
		return;
	}

	const restrictedEmojis = restrictedEmojisString.split(',').map((emoji) => emoji.trim()).filter(Boolean);
	if (!restrictedEmojis.length) {
		return;
	}

	const emojiRegex = /:([a-zA-Z0-9_+-]+):/g;
	const matches = msg.matchAll(emojiRegex);

	for (const match of matches) {
		const emojiName = match[1];
		if (restrictedEmojis.includes(emojiName)) {
			throw new Meteor.Error('error-emoji-restricted', `Emoji :${emojiName}: is restricted`, {
				method,
				emoji: emojiName,
			});
		}
	}
};
