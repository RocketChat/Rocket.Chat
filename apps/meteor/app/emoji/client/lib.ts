import { emojioneRender } from '../../emoji-emojione/lib/emojioneRender';
import type { EmojiPackage } from '../lib/rocketchat';

let EmojiPicker: any;
const removeFromRecent = (emoji: string) => {
	if (!EmojiPicker) {
		// since this function will be only called client side, the import needs to happen here
		({ EmojiPicker } = require('./lib/EmojiPicker'));
	}
	EmojiPicker.removeFromRecent(emoji.replace(/(^:|:$)/g, ''));
};

export const emoji: EmojiPackage = {
	packages: {
		base: {
			emojiCategories: [{ key: 'recent', i18n: 'Frequently_Used' }],
			categoryIndex: 0,
			emojisByCategory: {
				recent: [],
			},
			toneList: {},
			render: emojioneRender,
			renderPicker(emojiToRender) {
				if (!emoji.list[emojiToRender]) {
					removeFromRecent(emojiToRender);
					return;
				}
				const correctPackage = emoji.list[emojiToRender].emojiPackage;
				if (!correctPackage) {
					return;
				}

				return emoji.packages[correctPackage]?.renderPicker(emojiToRender);
			},
		},
	},
	/** @type {Record<string, unknown>} */
	list: {},
};
