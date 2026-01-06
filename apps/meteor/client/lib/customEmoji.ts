import type { IEmoji } from '@rocket.chat/core-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { emoji, removeFromRecent, replaceEmojiInRecent } from '../../app/emoji/client';
import { getURL } from '../../app/utils/client';

const isSetNotNull = (fn: () => unknown) => {
	let value;
	try {
		value = fn();
	} catch (e) {
		value = null;
	}
	return value !== null && value !== undefined;
};

export const updateEmojiCustom = (emojiData: IEmoji) => {
	try {
		// Validate emojiData has required name property
		if (!emojiData || typeof emojiData.name !== 'string' || !emojiData.name) {
			console.error('Invalid emoji data: missing or invalid name', emojiData);
			return;
		}

		const previousExists = isSetNotNull(() => emojiData.previousName);
		const currentAliases = isSetNotNull(() => emojiData.aliases && Array.isArray(emojiData.aliases) && emojiData.aliases.length > 0);

		if (previousExists && typeof emojiData.previousName === 'string') {
			try {
				const previousEmojiKey = `:${emojiData.previousName}:`;
				const previousEmojiList = emoji.list?.[previousEmojiKey];

				if (previousEmojiList?.aliases && Array.isArray(previousEmojiList.aliases)) {
					for (const alias of previousEmojiList.aliases) {
						if (typeof alias === 'string') {
							delete emoji.list?.[`:${alias}:`];
							const aliasIndex = emoji.packages.emojiCustom.list?.indexOf(`:${alias}:`) ?? -1;
							if (aliasIndex !== -1) {
								emoji.packages.emojiCustom.list?.splice(aliasIndex, 1);
							}
						}
					}
				}
			} catch (error) {
				console.error('Error updating previous emoji aliases:', error);
			}
		}

		if (previousExists && typeof emojiData.previousName === 'string' && emojiData.name !== emojiData.previousName) {
			try {
				const arrayIndex = emoji.packages.emojiCustom.emojisByCategory.rocket.indexOf(emojiData.previousName);
				if (arrayIndex !== -1) {
					emoji.packages.emojiCustom.emojisByCategory.rocket.splice(arrayIndex, 1);
				}
				const arrayIndexList = emoji.packages.emojiCustom.list?.indexOf(`:${emojiData.previousName}:`) ?? -1;
				if (arrayIndexList !== -1) {
					emoji.packages.emojiCustom.list?.splice(arrayIndexList, 1);
				}
				delete emoji.list?.[`:${emojiData.previousName}:`];
			} catch (error) {
				console.error('Error removing previous emoji:', error);
			}
		}

		try {
			const categoryIndex = emoji.packages.emojiCustom.emojisByCategory.rocket.indexOf(emojiData.name);
			if (categoryIndex === -1) {
				emoji.packages.emojiCustom.emojisByCategory.rocket.push(emojiData.name);
				emoji.packages.emojiCustom.list?.push(`:${emojiData.name}:`);
			}

			emoji.list[`:${emojiData.name}:`] = Object.assign(
				{ emojiPackage: 'emojiCustom' },
				emoji.list?.[`:${emojiData.name}:`],
				emojiData,
			);
		} catch (error) {
			console.error('Error updating emoji in list:', error);
		}

		if (currentAliases && Array.isArray(emojiData.aliases)) {
			try {
				for (const alias of emojiData.aliases) {
					if (typeof alias === 'string') {
						emoji.packages.emojiCustom.list?.push(`:${alias}:`);
						emoji.list[`:${alias}:`] = {
							emojiPackage: 'emojiCustom',
							aliasOf: emojiData.name,
						};
					}
				}
			} catch (error) {
				console.error('Error updating emoji aliases:', error);
			}
		}

		if (previousExists && typeof emojiData.previousName === 'string' && typeof emojiData.name === 'string') {
			try {
				replaceEmojiInRecent({ oldEmoji: emojiData.previousName, newEmoji: emojiData.name });
			} catch (error) {
				console.error('Error updating recent emojis:', error);
			}
		}

		emoji.dispatchUpdate();
	} catch (error) {
		console.error('Error in updateEmojiCustom:', error);
	}
};

