import { Meteor } from 'meteor/meteor';

import { emoji } from '../../emoji/client';
import { getUserPreference } from '../../utils/client';
import { getEmojiConfig } from '../lib/getEmojiConfig';
import { isSetNotNull } from '../lib/isSetNotNull';

const config = getEmojiConfig();

emoji.packages.joypixels = config.joypixels as any;
if (emoji.packages.joypixels) {
	emoji.packages.joypixels.sprites = config.sprites;
	emoji.packages.joypixels.emojisByCategory = config.emojisByCategory;
	emoji.packages.joypixels.emojiCategories = config.emojiCategories as any;
	emoji.packages.joypixels.toneList = config.toneList;

	emoji.packages.joypixels.render = config.render;
	emoji.packages.joypixels.renderPicker = config.renderPicker;

	// RocketChat.emoji.list is the collection of emojis from all emoji packages
	for (const [key, currentEmoji] of Object.entries(config.joypixels.joypixelsList)) {
		currentEmoji.emojiPackage = 'joypixels';
		emoji.list[key] = currentEmoji;

		if (currentEmoji.shortnames) {
			currentEmoji.shortnames.forEach((shortname: string) => {
				emoji.list[shortname] = currentEmoji;
			});
		}
	}

	// Additional settings -- ascii emojis
	Meteor.startup(() => {
		Tracker.autorun(async () => {
			if ((await isSetNotNull(() => emoji.packages.joypixels)) && emoji.packages.joypixels) {
				if (await isSetNotNull(() => getUserPreference(Meteor.userId() as string, 'convertAsciiEmoji'))) {
					emoji.packages.joypixels.ascii = await getUserPreference(Meteor.userId() as string, 'convertAsciiEmoji');
				} else {
					emoji.packages.joypixels.ascii = true;
				}
			}
		});
	});
}
