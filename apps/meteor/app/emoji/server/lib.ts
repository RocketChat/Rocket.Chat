import type { EmojiPackages } from '../lib/rocketchat';

export const emoji: EmojiPackages = {
	packages: {
		base: {
			emojiCategories: [{ key: 'recent', i18n: 'Frequently_Used' }],
			categoryIndex: 0,
			emojisByCategory: {
				recent: [],
			},
			toneList: {},
			render: (message: string) => message,
			renderPicker(emojiToRender) {
				if (!emoji.list[emojiToRender]) {
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
