import emoji-toolkit from 'emoji-toolkit';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import mem from 'mem';

import { emoji-toolkitRender, emoji-toolkitRenderFromShort } from './emoji-toolkitRender';
import { emojisByCategory, emojiCategories, toneList } from './emojiPicker';
import { emoji } from '../../emoji';
import { getUserPreference } from '../../utils';

// TODO remove fix below when issue is solved: https://github.com/joypixels/emoji-toolkit/issues/617

// add missing emojis not provided by JS object, but included on emoji.json
emoji-toolkit.shortnames +=
	'|:tm:|:copyright:|:registered:|:digit_zero:|:digit_one:|:digit_two:|:digit_three:|:digit_four:|:digit_five:|:digit_six:|:digit_seven:|:digit_eight:|:digit_nine:|:pound_symbol:|:asterisk_symbol:';
emoji-toolkit.regShortNames = new RegExp(
	`<object[^>]*>.*?<\/object>|<span[^>]*>.*?<\/span>|<(?:object|embed|svg|img|div|span|p|a)[^>]*>|(${emoji-toolkit.shortnames})`,
	'gi',
);

emoji-toolkit.emoji-toolkitList[':tm:'] = {
	uc_base: '2122',
	uc_output: '2122-fe0f',
	uc_match: '2122-fe0f',
	uc_greedy: '2122-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emoji-toolkit',
};

emoji-toolkit.emoji-toolkitList[':copyright:'] = {
	uc_base: '00a9',
	uc_output: '00a9-f0ef',
	uc_match: '00a9-fe0f',
	uc_greedy: '00a9-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emoji-toolkit',
};

emoji-toolkit.emoji-toolkitList[':registered:'] = {
	uc_base: '00ae',
	uc_output: '00ae-fe0f',
	uc_match: '00ae-fe0f',
	uc_greedy: '00ae-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emoji-toolkit',
};

emoji-toolkit.emoji-toolkitList[':digit_zero:'] = {
	uc_base: '0030',
	uc_output: '0030-fe0f',
	uc_match: '0030-fe0f',
	uc_greedy: '0030-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emoji-toolkit',
};

emoji-toolkit.emoji-toolkitList[':digit_one:'] = {
	uc_base: '0031',
	uc_output: '0031-fe0f',
	uc_match: '0031-fe0f',
	uc_greedy: '0031-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emoji-toolkit',
};

emoji-toolkit.emoji-toolkitList[':digit_two:'] = {
	uc_base: '0032',
	uc_output: '0032-fe0f',
	uc_match: '0032-fe0f',
	uc_greedy: '0032-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emoji-toolkit',
};

emoji-toolkit.emoji-toolkitList[':digit_three:'] = {
	uc_base: '0033',
	uc_output: '0033-fe0f',
	uc_match: '0033-fe0f',
	uc_greedy: '0033-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emoji-toolkit',
};

emoji-toolkit.emoji-toolkitList[':digit_four:'] = {
	uc_base: '0034',
	uc_output: '0034-fe0f',
	uc_match: '0034-fe0f',
	uc_greedy: '0034-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emoji-toolkit',
};

emoji-toolkit.emoji-toolkitList[':digit_five:'] = {
	uc_base: '0035',
	uc_output: '0035-fe0f',
	uc_match: '0035-fe0f',
	uc_greedy: '0035-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emoji-toolkit',
};

emoji-toolkit.emoji-toolkitList[':digit_six:'] = {
	uc_base: '0036',
	uc_output: '0036-fe0f',
	uc_match: '0036-fe0f',
	uc_greedy: '0036-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emoji-toolkit',
};

emoji-toolkit.emoji-toolkitList[':digit_seven:'] = {
	uc_base: '0037',
	uc_output: '0037-fe0f',
	uc_match: '0037-fe0f',
	uc_greedy: '0037-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emoji-toolkit',
};

emoji-toolkit.emoji-toolkitList[':digit_eight:'] = {
	uc_base: '0038',
	uc_output: '0038-fe0f',
	uc_match: '0038-fe0f',
	uc_greedy: '0038-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emoji-toolkit',
};

emoji-toolkit.emoji-toolkitList[':digit_nine:'] = {
	uc_base: '0039',
	uc_output: '0039-fe0f',
	uc_match: '0039-fe0f',
	uc_greedy: '0039-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emoji-toolkit',
};

emoji-toolkit.emoji-toolkitList[':pound_symbol:'] = {
	uc_base: '0023',
	uc_output: '0023-fe0f',
	uc_match: '0023-fe0f',
	uc_greedy: '0023-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emoji-toolkit',
};

emoji-toolkit.emoji-toolkitList[':asterisk_symbol:'] = {
	uc_base: '002a',
	uc_output: '002a-fe0f',
	uc_match: '002a-fe0f',
	uc_greedy: '002a-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emoji-toolkit',
};
// end fix

