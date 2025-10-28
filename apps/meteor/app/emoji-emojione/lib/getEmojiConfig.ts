import emojione from 'emojione';
import mem from 'mem';

import { emojisByCategory, emojiCategories, toneList } from './emojiPicker';

// TODO remove fix below when issue is solved: https://github.com/joypixels/emojione/issues/617

// add missing emojis not provided by JS object, but included on emoji.json
emojione.shortnames +=
	'|:tm:|:copyright:|:registered:|:digit_zero:|:digit_one:|:digit_two:|:digit_three:|:digit_four:|:digit_five:|:digit_six:|:digit_seven:|:digit_eight:|:digit_nine:|:pound_symbol:|:asterisk_symbol:';
emojione.regShortNames = new RegExp(
	`<object[^>]*>.*?<\/object>|<span[^>]*>.*?<\/span>|<(?:object|embed|svg|img|div|span|p|a)[^>]*>|(${emojione.shortnames})`,
	'gi',
);

emojione.emojioneList[':tm:'] = {
	uc_base: '2122',
	uc_output: '2122-fe0f',
	uc_match: '2122-fe0f',
	uc_greedy: '2122-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
};

emojione.emojioneList[':copyright:'] = {
	uc_base: '00a9',
	uc_output: '00a9-f0ef',
	uc_match: '00a9-fe0f',
	uc_greedy: '00a9-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
};

emojione.emojioneList[':registered:'] = {
	uc_base: '00ae',
	uc_output: '00ae-fe0f',
	uc_match: '00ae-fe0f',
	uc_greedy: '00ae-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
};

emojione.emojioneList[':digit_zero:'] = {
	uc_base: '0030',
	uc_output: '0030-fe0f',
	uc_match: '0030-fe0f',
	uc_greedy: '0030-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
};

emojione.emojioneList[':digit_one:'] = {
	uc_base: '0031',
	uc_output: '0031-fe0f',
	uc_match: '0031-fe0f',
	uc_greedy: '0031-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
};

emojione.emojioneList[':digit_two:'] = {
	uc_base: '0032',
	uc_output: '0032-fe0f',
	uc_match: '0032-fe0f',
	uc_greedy: '0032-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
};

emojione.emojioneList[':digit_three:'] = {
	uc_base: '0033',
	uc_output: '0033-fe0f',
	uc_match: '0033-fe0f',
	uc_greedy: '0033-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
};

emojione.emojioneList[':digit_four:'] = {
	uc_base: '0034',
	uc_output: '0034-fe0f',
	uc_match: '0034-fe0f',
	uc_greedy: '0034-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
};

emojione.emojioneList[':digit_five:'] = {
	uc_base: '0035',
	uc_output: '0035-fe0f',
	uc_match: '0035-fe0f',
	uc_greedy: '0035-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
};

emojione.emojioneList[':digit_six:'] = {
	uc_base: '0036',
	uc_output: '0036-fe0f',
	uc_match: '0036-fe0f',
	uc_greedy: '0036-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
};

emojione.emojioneList[':digit_seven:'] = {
	uc_base: '0037',
	uc_output: '0037-fe0f',
	uc_match: '0037-fe0f',
	uc_greedy: '0037-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
};

emojione.emojioneList[':digit_eight:'] = {
	uc_base: '0038',
	uc_output: '0038-fe0f',
	uc_match: '0038-fe0f',
	uc_greedy: '0038-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
};

emojione.emojioneList[':digit_nine:'] = {
	uc_base: '0039',
	uc_output: '0039-fe0f',
	uc_match: '0039-fe0f',
	uc_greedy: '0039-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
};

emojione.emojioneList[':pound_symbol:'] = {
	uc_base: '0023',
	uc_output: '0023-fe0f',
	uc_match: '0023-fe0f',
	uc_greedy: '0023-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
};

emojione.emojioneList[':asterisk_symbol:'] = {
	uc_base: '002a',
	uc_output: '002a-fe0f',
	uc_match: '002a-fe0f',
	uc_greedy: '002a-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
};
// end fix

// fix for :+1: - had to replace all function that does its conversion: https://github.com/joypixels/emojione/blob/4.5.0/lib/js/emojione.js#L249

emojione.shortnameConversionMap = mem(emojione.shortnameConversionMap, { maxAge: 1000 });

emojione.unicodeCharRegex = mem(emojione.unicodeCharRegex, { maxAge: 1000 });

