import { Meteor } from 'meteor/meteor';

import { emoji } from '../../emoji/server';
import { getUserPreference } from '../../utils/server/lib/getUserPreference';
import { getEmojiConfig } from '../lib/getEmojiConfig';

const config = getEmojiConfig();

emoji.packages.native = {
	emojiCategories: config.emojiCategories as typeof emoji.packages.native.emojiCategories,
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

Meteor.startup(async () => {
	if (emoji.packages.native) {
		const convertAscii = await getUserPreference(Meteor.userId() as string, 'convertAsciiEmoji');
		emoji.packages.native.ascii = typeof convertAscii === 'boolean' ? convertAscii : true;
	}
});
