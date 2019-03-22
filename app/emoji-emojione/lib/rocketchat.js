import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { emoji } from '../../emoji';
import { getUserPreference } from '../../utils';
import emojione from 'emojione';
import { emojisByCategory, emojiCategories, toneList } from './emojiPicker';

emoji.packages.emojione = emojione;
emoji.packages.emojione.sprites = true;
emoji.packages.emojione.emojisByCategory = emojisByCategory;
emoji.packages.emojione.emojiCategories = emojiCategories;
emoji.packages.emojione.toneList = toneList;
emoji.packages.emojione.emojiSize = 24;
emoji.packages.emojione.spriteSize = 24;

emoji.packages.emojione.render = function(message) {
	// For some reason toImage isn't respecting emojiSize or spriteSize when set to 24,
	// so we have to do some string replacements here.

	return emojione.toImage(message).replace(/emojione-32/g, `emojione-${ emoji.packages.emojione.emojiSize }`);
};

// http://stackoverflow.com/a/26990347 function isSet() from Gajus
function isSetNotNull(fn) {
	let value;
	try {
		value = fn();
	} catch (e) {
		value = null;
	} finally {
		return value !== null && value !== undefined;
	}
}

// RocketChat.emoji.list is the collection of emojis from all emoji packages
for (const key in emojione.emojioneList) {
	if (emojione.emojioneList.hasOwnProperty(key)) {
		const currentEmoji = emojione.emojioneList[key];
		currentEmoji.emojiPackage = 'emojione';
		emoji.list[key] = currentEmoji;
	}
}

// Additional settings -- ascii emojis
Meteor.startup(function() {
	Tracker.autorun(function() {
		if (isSetNotNull(() => emoji.packages.emojione)) {
			if (isSetNotNull(() => getUserPreference(Meteor.userId(), 'convertAsciiEmoji'))) {
				emoji.packages.emojione.ascii = getUserPreference(Meteor.userId(), 'convertAsciiEmoji');
			} else {
				emoji.packages.emojione.ascii = true;
			}
		}
	});
});
