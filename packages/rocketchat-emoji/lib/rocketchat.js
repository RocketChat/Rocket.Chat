import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.emoji = {
	packages: {
		base: {
			emojiCategories: { recent: 'Frequently_Used' },
			emojisByCategory: {
				recent: [],
			},
			toneList: {},
			render(html) {
				return html;
			},
		},
	},
	list: {},
};
