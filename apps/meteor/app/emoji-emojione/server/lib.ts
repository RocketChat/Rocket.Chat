import { Meteor } from 'meteor/meteor';

import { emoji } from '../../emoji/server';
import { getUserPreference } from '../../utils/server/lib/getUserPreference';
import { getEmojiConfig } from '../lib/getEmojiConfig';
import { isSetNotNull } from '../lib/isSetNotNull';

const config = getEmojiConfig();

emoji.packages.emojione = {
	sprites: config.sprites,
	emojisByCategory: config.emojisByCategory,
	emojiCategories: config.emojiCategories as typeof emoji.packages.emojione.emojiCategories,
	toneList: config.toneList,
	render: config.render,
	renderPicker: config.renderPicker,
};

for (const key in config.emojiList) {
	if (config.emojiList.hasOwnProperty(key)) {
		const currentEmoji = { ...config.emojiList[key], emojiPackage: 'emojione' };
		emoji.list[key] = currentEmoji;

		if (currentEmoji.shortnames) {
			currentEmoji.shortnames.forEach((shortname: string) => {
				emoji.list[shortname] = currentEmoji;
			});
		}
	}
}

Meteor.startup(async () => {
	if ((await isSetNotNull(() => emoji.packages.emojione)) && emoji.packages.emojione) {
		if (await isSetNotNull(() => getUserPreference(Meteor.userId() as string, 'convertAsciiEmoji'))) {
			const asciiPref = await getUserPreference(Meteor.userId() as string, 'convertAsciiEmoji');
			emoji.packages.emojione.ascii = asciiPref;
			config.ascii = asciiPref as boolean;
		} else {
			emoji.packages.emojione.ascii = true;
			config.ascii = true;
		}
	}
});
