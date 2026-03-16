import emojione from 'emoji-toolkit';
import mem from 'mem';

import { emojisByCategory, emojiCategories, toneList } from './emojiPicker';

// fix for :+1: - had to replace all function that does its conversion: https://github.com/joypixels/emojione/blob/4.5.0/lib/js/emojione.js#L249

emojione.unicodeCharRegex = mem(emojione.unicodeCharRegex, { maxAge: 1000 });

const convertShortName = mem(
	(shortname) => {
		// the fix is basically adding this .replace(/[+]/g, '\\$&')
		if (typeof shortname === 'undefined' || shortname === '' || emojione.shortnames.indexOf(shortname.replace(/[+]/g, '\\$&')) === -1) {
			// if the shortname doesnt exist just return the entire match
			return shortname;
		}

		// map shortname to parent
		if (!emojione.emojiList[shortname]) {
			for (const emoji in emojione.emojiList) {
				if (!emojione.emojiList.hasOwnProperty(emoji) || emoji === '') {
					continue;
				}
				if (emojione.emojiList[emoji].shortnames.indexOf(shortname) === -1) {
					continue;
				}
				shortname = emoji;
				break;
			}
		}

		const unicode = emojione.emojiList[shortname].uc_full;
		const fname = emojione.emojiList[shortname].uc_base;
		const category = fname.indexOf('-1f3f') >= 0 ? 'diversity' : emojione.emojiList[shortname].category;
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
		const category = unicode.indexOf('-1f3f') >= 0 ? 'diversity' : emojione.emojiList[shortname].category;
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

// https://github.com/joypixels/emoji-toolkit/issues/50#issuecomment-2113222096
// The emoji-toolkit lib has a large overhead issue on the first call to emojione.regShortNames
// that causes the first message sent once the app is loaded to take around 3 seconds to be sent
// so doing a dummy call to trigger the load and cache while loading the app should avoid the issue for now
isEmojiSupported('👍');

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
