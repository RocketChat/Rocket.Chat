import joypixels from 'joypixels';
import mem from 'mem';

import { emojisByCategory, emojiCategories, toneList } from './emojiPicker';

// TODO remove fix below when issue is solved: https://github.com/joypixels/joypixels/issues/617

// add missing emojis not provided by JS object, but included on emoji.json
joypixels.shortnames +=
	'|:tm:|:copyright:|:registered:|:digit_zero:|:digit_one:|:digit_two:|:digit_three:|:digit_four:|:digit_five:|:digit_six:|:digit_seven:|:digit_eight:|:digit_nine:|:pound_symbol:|:asterisk_symbol:';
joypixels.regShortNames = new RegExp(
	`<object[^>]*>.*?<\/object>|<span[^>]*>.*?<\/span>|<(?:object|embed|svg|img|div|span|p|a)[^>]*>|(${joypixels.shortnames})`,
	'gi',
);

joypixels.joypixelsList[':tm:'] = {
	uc_base: '2122',
	uc_output: '2122-fe0f',
	uc_match: '2122-fe0f',
	uc_greedy: '2122-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'joypixels',
};

joypixels.joypixelsList[':copyright:'] = {
	uc_base: '00a9',
	uc_output: '00a9-f0ef',
	uc_match: '00a9-fe0f',
	uc_greedy: '00a9-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'joypixels',
};

joypixels.joypixelsList[':registered:'] = {
	uc_base: '00ae',
	uc_output: '00ae-fe0f',
	uc_match: '00ae-fe0f',
	uc_greedy: '00ae-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'joypixels',
};

joypixels.joypixelsList[':digit_zero:'] = {
	uc_base: '0030',
	uc_output: '0030-fe0f',
	uc_match: '0030-fe0f',
	uc_greedy: '0030-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'joypixels',
};

joypixels.joypixelsList[':digit_one:'] = {
	uc_base: '0031',
	uc_output: '0031-fe0f',
	uc_match: '0031-fe0f',
	uc_greedy: '0031-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'joypixels',
};

joypixels.joypixelsList[':digit_two:'] = {
	uc_base: '0032',
	uc_output: '0032-fe0f',
	uc_match: '0032-fe0f',
	uc_greedy: '0032-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'joypixels',
};

joypixels.joypixelsList[':digit_three:'] = {
	uc_base: '0033',
	uc_output: '0033-fe0f',
	uc_match: '0033-fe0f',
	uc_greedy: '0033-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'joypixels',
};

joypixels.joypixelsList[':digit_four:'] = {
	uc_base: '0034',
	uc_output: '0034-fe0f',
	uc_match: '0034-fe0f',
	uc_greedy: '0034-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'joypixels',
};

joypixels.joypixelsList[':digit_five:'] = {
	uc_base: '0035',
	uc_output: '0035-fe0f',
	uc_match: '0035-fe0f',
	uc_greedy: '0035-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'joypixels',
};

joypixels.joypixelsList[':digit_six:'] = {
	uc_base: '0036',
	uc_output: '0036-fe0f',
	uc_match: '0036-fe0f',
	uc_greedy: '0036-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'joypixels',
};

joypixels.joypixelsList[':digit_seven:'] = {
	uc_base: '0037',
	uc_output: '0037-fe0f',
	uc_match: '0037-fe0f',
	uc_greedy: '0037-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'joypixels',
};

joypixels.joypixelsList[':digit_eight:'] = {
	uc_base: '0038',
	uc_output: '0038-fe0f',
	uc_match: '0038-fe0f',
	uc_greedy: '0038-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'joypixels',
};

joypixels.joypixelsList[':digit_nine:'] = {
	uc_base: '0039',
	uc_output: '0039-fe0f',
	uc_match: '0039-fe0f',
	uc_greedy: '0039-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'joypixels',
};

joypixels.joypixelsList[':pound_symbol:'] = {
	uc_base: '0023',
	uc_output: '0023-fe0f',
	uc_match: '0023-fe0f',
	uc_greedy: '0023-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'joypixels',
};

joypixels.joypixelsList[':asterisk_symbol:'] = {
	uc_base: '002a',
	uc_output: '002a-fe0f',
	uc_match: '002a-fe0f',
	uc_greedy: '002a-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'joypixels',
};
// end fix

// fix for :+1: - had to replace all function that does its conversion: https://github.com/joypixels/joypixels/blob/4.5.0/lib/js/joypixels.js#L249

joypixels.shortnameConversionMap = mem(joypixels.shortnameConversionMap, { maxAge: 1000 });

joypixels.unicodeCharRegex = mem(joypixels.unicodeCharRegex, { maxAge: 1000 });

