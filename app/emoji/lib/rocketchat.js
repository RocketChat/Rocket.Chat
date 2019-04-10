import { emojioneRender } from '../../emoji-emojione/lib/emojioneRender';

export const emoji = {
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
				return emoji.packages[correctPackage].renderPicker(emojiToRender);
			},
		},
	},
	list: {},
};
