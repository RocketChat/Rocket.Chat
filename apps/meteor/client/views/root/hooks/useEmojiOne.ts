import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useEffect, useLayoutEffect } from 'react';

import { emoji } from '../../../../app/emoji/client';
import { getEmojiConfig } from '../../../../app/emoji-emojione/lib/getEmojiConfig';
import { isSetNotNull } from '../../../../app/emoji-emojione/lib/isSetNotNull';

const config = getEmojiConfig();

export const useEmojiOne = () => {
	const convertAsciiToEmoji = useUserPreference<boolean>('convertAsciiEmoji', true);

	useLayoutEffect(() => {
		emoji.packages.emojione = {
			emojiCategories: config.emojiCategories,
			emojisByCategory: config.emojisByCategory,
			toneList: config.toneList,
			render: config.render,
			renderPicker: config.renderPicker,
			sprites: config.sprites,
		};

		for (const [key, currentEmoji] of Object.entries(config.emojione.emojioneList)) {
			currentEmoji.emojiPackage = 'emojione';
			emoji.list[key] = currentEmoji;

			if (currentEmoji.shortnames) {
				currentEmoji.shortnames.forEach((shortname) => {
					emoji.list[shortname] = currentEmoji;
				});
			}
		}
		emoji.dispatchUpdate();
	}, []);

	useEffect(() => {
		if (emoji.packages.emojione) {
			// Additional settings -- ascii emojis
			const ascii = async (): Promise<void> => {
				if ((await isSetNotNull(() => emoji.packages.emojione)) && emoji.packages.emojione) {
					if (typeof convertAsciiToEmoji === 'boolean') {
						emoji.packages.emojione.ascii = convertAsciiToEmoji;
					} else {
						emoji.packages.emojione.ascii = true;
					}
				}
			};

			void ascii();
			emoji.dispatchUpdate();
		}
	}, [convertAsciiToEmoji]);
};
