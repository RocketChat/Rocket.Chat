import type { ICustomEmojiListEntry, IEmojiAlias, IEmojiCustom } from '@rocket.chat/core-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { emoji, removeFromRecent, replaceEmojiInRecent } from '../../app/emoji/client';
import { getURL } from '../../app/utils/client';

/**
 * Custom emoji data with optional previousName for updates
 */
type CustomEmojiUpdate = IEmojiCustom & {
	previousName?: string;
};

const isSetNotNull = (fn: () => unknown) => {
	let value;
	try {
		value = fn();
	} catch (e) {
		value = null;
	}
	return value !== null && value !== undefined;
};

export const updateEmojiCustom = (emojiData: CustomEmojiUpdate) => {
	const previousExists = isSetNotNull(() => emojiData.previousName);
	const currentAliases = isSetNotNull(() => emojiData.aliases);

	if (previousExists && isSetNotNull(() => emoji.list[`:${emojiData.previousName}:`])) {
		const previousEmoji = emoji.list[`:${emojiData.previousName}:`];
		if ('aliases' in previousEmoji && previousEmoji.aliases) {
			for (const alias of previousEmoji.aliases) {
				delete emoji.list[`:${alias}:`];
				const aliasIndex = emoji.packages.emojiCustom.list?.indexOf(`:${alias}:`) ?? -1;
				if (aliasIndex !== -1) {
					emoji.packages.emojiCustom.list?.splice(aliasIndex, 1);
				}
			}
		}
	}

	if (previousExists && emojiData.previousName && emojiData.name !== emojiData.previousName) {
		const arrayIndex = emoji.packages.emojiCustom.emojisByCategory.rocket.indexOf(emojiData.previousName);
		if (arrayIndex !== -1) {
			emoji.packages.emojiCustom.emojisByCategory.rocket.splice(arrayIndex, 1);
		}
		const arrayIndexList = emoji.packages.emojiCustom.list?.indexOf(`:${emojiData.previousName}:`) ?? -1;
		if (arrayIndexList !== -1) {
			emoji.packages.emojiCustom.list?.splice(arrayIndexList, 1);
		}
		delete emoji.list[`:${emojiData.previousName}:`];
	}

	const categoryIndex = emoji.packages.emojiCustom.emojisByCategory.rocket.indexOf(`${emojiData.name}`);
	if (categoryIndex === -1) {
		emoji.packages.emojiCustom.emojisByCategory.rocket.push(`${emojiData.name}`);
		emoji.packages.emojiCustom.list?.push(`:${emojiData.name}:`);
	}

	// Don't inherit fields from a native emoji being overridden (e.g. its unicode), or the pick would output the native emoji
	const customEmojiEntry: ICustomEmojiListEntry = {
		name: emojiData.name,
		aliases: emojiData.aliases,
		extension: emojiData.extension,
		etag: emojiData.etag,
		emojiPackage: 'emojiCustom',
	};
	emoji.list[`:${emojiData.name}:`] = customEmojiEntry;

	if (currentAliases) {
		for (const alias of emojiData.aliases) {
			emoji.packages.emojiCustom.list?.push(`:${alias}:`);
			const aliasEntry: IEmojiAlias = {
				emojiPackage: 'emojiCustom',
				aliasOf: emojiData.name,
			};
			emoji.list[`:${alias}:`] = aliasEntry;
		}
	}

	if (previousExists && emojiData.previousName) {
		replaceEmojiInRecent({ oldEmoji: emojiData.previousName, newEmoji: emojiData.name });
	}

	emoji.dispatchUpdate();
};

export const deleteEmojiCustom = (emojiData: CustomEmojiUpdate) => {
	delete emoji.list[`:${emojiData.name}:`];
	const arrayIndex = emoji.packages.emojiCustom.emojisByCategory.rocket.indexOf(emojiData.name);
	if (arrayIndex !== -1) {
		emoji.packages.emojiCustom.emojisByCategory.rocket.splice(arrayIndex, 1);
	}
	const arrayIndexList = emoji.packages.emojiCustom.list?.indexOf(`:${emojiData.name}:`) ?? -1;
	if (arrayIndexList !== -1) {
		emoji.packages.emojiCustom.list?.splice(arrayIndexList, 1);
	}
	if (emojiData.aliases) {
		for (const alias of emojiData.aliases) {
			delete emoji.list[`:${alias}:`];
			const aliasIndex = emoji.packages.emojiCustom.list?.indexOf(`:${alias}:`) ?? -1;
			if (aliasIndex !== -1) {
				emoji.packages.emojiCustom.list?.splice(aliasIndex, 1);
			}
		}
	}

	removeFromRecent(emojiData.name, emoji.packages.base.emojisByCategory.recent);
	emoji.dispatchUpdate();
};

const getEmojiUrlFromName = (name: string, extension: string, etag?: string) => {
	if (!name) {
		return;
	}

	return getURL(`/emoji-custom/${encodeURIComponent(name)}.${extension}${etag ? `?etag=${etag}` : ''}`);
};

export const customRender = (html: string) => {
	const emojisMatchGroup = emoji.packages.emojiCustom.list?.map(escapeRegExp).join('|');
	if (emojisMatchGroup !== emoji.packages.emojiCustom._regexpSignature) {
		emoji.packages.emojiCustom._regexpSignature = emojisMatchGroup;
		emoji.packages.emojiCustom._regexp = new RegExp(
			`<object[^>]*>.*?<\/object>|<span[^>]*>.*?<\/span>|<(?:object|embed|svg|img|div|span|p|a)[^>]*>|(${emojisMatchGroup})`,
			'gi',
		);
		emoji.dispatchUpdate();
	}

	html = html.replace(emoji.packages.emojiCustom._regexp!, (shortname) => {
		if (typeof shortname === 'undefined' || shortname === '' || (emoji.packages.emojiCustom.list?.indexOf(shortname) ?? -1) === -1) {
			return shortname;
		}

		let emojiAlias = shortname.replace(/:/g, '');

		let dataCheck = emoji.list[shortname];
		if ('aliasOf' in dataCheck && dataCheck.aliasOf) {
			emojiAlias = dataCheck.aliasOf;
			dataCheck = emoji.list[`:${emojiAlias}:`];
		}

		if (!('extension' in dataCheck)) {
			return shortname;
		}

		return `<span class="emoji emoji--custom" style="background-image:url(${getEmojiUrlFromName(
			emojiAlias,
			dataCheck.extension,
			dataCheck.etag,
		)});" data-emoji="${emojiAlias}" title="${shortname}">${shortname}</span>`;
	});

	return html;
};
