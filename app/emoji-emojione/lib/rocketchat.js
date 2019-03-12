import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { emoji } from 'meteor/rocketchat:emoji';
import { getUserPreference } from 'meteor/rocketchat:utils';
import { emojione } from 'meteor/emojione:emojione';
import { emojisByCategory, emojiCategories, toneList } from './emojiPicker';

emoji.packages.emojione = emojione;
emoji.packages.emojione.imageType = 'png';
emoji.packages.emojione.sprites = true;
emoji.packages.emojione.emojisByCategory = emojisByCategory;
emoji.packages.emojione.emojiCategories = emojiCategories;
emoji.packages.emojione.toneList = toneList;

emoji.packages.emojione.render = function(emoji) {
	return emojione.toImage(emoji);
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
