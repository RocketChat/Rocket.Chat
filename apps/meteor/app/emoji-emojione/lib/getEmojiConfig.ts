import joypixels from 'emoji-toolkit';
import mem from 'mem';

import { emojisByCategory, emojiCategories, toneList } from './emojiPicker';

// Memoize conversion functions for performance
joypixels.unicodeCharRegex = mem(joypixels.unicodeCharRegex, { maxAge: 1000 });


const convertShortName = mem(
	(shortname) => {
		// the fix is basically adding this .replace(/[+]/g, '\\$&')
		if (typeof shortname === 'undefined' || shortname === '' || joypixels.shortnames.indexOf(shortname.replace(/[+]/g, '\\$&')) === -1) {
			// if the shortname doesnt exist just return the entire match
			return shortname;
		}

		// map shortname to parent
		if (!joypixels.emojiList[shortname]) {
			for (const emoji in joypixels.emojiList) {
				if (!joypixels.emojiList.hasOwnProperty(emoji) || emoji === '') {
					continue;
				}
				if (joypixels.emojiList[emoji].shortnames && joypixels.emojiList[emoji].shortnames.indexOf(shortname) === -1) {
					continue;
				}
				shortname = emoji;
				break;
			}
		}

		const unicode = joypixels.emojiList[shortname].uc_full;
		const fname = joypixels.emojiList[shortname].uc_base;
		const category = fname.indexOf('-1f3f') >= 0 ? 'diversity' : joypixels.emojiList[shortname].category;
		const title = joypixels.imageTitleTag ? `title="${shortname}"` : '';
		// const size = ns.spriteSize === '32' || ns.spriteSize === '64' ? ns.spriteSize : '32';
		// if the emoji path has been set, we'll use the provided path, otherwise we'll use the default path
		const ePath =
			joypixels.defaultPathPNG !== joypixels.imagePathPNG ? joypixels.imagePathPNG : `${joypixels.defaultPathPNG + joypixels.emojiSize}/`;

		// depending on the settings, we'll either add the native unicode as the alt tag, otherwise the shortname
		const alt = joypixels.unicodeAlt ? joypixels.convert(unicode.toUpperCase()) : shortname;

		if (joypixels.sprites) {
			return `<span class="emojione emojione-${category} _${fname}" ${title}>${alt}</span>`;
		}
		return `<img class="emojione" alt="${alt}" ${title} src="${ePath}${fname}${joypixels.fileExtension}"/>`;
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
		const category = unicode.indexOf('-1f3f') >= 0 ? 'diversity' : joypixels.emojiList[shortname].category;
		const title = joypixels.imageTitleTag ? `title="${joypixels.escapeHTML(m3)}"` : '';
		// const size = ns.spriteSize === '32' || ns.spriteSize === '64' ? ns.spriteSize : '32';
		// if the emoji path has been set, we'll use the provided path, otherwise we'll use the default path
		const ePath =
			joypixels.defaultPathPNG !== joypixels.imagePathPNG ? joypixels.imagePathPNG : `${joypixels.defaultPathPNG + joypixels.emojiSize}/`;

		// depending on the settings, we'll either add the native unicode as the alt tag, otherwise the shortname
		const alt = joypixels.unicodeAlt ? joypixels.convert(unicode.toUpperCase()) : joypixels.escapeHTML(m3);

		if (joypixels.sprites) {
			return `${m2}<span class="emojione emojione-${category} _${unicode}"  ${title}>${alt}</span>`;
		}
		return `${m2}<img class="emojione" alt="${alt}" ${title} src="${ePath}${unicode}${emojione.fileExtension}"/>`;
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
	emojione: joypixels,
	emojisByCategory,
	emojiCategories,
	toneList,
	render: joypixels.toImage,
	renderPicker: joypixels.shortnameToImage,
	sprites: true,
	isEmojiSupported,
});