// fix for :+1: - had to replace all function that does its conversion: https://github.com/joypixels/emoji-toolkit/blob/4.5.0/lib/js/emoji-toolkit.js#L249
(function (ns) {
	ns.shortnameConversionMap = mem(ns.shortnameConversionMap, { maxAge: 1000 });

	ns.unicodeCharRegex = mem(ns.unicodeCharRegex, { maxAge: 1000 });

	const convertShortName = mem(
		function (shortname) {
			// the fix is basically adding this .replace(/[+]/g, '\\$&')
			if (typeof shortname === 'undefined' || shortname === '' || ns.shortnames.indexOf(shortname.replace(/[+]/g, '\\$&')) === -1) {
				// if the shortname doesnt exist just return the entire match
				return shortname;
			}

			// map shortname to parent
			if (!ns.emoji-toolkitList[shortname]) {
				for (const emoji in ns.emoji-toolkitList) {
					if (!ns.emoji-toolkitList.hasOwnProperty(emoji) || emoji === '') {
						continue;
					}
					if (ns.emoji-toolkitList[emoji].shortnames.indexOf(shortname) === -1) {
						continue;
					}
					shortname = emoji;
					break;
				}
			}

			const unicode = ns.emoji-toolkitList[shortname].uc_output;
			const fname = ns.emoji-toolkitList[shortname].uc_base;
			const category = fname.indexOf('-1f3f') >= 0 ? 'diversity' : ns.emoji-toolkitList[shortname].category;
			const title = ns.imageTitleTag ? `title="${shortname}"` : '';
			// const size = ns.spriteSize === '32' || ns.spriteSize === '64' ? ns.spriteSize : '32';
			// if the emoji path has been set, we'll use the provided path, otherwise we'll use the default path
			const ePath = ns.defaultPathPNG !== ns.imagePathPNG ? ns.imagePathPNG : `${ns.defaultPathPNG + ns.emojiSize}/`;

			// depending on the settings, we'll either add the native unicode as the alt tag, otherwise the shortname
			const alt = ns.unicodeAlt ? ns.convert(unicode.toUpperCase()) : shortname;

			if (ns.sprites) {
				return `<span class="emoji-toolkit emoji-toolkit-${category} _${fname}" ${title}>${alt}</span>`;
			}
			return `<img class="emoji-toolkit" alt="${alt}" ${title} src="${ePath}${fname}${ns.fileExtension}"/>`;
		},
		{ maxAge: 1000 },
	);

	const convertUnicode = mem(
		function (entire, m1, m2, m3) {
			const mappedUnicode = ns.mapUnicodeToShort();

			if (typeof m3 === 'undefined' || m3 === '' || !(ns.unescapeHTML(m3) in ns.asciiList)) {
				// if the ascii doesnt exist just return the entire match
				return entire;
			}

			m3 = ns.unescapeHTML(m3);
			const unicode = ns.asciiList[m3];
			const shortname = mappedUnicode[unicode];
			const category = unicode.indexOf('-1f3f') >= 0 ? 'diversity' : ns.emoji-toolkitList[shortname].category;
			const title = ns.imageTitleTag ? `title="${ns.escapeHTML(m3)}"` : '';
			// const size = ns.spriteSize === '32' || ns.spriteSize === '64' ? ns.spriteSize : '32';
			// if the emoji path has been set, we'll use the provided path, otherwise we'll use the default path
			const ePath = ns.defaultPathPNG !== ns.imagePathPNG ? ns.imagePathPNG : `${ns.defaultPathPNG + ns.emojiSize}/`;

			// depending on the settings, we'll either add the native unicode as the alt tag, otherwise the shortname
			const alt = ns.unicodeAlt ? ns.convert(unicode.toUpperCase()) : ns.escapeHTML(m3);

			if (ns.sprites) {
				return `${m2}<span class="emoji-toolkit emoji-toolkit-${category} _${unicode}"  ${title}>${alt}</span>`;
			}
			return `${m2}<img class="emoji-toolkit" alt="${alt}" ${title} src="${ePath}${unicode}${ns.fileExtension}"/>`;
		},
		{ maxAge: 1000, cacheKey: JSON.stringify },
	);

	ns.shortnameToImage = function (str) {
		// replace regular shortnames first
		str = str.replace(ns.regShortNames, convertShortName);

		// if ascii smileys are turned on, then we'll replace them!
		if (ns.ascii) {
			const asciiRX = ns.riskyMatchAscii ? ns.regAsciiRisky : ns.regAscii;

			return str.replace(asciiRX, convertUnicode);
		}

		return str;
	};
})(emoji-toolkit);

emoji.packages.emoji-toolkit = emoji-toolkit;
emoji.packages.emoji-toolkit.sprites = true;
emoji.packages.emoji-toolkit.emojisByCategory = emojisByCategory;
emoji.packages.emoji-toolkit.emojiCategories = emojiCategories;
emoji.packages.emoji-toolkit.toneList = toneList;

emoji.packages.emoji-toolkit.render = emoji-toolkitRender;
emoji.packages.emoji-toolkit.renderPicker = emoji-toolkitRenderFromShort;

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
for (const key in emoji-toolkit.emoji-toolkitList) {
	if (emoji-toolkit.emoji-toolkitList.hasOwnProperty(key)) {
		const currentEmoji = emoji-toolkit.emoji-toolkitList[key];
		currentEmoji.emojiPackage = 'emoji-toolkit';
		emoji.list[key] = currentEmoji;

		if (currentEmoji.shortnames) {
			currentEmoji.shortnames.forEach((shortname) => {
				emoji.list[shortname] = currentEmoji;
			});
		}
	}
}

// Additional settings -- ascii emojis
Meteor.startup(function () {
	Tracker.autorun(function () {
		if (isSetNotNull(() => emoji.packages.emoji-toolkit)) {
			if (isSetNotNull(() => getUserPreference(Meteor.userId(), 'convertAsciiEmoji'))) {
				emoji.packages.emoji-toolkit.ascii = getUserPreference(Meteor.userId(), 'convertAsciiEmoji');
			} else {
				emoji.packages.emoji-toolkit.ascii = true;
			}
		}
	});
});
