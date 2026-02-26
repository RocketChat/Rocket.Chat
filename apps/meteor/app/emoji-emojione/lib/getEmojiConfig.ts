import mem from 'mem';
import joypixels from 'emoji-toolkit';

import { emojisByCategory, emojiCategories, toneList } from './emojiPicker';

// Memoize conversion functions for performance
joypixels.unicodeCharRegex = mem(joypixels.unicodeCharRegex, { maxAge: 1000 });

const convertShortName = mem(
	(shortname: string) => {
		// Validate shortname exists
		if (typeof shortname === 'undefined' || shortname === '' || joypixels.shortnames.indexOf(shortname.replace(/[+]/g, '\\$&')) === -1) {
			return shortname;
		}

		// Map shortname to parent emoji in emojiList
		let lookupShortname = shortname;
		if (!joypixels.emojiList[lookupShortname]) {
			for (const emoji in joypixels.emojiList) {
				if (!joypixels.emojiList.hasOwnProperty(emoji) || emoji === '') {
					continue;
				}
				if (joypixels.emojiList[emoji].shortnames && joypixels.emojiList[emoji].shortnames.indexOf(lookupShortname) === -1) {
					continue;
				}
				lookupShortname = emoji;
				break;
			}
		}

		const emojiData = joypixels.emojiList[lookupShortname];
		if (!emojiData) return shortname;

		const unicode = emojiData.uc_full;
		const fname = emojiData.uc_base;

		// Safety check: fname is required for sprite/image rendering
		if (!fname) return shortname;

		const category = fname.indexOf('-1f3f') >= 0 ? 'diversity' : emojiData.category;
		const title = joypixels.imageTitleTag ? `title="${shortname}"` : '';
		const ePath =
			joypixels.defaultPathPNG !== joypixels.imagePathPNG ? joypixels.imagePathPNG : `${joypixels.defaultPathPNG + joypixels.emojiSize}/`;

		// Use unicode for alt text if available, otherwise use shortname
		const alt = joypixels.unicodeAlt && unicode ? joypixels.convert(unicode.toUpperCase()) : shortname;

        if (joypixels.sprites) {
        	const size = joypixels.spriteSize || '32';
        
        	return `<span class="joypixels joypixels-${size}-${category} _${fname}" ${title}></span>`;
        }
        
        return `<img class="joypixels" alt="${alt}" ${title} src="${ePath}${fname}${joypixels.fileExtension}"/>`;
	},
	{ maxAge: 1000 },
);

const convertUnicode = mem(
	(entire: string, _m1: string, m2: string, m3: string) => {
		const mappedUnicode = joypixels.mapUnicodeToShort();

		if (typeof m3 === 'undefined' || m3 === '' || !(joypixels.unescapeHTML(m3) in joypixels.asciiList)) {
			return entire;
		}

		const unescaped = joypixels.unescapeHTML(m3);
		const unicode = joypixels.asciiList[unescaped];
		const shortname = mappedUnicode[unicode];

		if (!shortname || !unicode || !joypixels.emojiList[shortname]) return entire;

		const emojiData = joypixels.emojiList[shortname];
		const category = unicode.indexOf('-1f3f') >= 0 ? 'diversity' : emojiData.category;
		const title = joypixels.imageTitleTag ? `title="${joypixels.escapeHTML(m3)}"` : '';
		const ePath =
			joypixels.defaultPathPNG !== joypixels.imagePathPNG ? joypixels.imagePathPNG : `${joypixels.defaultPathPNG + joypixels.emojiSize}/`;

		const alt = joypixels.unicodeAlt ? joypixels.convert(unicode.toUpperCase()) : joypixels.escapeHTML(m3);
        if (joypixels.sprites) {
        	const size = joypixels.spriteSize || '32';
        
        	return `${m2}<span class="joypixels joypixels-${size}-${category} _${unicode}" ${title}></span>`;
        }
        
        return `${m2}<img class="joypixels" alt="${alt}" ${title} src="${ePath}${unicode}${joypixels.fileExtension}"/>`;
	},
	{ maxAge: 1000, cacheKey: JSON.stringify },
);

const shortnameToImageCustom = (str: string) => {
	// Replace regular shortnames first
	str = str.replace(joypixels.regShortNames, convertShortName);

	// If ascii smileys are enabled, replace them
	if (joypixels.ascii) {
		const asciiRX = joypixels.riskyMatchAscii ? joypixels.regAsciiRisky : joypixels.regAscii;
		return str.replace(asciiRX, convertUnicode);
	}

	return str;
};

const isEmojiSupported = (str: string) => {
	const converted = joypixels.toShort(str);
	return converted !== str; // If string changed, emoji was found and recognized
};


export const getEmojiConfig = () => ({
	joypixels,
	emojisByCategory,
	emojiCategories,
	toneList,
	render: joypixels.toImage,
	renderPicker: shortnameToImageCustom,
	sprites: true,
	isEmojiSupported
});
