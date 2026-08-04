import { Emitter } from '@rocket.chat/emitter';

import type { EmojiPackages } from '../lib/rocketchat';

export const emojiEmitter = new Emitter<{ updated: void }>();

export const emoji: EmojiPackages & { dispatchUpdate: () => void } = {
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
				const correctPackage = emoji.list[emojiToRender].emojiPackage;
				if (!correctPackage) {
					return;
				}

				return emoji.packages[correctPackage]?.renderPicker(emojiToRender);
			},
		},
	},
	list: {},
	dispatchUpdate() {
		queueMicrotask(() => {
			emojiEmitter.emit('updated');
		});
	},
};