const convertShortName = mem(
	(shortname) => {
		// the fix is basically adding this .replace(/[+]/g, '\\$&')
		if (typeof shortname === 'undefined' || shortname === '' || joypixels.shortnames.indexOf(shortname.replace(/[+]/g, '\\$&')) === -1) {
			// if the shortname doesnt exist just return the entire match
			return shortname;
		}

		// map shortname to parent
		if (!joypixels.joypixelsList[shortname]) {
			for (const emoji in joypixels.joypixelsList) {
				if (!joypixels.joypixelsList.hasOwnProperty(emoji) || emoji === '') {
					continue;
				}
				if (joypixels.joypixelsList[emoji].shortnames.indexOf(shortname) === -1) {
					continue;
				}
				shortname = emoji;
				break;
			}
		}

		const unicode = joypixels.joypixelsList[shortname].uc_output;
		const fname = joypixels.joypixelsList[shortname].uc_base;
		const category = fname.indexOf('-1f3f') >= 0 ? 'diversity' : joypixels.joypixelsList[shortname].category;
		const title = joypixels.imageTitleTag ? `title="${shortname}"` : '';
		// const size = ns.spriteSize === '32' || ns.spriteSize === '64' ? ns.spriteSize : '32';
		// if the emoji path has been set, we'll use the provided path, otherwise we'll use the default path
		const ePath =
			joypixels.defaultPathPNG !== joypixels.imagePathPNG ? joypixels.imagePathPNG : `${joypixels.defaultPathPNG + joypixels.emojiSize}/`;

		// depending on the settings, we'll either add the native unicode as the alt tag, otherwise the shortname
		const alt = joypixels.unicodeAlt ? joypixels.convert(unicode.toUpperCase()) : shortname;

		if (joypixels.sprites) {
			return `<span class="joypixels joypixels-${category} _${fname}" ${title}>${alt}</span>`;
		}
		return `<img class="joypixels" alt="${alt}" ${title} src="${ePath}${fname}${joypixels.fileExtension}"/>`;
	},
	{ maxAge: 1000 },
);

const convertUnicode = mem(
	(entire, _m1, m2, m3) => {
		const mappedUnicode = joypixels.mapUnicodeToShort();

		if (typeof m3 === 'undefined' || m3 === '' || !(joypixels.unescapeHTML(m3) in joypixels.asciiList)) {
			// if the ascii doesnt exist just return the entire match
			return entire;
		}

		m3 = joypixels.unescapeHTML(m3);
		const unicode = joypixels.asciiList[m3];
		const shortname = mappedUnicode[unicode];
		const category = unicode.indexOf('-1f3f') >= 0 ? 'diversity' : joypixels.joypixelsList[shortname].category;
		const title = joypixels.imageTitleTag ? `title="${joypixels.escapeHTML(m3)}"` : '';
		// const size = ns.spriteSize === '32' || ns.spriteSize === '64' ? ns.spriteSize : '32';
		// if the emoji path has been set, we'll use the provided path, otherwise we'll use the default path
		const ePath =
			joypixels.defaultPathPNG !== joypixels.imagePathPNG ? joypixels.imagePathPNG : `${joypixels.defaultPathPNG + joypixels.emojiSize}/`;

		// depending on the settings, we'll either add the native unicode as the alt tag, otherwise the shortname
		const alt = joypixels.unicodeAlt ? joypixels.convert(unicode.toUpperCase()) : joypixels.escapeHTML(m3);

		if (joypixels.sprites) {
			return `${m2}<span class="joypixels joypixels-${category} _${unicode}"  ${title}>${alt}</span>`;
		}
		return `${m2}<img class="joypixels" alt="${alt}" ${title} src="${ePath}${unicode}${joypixels.fileExtension}"/>`;
	},
	{ maxAge: 1000, cacheKey: JSON.stringify },
);

joypixels.shortnameToImage = (str) => {
	// replace regular shortnames first
	str = str.replace(joypixels.regShortNames, convertShortName);

	// if ascii smileys are turned on, then we'll replace them!
	if (joypixels.ascii) {
		const asciiRX = joypixels.riskyMatchAscii ? joypixels.regAsciiRisky : joypixels.regAscii;

		return str.replace(asciiRX, convertUnicode);
	}

	return str;
};

const isEmojiSupported = (str: string) => {
	str = str.replace(joypixels.regShortNames, convertShortName);

	// if ascii smileys are turned on, then we'll replace them!
	if (joypixels.ascii) {
		const asciiRX = joypixels.riskyMatchAscii ? joypixels.regAsciiRisky : joypixels.regAscii;

		return str.replace(asciiRX, convertUnicode);
	}

	return str;
};

export const getEmojiConfig = () => ({
	joypixels,
	emojisByCategory,
	emojiCategories,
	toneList,
	render: joypixels.toImage,
	renderPicker: joypixels.shortnameToImage,
	sprites: true,
	isEmojiSupported,
});
