import { Meteor } from 'meteor/meteor';

import { getEmojiData } from '../../lib/emoji-native/generateEmojiData';
import { isRestrictedEmoji, parseRestrictedEmojis } from '../../lib/emoji/restrictedEmojis';
import { hasPermissionAsync } from './authorization/hasPermission';
import { settings } from '../settings';

let unicodeToShortcodeMap: Map<string, string> | null = null;
let unicodePattern: RegExp | null = null;

const getUnicodeToShortcodeMap = (): Map<string, string> => {
	if (!unicodeToShortcodeMap) {
		const { emojiList, bareAliases } = getEmojiData();
		unicodeToShortcodeMap = new Map();

		for (const [shortcode, entry] of Object.entries(emojiList)) {
			if (entry.unicode && !unicodeToShortcodeMap.has(entry.unicode)) {
				unicodeToShortcodeMap.set(entry.unicode, shortcode);
			}
		}

		for (const [bare, shortcode] of bareAliases) {
			if (!unicodeToShortcodeMap.has(bare)) {
				unicodeToShortcodeMap.set(bare, shortcode);
			}
		}
	}

	return unicodeToShortcodeMap;
};

const convertUnicodeEmojisToShortnames = (msg: string): string => {
	const map = getUnicodeToShortcodeMap();
	if (map.size === 0) {
		return msg;
	}

	if (!unicodePattern) {
		const unicodeEmojis = [...map.keys()].sort((a, b) => b.length - a.length);
		unicodePattern = new RegExp(unicodeEmojis.map((emoji) => emoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
	}

	return msg.replace(unicodePattern, (match) => map.get(match) ?? match);
};

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

	const textToCheck = convertUnicodeEmojisToShortnames(msg);
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
