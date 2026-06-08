import emojione from 'emojione';
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

	const mappedUnicode = emojione.mapUnicodeToShort();
	const unicodeRegex = emojione.unicodeCharRegex();

	if (unicodeRegex) {
		let regex: RegExp;
		if (typeof unicodeRegex === 'string') {
			regex = new RegExp(unicodeRegex, 'g');
		} else if (unicodeRegex instanceof RegExp) {
			regex = new RegExp(unicodeRegex.source, 'g');
		} else {
			return;
		}

		const unicodeMatches = msg.matchAll(regex);
		
		for (const match of unicodeMatches) {
			const unicodeChar = match[0];
			const codePoint = Array.from(unicodeChar)
				.map((char) => char.codePointAt(0)?.toString(16).padStart(4, '0'))
				.join('-');

			const shortname = mappedUnicode[codePoint];
			if (shortname) {
				const emojiName = shortname.slice(1, -1);
				if (restrictedEmojis.includes(emojiName)) {
					throw new Meteor.Error('error-emoji-restricted', `Emoji ${unicodeChar} is restricted`, {
						method,
						emoji: emojiName,
					});
				}
			}
		}
	}
};
