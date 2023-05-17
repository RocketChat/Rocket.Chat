import { emojioneRender } from '../../emoji-emojione/lib/emojioneRender';
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
			render: emojioneRender,
			renderPicker(emojiToRender) {
				const correctPackage = emoji.list[emojiToRender].emojiPackage;
				if (!correctPackage) {
					return;
				}

				return emoji.packages[correctPackage]?.renderPicker(emojiToRender);
			},
		},
	},
	list: {},
};
