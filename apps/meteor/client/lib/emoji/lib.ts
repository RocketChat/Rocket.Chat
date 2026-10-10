import { Emitter } from '@rocket.chat/emitter';

import { DEFAULT_SUGGESTED_EMOJIS, SUGGESTED_CATEGORY } from './suggested';
import type { EmojiPackages } from '../../../lib/emoji';

export const emojiEmitter = new Emitter<{ updated: void }>();

export const emoji: EmojiPackages & { dispatchUpdate: () => void } = {
	packages: {
		base: {
			emojiCategories: [
				{ key: 'recent', i18n: 'Frequently_Used' },
				{ key: SUGGESTED_CATEGORY, i18n: 'Suggested_emojis' },
			],
			categoryIndex: 0,
			emojisByCategory: {
				recent: [],
				[SUGGESTED_CATEGORY]: [...DEFAULT_SUGGESTED_EMOJIS],
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
