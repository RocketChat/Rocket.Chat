import emojione from 'emojione';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { emojioneRender, emojioneRenderFromShort } from './emojioneRender';
import { emojisByCategory, emojiCategories, toneList } from './emojiPicker';
import { emoji } from '../../emoji';
import { getUserPreference } from '../../utils';

// TODO remove fix below when issue is solved: https://github.com/joypixels/emojione/issues/617

// add missing emojis not provided by JS object, but included on emoji.json
emojione.shortnames += '|:tm:|:copyright:|:registered:|:digit_zero:|:digit_one:|:digit_two:|:digit_three:|:digit_four:|:digit_five:|:digit_six:|:digit_seven:|:digit_eight:|:digit_nine:|:pound_symbol:|:asterisk_symbol:';
emojione.regShortNames = new RegExp(`<object[^>]*>.*?<\/object>|<span[^>]*>.*?<\/span>|<(?:object|embed|svg|img|div|span|p|a)[^>]*>|(${ emojione.shortnames })`, 'gi');

emojione.emojioneList[':tm:'] = {
	uc_base: '2122',
	uc_output: '2122',
	uc_match: '2122-fe0f',
	uc_greedy: '2122-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
};

emojione.emojioneList[':copyright:'] = {
	uc_base: '00a9',
	uc_output: '00a9',
	uc_match: '00a9-fe0f',
	uc_greedy: '00a9-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
};

emojione.emojioneList[':registered:'] = {
	uc_base: '00ae',
	uc_output: '00ae',
	uc_match: '00ae-fe0f',
	uc_greedy: '00ae-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
};

emojione.emojioneList[':digit_zero:'] = {
	uc_base: '0030',
	uc_output: '0030',
	uc_match: '0030-fe0f',
	uc_greedy: '0030-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
};

emojione.emojioneList[':digit_one:'] = {
	uc_base: '0031',
	uc_output: '0031',
	uc_match: '0031-fe0f',
	uc_greedy: '0031-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
};

emojione.emojioneList[':digit_two:'] = {
	uc_base: '0032',
	uc_output: '0032',
	uc_match: '0032-fe0f',
	uc_greedy: '0032-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
};

emojione.emojioneList[':digit_three:'] = {
	uc_base: '0033',
	uc_output: '0033',
	uc_match: '0033-fe0f',
	uc_greedy: '0033-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
};

emojione.emojioneList[':digit_four:'] = {
	uc_base: '0034',
	uc_output: '0034',
	uc_match: '0034-fe0f',
	uc_greedy: '0034-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
};

emojione.emojioneList[':digit_five:'] = {
	uc_base: '0035',
	uc_output: '0035',
	uc_match: '0035-fe0f',
	uc_greedy: '0035-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
};

emojione.emojioneList[':digit_six:'] = {
	uc_base: '0036',
	uc_output: '0036',
	uc_match: '0036-fe0f',
	uc_greedy: '0036-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
};

emojione.emojioneList[':digit_seven:'] = {
	uc_base: '0037',
	uc_output: '0037',
	uc_match: '0037-fe0f',
	uc_greedy: '0037-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
};

emojione.emojioneList[':digit_eight:'] = {
	uc_base: '0038',
	uc_output: '0038',
	uc_match: '0038-fe0f',
	uc_greedy: '0038-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
};

emojione.emojioneList[':digit_nine:'] = {
	uc_base: '0039',
	uc_output: '0039',
	uc_match: '0039-fe0f',
	uc_greedy: '0039-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
};

emojione.emojioneList[':pound_symbol:'] = {
	uc_base: '0023',
	uc_output: '0023',
	uc_match: '0023-fe0f',
	uc_greedy: '0023-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
};

emojione.emojioneList[':asterisk_symbol:'] = {
	uc_base: '002a',
	uc_output: '002a',
	uc_match: '002a-fe0f',
	uc_greedy: '002a-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
};
// end fix

emoji.packages.emojione = emojione;
emoji.packages.emojione.sprites = true;
emoji.packages.emojione.emojisByCategory = emojisByCategory;
emoji.packages.emojione.emojiCategories = emojiCategories;
emoji.packages.emojione.toneList = toneList;

emoji.packages.emojione.render = emojioneRender;
emoji.packages.emojione.renderPicker = emojioneRenderFromShort;

// http://stackoverflow.com/a/26990347 function isSet() from Gajus
function isSetNotNull(fn) {
	let value;
	try {
		value = fn();
	} catch (e) {
		value = null;
	}
	return value !== null && value !== undefined;
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
