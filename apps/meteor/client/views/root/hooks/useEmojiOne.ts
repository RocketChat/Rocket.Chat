import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useEffect, useLayoutEffect } from 'react';

import { emoji } from '../../../../app/emoji/client';
import { getEmojiConfig } from '../../../../app/emoji-emojione/lib/getEmojiConfig';

const config = getEmojiConfig();

export const useEmojiOne = () => {
	const convertAsciiToEmoji = useUserPreference<boolean>('convertAsciiEmoji', true);

	useLayoutEffect(() => {
		emoji.packages.emojione = {
			emojisByCategory: config.emojisByCategory,
			emojiCategories: config.emojiCategories as typeof emoji.packages.emojione.emojiCategories,
			toneList: config.toneList,
			render: config.render,
			renderPicker: config.renderPicker,
			sprites: config.sprites,
		};

		for (const [key, currentEmoji] of Object.entries(config.emojiList)) {
			const emojiEntry = { ...currentEmoji, emojiPackage: 'emojione' };
			emoji.list[key] = emojiEntry;

			if (currentEmoji.shortnames) {
				currentEmoji.shortnames.forEach((shortname: string) => {
					emoji.list[shortname] = emojiEntry;
				});
			}
		}

		emoji.dispatchUpdate();
	}, []);

	useEffect(() => {
		if (emoji.packages.emojione) {
			const asciiEnabled = typeof convertAsciiToEmoji === 'boolean' ? convertAsciiToEmoji : true;
			emoji.packages.emojione.ascii = asciiEnabled;
			config.ascii = asciiEnabled;
			emoji.dispatchUpdate();
		}
	}, [convertAsciiToEmoji]);
};