const convertShortName = mem(
	(shortname) => {
		// the fix is basically adding this .replace(/[+]/g, '\\$&')
		if (typeof shortname === 'undefined' || shortname === '' || emojione.shortnames.indexOf(shortname.replace(/[+]/g, '\\$&')) === -1) {
			// if the shortname doesnt exist just return the entire match
			return shortname;
		}

		// map shortname to parent
		if (!emojione.emojioneList[shortname]) {
			for (const emoji in emojione.emojioneList) {
				if (!emojione.emojioneList.hasOwnProperty(emoji) || emoji === '') {
					continue;
				}
				if (emojione.emojioneList[emoji].shortnames.indexOf(shortname) === -1) {
					continue;
				}
				shortname = emoji;
				break;
			}
		}

		const unicode = emojione.emojioneList[shortname].uc_output;
		const fname = emojione.emojioneList[shortname].uc_base;
		const category = fname.indexOf('-1f3f') >= 0 ? 'diversity' : emojione.emojioneList[shortname].category;
		const title = emojione.imageTitleTag ? `title="${shortname}"` : '';
		// const size = ns.spriteSize === '32' || ns.spriteSize === '64' ? ns.spriteSize : '32';
		// if the emoji path has been set, we'll use the provided path, otherwise we'll use the default path
		const ePath =
			emojione.defaultPathPNG !== emojione.imagePathPNG ? emojione.imagePathPNG : `${emojione.defaultPathPNG + emojione.emojiSize}/`;

		// depending on the settings, we'll either add the native unicode as the alt tag, otherwise the shortname
		const alt = emojione.unicodeAlt ? emojione.convert(unicode.toUpperCase()) : shortname;

		if (emojione.sprites) {
			return `<span class="emojione emojione-${category} _${fname}" ${title}>${alt}</span>`;
		}
		return `<img class="emojione" alt="${alt}" ${title} src="${ePath}${fname}${emojione.fileExtension}"/>`;
	},
	{ maxAge: 1000 },
);

const convertUnicode = mem(
	(entire, _m1, m2, m3) => {
		const mappedUnicode = emojione.mapUnicodeToShort();

		if (typeof m3 === 'undefined' || m3 === '' || !(emojione.unescapeHTML(m3) in emojione.asciiList)) {
			// if the ascii doesnt exist just return the entire match
			return entire;
		}

		m3 = emojione.unescapeHTML(m3);
		const unicode = emojione.asciiList[m3];
		const shortname = mappedUnicode[unicode];
		const category = unicode.indexOf('-1f3f') >= 0 ? 'diversity' : emojione.emojioneList[shortname].category;
		const title = emojione.imageTitleTag ? `title="${emojione.escapeHTML(m3)}"` : '';
		// const size = ns.spriteSize === '32' || ns.spriteSize === '64' ? ns.spriteSize : '32';
		// if the emoji path has been set, we'll use the provided path, otherwise we'll use the default path
		const ePath =
			emojione.defaultPathPNG !== emojione.imagePathPNG ? emojione.imagePathPNG : `${emojione.defaultPathPNG + emojione.emojiSize}/`;

		// depending on the settings, we'll either add the native unicode as the alt tag, otherwise the shortname
		const alt = emojione.unicodeAlt ? emojione.convert(unicode.toUpperCase()) : emojione.escapeHTML(m3);

		if (emojione.sprites) {
			return `${m2}<span class="emojione emojione-${category} _${unicode}"  ${title}>${alt}</span>`;
		}
		return `${m2}<img class="emojione" alt="${alt}" ${title} src="${ePath}${unicode}${emojione.fileExtension}"/>`;
	},
	{ maxAge: 1000, cacheKey: JSON.stringify },
);

emojione.shortnameToImage = (str) => {
	// replace regular shortnames first
	str = str.replace(emojione.regShortNames, convertShortName);

	// if ascii smileys are turned on, then we'll replace them!
	if (emojione.ascii) {
		const asciiRX = emojione.riskyMatchAscii ? emojione.regAsciiRisky : emojione.regAscii;

		return str.replace(asciiRX, convertUnicode);
	}

	return str;
};

const isEmojiSupported = (str: string) => {
	str = str.replace(emojione.regShortNames, convertShortName);

	// if ascii smileys are turned on, then we'll replace them!
	if (emojione.ascii) {
		const asciiRX = emojione.riskyMatchAscii ? emojione.regAsciiRisky : emojione.regAscii;

		return str.replace(asciiRX, convertUnicode);
	}

	return str;
};

export const getEmojiConfig = () => ({
	emojione,
	emojisByCategory,
	emojiCategories,
	toneList,
	render: emojione.toImage,
	renderPicker: emojione.shortnameToImage,
	sprites: true,
	isEmojiSupported,
});
