import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useLayoutEffect } from 'react';

import { getEmojiConfig } from '../../../../app/emoji-native/lib/getEmojiConfig';
import { legacyEmojioneMap } from '../../../../app/emoji-native/lib/legacyEmojioneMap';
import { emoji } from '../../../lib/emoji';

const config = getEmojiConfig(emoji);

export const useNativeEmoji = () => {
	const convertAsciiToEmoji = useUserPreference<boolean>('convertAsciiEmoji', true);

	useLayoutEffect(() => {
		emoji.packages.native = {
			emojiCategories: config.emojiCategories as any,
			emojisByCategory: config.emojisByCategory,
			toneList: config.toneList,
			render: config.render,
			renderPicker: config.renderPicker,
			sprites: config.sprites,
		};

		for (const [key, currentEmoji] of Object.entries(config.emojiList)) {
			currentEmoji.emojiPackage = 'native';
			emoji.list[key] = currentEmoji;

			if (currentEmoji.shortnames) {
				currentEmoji.shortnames.forEach((shortname: string) => {
					emoji.list[shortname] = currentEmoji;
				});
			}
		}

		// Register legacy emojione shortcodes so old reactions and stored shortcodes resolve correctly
		for (const [shortcode, unicode] of Object.entries(legacyEmojioneMap)) {
			const key = `:${shortcode}:`;
			if (emoji.list[key]) continue;

			emoji.list[key] = {
				uc_base: '',
				uc_output: '',
				uc_match: '',
				uc_greedy: '',
				shortnames: [],
				category: '',
				emojiPackage: 'native',
				unicode,
			};
		}

		emoji.dispatchUpdate();
	}, []);

	useLayoutEffect(() => {
		if (!emoji.packages.native) {
			return;
		}

		emoji.packages.native.ascii = convertAsciiToEmoji ?? true;
		emoji.dispatchUpdate();
	}, [convertAsciiToEmoji]);
};
