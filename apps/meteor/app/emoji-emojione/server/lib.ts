import { Meteor } from 'meteor/meteor';

import { emoji } from '../../emoji/server';
import { getUserPreference } from '../../utils/server/lib/getUserPreference';
import { getEmojiConfig } from '../lib/getEmojiConfig';
import { isSetNotNull } from '../lib/isSetNotNull';

const config = getEmojiConfig();

emoji.packages.joypixels = config.joypixels as any;
if (emoji.packages.joypixels) {
	emoji.packages.joypixels.sprites = config.sprites;
	emoji.packages.joypixels.emojisByCategory = config.emojisByCategory;
	emoji.packages.joypixels.emojiCategories = config.emojiCategories as typeof emoji.packages.joypixels.emojiCategories;
	emoji.packages.joypixels.toneList = config.toneList;

	emoji.packages.joypixels.render = config.render;
	emoji.packages.joypixels.renderPicker = config.renderPicker;
	// TODO: check types
	// RocketChat.emoji.list is the collection of emojis from all emoji packages
	for (const key in config.joypixels.joypixelsList) {
		if (config.joypixels.joypixelsList.hasOwnProperty(key)) {
			const currentEmoji = config.joypixels.joypixelsList[key];
			currentEmoji.emojiPackage = 'joypixels';
			emoji.list[key] = currentEmoji;

			if (currentEmoji.shortnames) {
				currentEmoji.shortnames.forEach((shortname: string) => {
					emoji.list[shortname] = currentEmoji;
				});
			}
		}
	}

	// Additional settings -- ascii emojis
	Meteor.startup(async () => {
		if ((await isSetNotNull(() => emoji.packages.joypixels)) && emoji.packages.joypixels) {
			if (await isSetNotNull(() => getUserPreference(Meteor.userId() as string, 'convertAsciiEmoji'))) {
				emoji.packages.joypixels.ascii = await getUserPreference(Meteor.userId() as string, 'convertAsciiEmoji');
			} else {
				emoji.packages.joypixels.ascii = true;
			}
		}
	});
}
