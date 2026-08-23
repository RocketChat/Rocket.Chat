import type { IEmoji } from '@rocket.chat/core-typings';
import { escapeRegExp } from '@rocket.chat/tools';

import { emoji, removeFromRecent, replaceEmojiInRecent } from '../../app/emoji/client';
import { getURL } from '../../app/utils/client';

export const updateEmojiCustom = (emojiData: IEmoji) => {
	const { previousName, aliases = [] } = emojiData;

	if (previousName && emoji.list[`:${previousName}:`]?.aliases) {
		for (const alias of emoji.list[`:${previousName}:`].aliases ?? []) {
			delete emoji.list[`:${alias}:`];
			const aliasIndex = emoji.packages.emojiCustom.list?.indexOf(`:${alias}:`) ?? -1;
			if (aliasIndex !== -1) {
				emoji.packages.emojiCustom.list?.splice(aliasIndex, 1);
			}
		}
	}

	if (previousName && emojiData.name !== previousName) {
		const arrayIndex = emoji.packages.emojiCustom.emojisByCategory.rocket.indexOf(previousName);
		if (arrayIndex !== -1) {
			emoji.packages.emojiCustom.emojisByCategory.rocket.splice(arrayIndex, 1);
		}
		const arrayIndexList = emoji.packages.emojiCustom.list?.indexOf(`:${previousName}:`) ?? -1;
		if (arrayIndexList !== -1) {
			emoji.packages.emojiCustom.list?.splice(arrayIndexList, 1);
		}
		delete emoji.list[`:${previousName}:`];
	}

	const categoryIndex = emoji.packages.emojiCustom.emojisByCategory.rocket.indexOf(emojiData.name);
	if (categoryIndex === -1) {
		emoji.packages.emojiCustom.emojisByCategory.rocket.push(emojiData.name);
		emoji.packages.emojiCustom.list?.push(`:${emojiData.name}:`);
	}

	emoji.list[`:${emojiData.name}:`] = {
		name: emojiData.name,
		extension: emojiData.extension,
		etag: emojiData.etag,
		aliases,
		emojiPackage: 'emojiCustom',
	};

	for (const alias of aliases) {
		emoji.packages.emojiCustom.list?.push(`:${alias}:`);
		emoji.list[`:${alias}:`] = {
			emojiPackage: 'emojiCustom',
			aliasOf: emojiData.name,
		};
	}

	if (previousName) {
		replaceEmojiInRecent({ oldEmoji: previousName, newEmoji: emojiData.name });
	}

	emoji.dispatchUpdate();
};

export const deleteEmojiCustom = (emojiData: IEmoji) => {
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
		if (dataCheck.aliasOf) {
			emojiAlias = dataCheck.aliasOf;
			dataCheck = emoji.list[`:${emojiAlias}:`];
		}

		return `<span class="emoji emoji--custom" style="background-image:url(${getEmojiUrlFromName(
			emojiAlias,
			dataCheck.extension!,
			dataCheck.etag,
		)});" data-emoji="${emojiAlias}" title="${shortname}">${shortname}</span>`;
	});

	return html;
};
