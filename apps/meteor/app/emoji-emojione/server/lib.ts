import { Meteor } from 'meteor/meteor';

import { emoji } from '../../emoji/server';
import { getEmojiConfig, isSetNotNull } from '../lib/rocketchat';
import { getUserPreference } from '../../utils/server';

const config = getEmojiConfig();

emoji.packages.JoyPixels = config.JoyPixels as any;
if (emoji.packages.JoyPixels) {
	emoji.packages.JoyPixels.sprites = config.sprites;
	emoji.packages.JoyPixels.emojisByCategory = config.emojisByCategory;
	emoji.packages.JoyPixels.emojiCategories = config.emojiCategories as typeof emoji.packages.JoyPixels.emojiCategories;
	emoji.packages.JoyPixels.toneList = config.toneList;

	emoji.packages.JoyPixels.render = config.render;
	emoji.packages.JoyPixels.renderPicker = config.renderPicker;
	// TODO: check types
	// RocketChat.emoji.list is the collection of emojis from all emoji packages
	for (const key in config.JoyPixels.JoyPixelsList) {
		if (config.JoyPixels.JoyPixelsList.hasOwnProperty(key)) {
			const currentEmoji = config.JoyPixels.JoyPixelsList[key];
			// @ts-expect-error - JoyPixels types
			currentEmoji.emojiPackage = 'JoyPixels';
			// @ts-expect-error - JoyPixels types
			emoji.list[key] = currentEmoji;

			// @ts-expect-error - JoyPixels types
			if (currentEmoji.shortnames) {
				// @ts-expect-error - JoyPixels types
				currentEmoji.shortnames.forEach((shortname: string) => {
					// @ts-expect-error - JoyPixels types
					emoji.list[shortname] = currentEmoji;
				});
			}
		}
	}

	// Additional settings -- ascii emojis
	Meteor.startup(async function () {
		if ((await isSetNotNull(() => emoji.packages.JoyPixels)) && emoji.packages.JoyPixels) {
			if (await isSetNotNull(() => getUserPreference(Meteor.userId() as string, 'convertAsciiEmoji'))) {
				emoji.packages.JoyPixels.ascii = await getUserPreference(Meteor.userId() as string, 'convertAsciiEmoji');
			} else {
				emoji.packages.JoyPixels.ascii = true;
			}
		}
	});
}