export const deleteEmojiCustom = (emojiData: IEmoji) => {
	try {
		// Validate emojiData has required name property
		if (!emojiData || typeof emojiData.name !== 'string' || !emojiData.name) {
			console.error('Invalid emoji data: missing or invalid name', emojiData);
			return;
		}

		try {
			delete emoji.list?.[`:${emojiData.name}:`];

			const arrayIndex = emoji.packages.emojiCustom.emojisByCategory.rocket.indexOf(emojiData.name);
			if (arrayIndex !== -1) {
				emoji.packages.emojiCustom.emojisByCategory.rocket.splice(arrayIndex, 1);
			}

			const arrayIndexList = emoji.packages.emojiCustom.list?.indexOf(`:${emojiData.name}:`) ?? -1;
			if (arrayIndexList !== -1) {
				emoji.packages.emojiCustom.list?.splice(arrayIndexList, 1);
			}
		} catch (error) {
			console.error('Error removing emoji from lists:', error);
		}

		if (emojiData.aliases && Array.isArray(emojiData.aliases)) {
			try {
				for (const alias of emojiData.aliases) {
					if (typeof alias === 'string') {
						delete emoji.list?.[`:${alias}:`];
						const aliasIndex = emoji.packages.emojiCustom.list?.indexOf(`:${alias}:`) ?? -1;
						if (aliasIndex !== -1) {
							emoji.packages.emojiCustom.list?.splice(aliasIndex, 1);
						}
					}
				}
			} catch (error) {
				console.error('Error removing emoji aliases:', error);
			}
		}

		try {
			if (emoji.packages.base?.emojisByCategory?.recent) {
				removeFromRecent(emojiData.name, emoji.packages.base.emojisByCategory.recent);
			}
		} catch (error) {
			console.error('Error removing emoji from recent:', error);
		}

		emoji.dispatchUpdate();
	} catch (error) {
		console.error('Error in deleteEmojiCustom:', error);
	}
};

const getEmojiUrlFromName = (name: string, extension: string, etag?: string) => {
	if (!name) {
		return;
	}

	return getURL(`/emoji-custom/${encodeURIComponent(name)}.${extension}${etag ? `?etag=${etag}` : ''}`);
};

export const customRender = (html: string) => {
	try {
		// Validate input
		if (typeof html !== 'string') {
			console.error('Invalid html input for customRender:', html);
			return '';
		}

		const emojisMatchGroup = emoji.packages.emojiCustom.list?.filter((item) => typeof item === 'string').map(escapeRegExp).join('|');

		if (emojisMatchGroup !== emoji.packages.emojiCustom._regexpSignature) {
			emoji.packages.emojiCustom._regexpSignature = emojisMatchGroup;
			try {
				emoji.packages.emojiCustom._regexp = new RegExp(
					`<object[^>]*>.*?<\/object>|<span[^>]*>.*?<\/span>|<(?:object|embed|svg|img|div|span|p|a)[^>]*>|(${emojisMatchGroup})`,
					'gi',
				);
			} catch (error) {
				console.error('Error creating emoji regexp:', error);
				return html;
			}
			emoji.dispatchUpdate();
		}

		if (!emoji.packages.emojiCustom._regexp) {
			return html;
		}

		html = html.replace(emoji.packages.emojiCustom._regexp, (shortname) => {
			try {
				// Validate shortname
				if (typeof shortname !== 'string' || !shortname || (emoji.packages.emojiCustom.list?.indexOf(shortname) ?? -1) === -1) {
					return shortname;
				}

				let emojiAlias = shortname.replace(/:/g, '');

				// Safely retrieve emoji data with null checks
				const dataCheck = emoji.list?.[shortname];
				if (!dataCheck || typeof dataCheck !== 'object') {
					console.warn('Invalid emoji data for shortname:', shortname);
					return shortname;
				}

				// If this is an alias, get the actual emoji
				if (dataCheck.aliasOf && typeof dataCheck.aliasOf === 'string') {
					emojiAlias = dataCheck.aliasOf;
					const actualEmoji = emoji.list?.[`:${emojiAlias}:`];
					if (actualEmoji && typeof actualEmoji === 'object') {
						return `<span class="emoji" style="background-image:url(${getEmojiUrlFromName(
							emojiAlias,
							actualEmoji.extension ?? 'png',
							actualEmoji.etag,
						)});" data-emoji="${escapeHtml(emojiAlias)}" title="${escapeHtml(shortname)}">${escapeHtml(shortname)}</span>`;
					}
				}

				// Validate extension exists
				if (!dataCheck.extension || typeof dataCheck.extension !== 'string') {
					console.warn('Missing extension for emoji:', emojiAlias, dataCheck);
					return shortname;
				}

				const url = getEmojiUrlFromName(emojiAlias, dataCheck.extension, dataCheck.etag);
				if (!url) {
					console.warn('Failed to generate URL for emoji:', emojiAlias);
					return shortname;
				}

				return `<span class="emoji" style="background-image:url(${url});" data-emoji="${escapeHtml(emojiAlias)}" title="${escapeHtml(shortname)}">${escapeHtml(shortname)}</span>`;
			} catch (error) {
				console.error('Error processing emoji shortname:', shortname, error);
				return shortname;
			}
		});

		return html;
	} catch (error) {
		console.error('Error in customRender:', error);
		return html;
	}
};

/**
 * Helper to escape HTML special characters to prevent XSS
 */
const escapeHtml = (text: string): string => {
	if (typeof text !== 'string') {
		return '';
	}
	const map: Record<string, string> = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;',
	};
	return text.replace(/[&<>"']/g, (char) => map[char] ?? char);
};
