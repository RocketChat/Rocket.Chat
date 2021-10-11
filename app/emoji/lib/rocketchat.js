import { emojioneRender } from '../../emoji-emojione/lib/emojioneRender';

let EmojiPicker;
const removeFromRecent = (emoji) => {
	if (!EmojiPicker) {
		// since this function will be only called client side, the import needs to happen here
		({ EmojiPicker } = require('../client/lib/EmojiPicker'));
	}
	EmojiPicker.removeFromRecent(emoji.replace(/(^:|:$)/g, ''));
};

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
				const item = emoji.list[emojiToRender];

				if (!item) {
					removeFromRecent(emojiToRender);
					return;
				}

				return emoji.packages[item.emojiPackage].renderPicker(emojiToRender);
			},
		},
	},
	list: {},
};
