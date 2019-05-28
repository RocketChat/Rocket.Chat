import { Meteor } from 'meteor/meteor';

import { emojioneRender } from '../../emoji-emojione/lib/emojioneRender';

let EmojiPicker;
const removeFromRecent = !Meteor.isClient
	? () => {}
	: (emoji) => {
		if (!EmojiPicker) {
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
				if (!emoji.list[emojiToRender]) {
					removeFromRecent(emojiToRender);
					return;
				}
				const correctPackage = emoji.list[emojiToRender].emojiPackage;
				return emoji.packages[correctPackage].renderPicker(emojiToRender);
			},
		},
	},
	list: {},
};
