import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useEffect, useLayoutEffect } from 'react';

import { emoji } from '../../../emoji/client';
import { getEmojiConfig } from '../../lib/getEmojiConfig';
import { isSetNotNull } from '../../lib/isSetNotNull';

const config = getEmojiConfig();

export const useEmojiOne = () => {
	const convertAsciiToEmoji = useUserPreference<boolean>('convertAsciiEmoji', true);

	useLayoutEffect(() => {
		emoji.packages.emojione = config.emojione as any;
		if (emoji.packages.emojione) {
			emoji.packages.emojione.sprites = config.sprites;
			emoji.packages.emojione.emojisByCategory = config.emojisByCategory;
			emoji.packages.emojione.emojiCategories = config.emojiCategories as any;
			emoji.packages.emojione.toneList = config.toneList;

			emoji.packages.emojione.render = config.render;
			emoji.packages.emojione.renderPicker = config.renderPicker;

			// RocketChat.emoji.list is the collection of emojis from all emoji packages
			for (const [key, currentEmoji] of Object.entries(config.emojione.emojioneList)) {
				currentEmoji.emojiPackage = 'emojione';
				emoji.list[key] = currentEmoji;

				if (currentEmoji.shortnames) {
					currentEmoji.shortnames.forEach((shortname: string) => {
						emoji.list[shortname] = currentEmoji;
					});
				}
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
