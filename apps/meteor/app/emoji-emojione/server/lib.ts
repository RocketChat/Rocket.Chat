import { Meteor } from 'meteor/meteor';

import { emoji } from '../../emoji/server';
import { getUserPreference } from '../../utils/server/lib/getUserPreference';
import { getEmojiConfig } from '../lib/getEmojiConfig';
import { isSetNotNull } from '../lib/isSetNotNull';

const config = getEmojiConfig();

emoji.packages.emojione = config.emojione as any;
if (emoji.packages.emojione) {
	emoji.packages.emojione.sprites = config.sprites;
	emoji.packages.emojione.emojisByCategory = config.emojisByCategory;
	emoji.packages.emojione.emojiCategories = config.emojiCategories as typeof emoji.packages.emojione.emojiCategories;
	emoji.packages.emojione.toneList = config.toneList;

	emoji.packages.emojione.render = config.render;
	emoji.packages.emojione.renderPicker = config.renderPicker;
	// TODO: check types
	// RocketChat.emoji.list is the collection of emojis from all emoji packages
	for (const key in config.emojione.emojioneList) {
		if (config.emojione.emojioneList.hasOwnProperty(key)) {
			const currentEmoji = config.emojione.emojioneList[key];
			currentEmoji.emojiPackage = 'emojione';
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
		if ((await isSetNotNull(() => emoji.packages.emojione)) && emoji.packages.emojione) {
			if (await isSetNotNull(() => getUserPreference(Meteor.userId() as string, 'convertAsciiEmoji'))) {
				emoji.packages.emojione.ascii = await getUserPreference(Meteor.userId() as string, 'convertAsciiEmoji');
			} else {
				emoji.packages.emojione.ascii = true;
			}
		}
	});
}
