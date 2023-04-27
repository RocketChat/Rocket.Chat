import { Meteor } from 'meteor/meteor';

import { emoji } from '../../emoji/client';
import { getEmojiConfig, isSetNotNull } from '../lib/rocketchat';
import { getUserPreference } from '../../utils/client';

const config = getEmojiConfig();

emoji.packages.emojione = config.emojione as any;
if (emoji.packages.emojione) {
	emoji.packages.emojione.sprites = config.sprites;
	emoji.packages.emojione.emojisByCategory = config.emojisByCategory;
	emoji.packages.emojione.emojiCategories = config.emojiCategories;
	emoji.packages.emojione.toneList = config.toneList;

	emoji.packages.emojione.render = config.render;
	emoji.packages.emojione.renderPicker = config.renderPicker;

	// RocketChat.emoji.list is the collection of emojis from all emoji packages
	for (const key in config.emojione.emojioneList) {
		if (config.emojione.emojioneList.hasOwnProperty(key)) {
			const currentEmoji = config.emojione.emojioneList[key];
			// @ts-expect-error - emojione types
			currentEmoji.emojiPackage = 'emojione';
			emoji.list[key] = currentEmoji;

			// @ts-expect-error - emojione types
			if (currentEmoji.shortnames) {
				// @ts-expect-error - emojione types
				currentEmoji.shortnames.forEach((shortname: string) => {
					emoji.list[shortname] = currentEmoji;
				});
			}
		}
	}

	// Additional settings -- ascii emojis
	Meteor.startup(function () {
		Tracker.autorun(async function () {
			if ((await isSetNotNull(() => emoji.packages.emojione)) && emoji.packages.emojione) {
				if (await isSetNotNull(() => getUserPreference(Meteor.userId() as string, 'convertAsciiEmoji'))) {
					emoji.packages.emojione.ascii = await getUserPreference(Meteor.userId() as string, 'convertAsciiEmoji');
				} else {
					emoji.packages.emojione.ascii = true;
				}
			}
		});
	});
}
