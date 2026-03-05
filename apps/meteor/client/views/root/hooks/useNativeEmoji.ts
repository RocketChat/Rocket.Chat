import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useEffect, useLayoutEffect } from 'react';

import { emoji } from '../../../../app/emoji/client';
import { getEmojiConfig } from '../../../../app/emoji-native/lib/getEmojiConfig';

const config = getEmojiConfig();

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

		emoji.dispatchUpdate();
	}, []);

	useEffect(() => {
		if (emoji.packages.native) {
			emoji.packages.native.ascii = typeof convertAsciiToEmoji === 'boolean' ? convertAsciiToEmoji : true;
			emoji.dispatchUpdate();
		}
	}, [convertAsciiToEmoji]);
};
