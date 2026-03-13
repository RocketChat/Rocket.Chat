import emojiToolkit from 'emoji-toolkit';
import mem from 'mem';

import { emojisByCategory, emojiCategories, toneList } from './emojiPicker';

// Initialize emoji-toolkit - emojiList should be auto-populated from the module
// Set local image path
emojiToolkit.imagePathPNG = '/packages/emojione/png/32/';
emojiToolkit.emojiSize = '32';

const getEmojiImagePath = () => {
	const basePath = (emojiToolkit.imagePathPNG || emojiToolkit.defaultPathPNG || '').replace(/\/+$/, '');

	// If the configured path already includes a concrete size folder, preserve it.
	if (/(?:\/|^)(?:16|32|64|128)$/.test(basePath)) {
		return `${basePath}/`;
	}

	return `${basePath}/${emojiToolkit.emojiSize}/`;
};

const convertShortName = mem(
	(shortname: string) => {
		// the fix is basically adding this .replace(/[+]/g, '\\$&')
		if (typeof shortname === 'undefined' || shortname === '' || emojiToolkit.shortnames.indexOf(shortname.replace(/[+]/g, '\\$&')) === -1) {
			// if the shortname doesnt exist just return the entire match
			return shortname;
		}

		// map shortname to parent
		if (!emojiToolkit.emojiList[shortname]) {
			for (const emoji in emojiToolkit.emojiList) {
				if (!Object.prototype.hasOwnProperty.call(emojiToolkit.emojiList, emoji) || emoji === '') {
					continue;
				}
				if (emojiToolkit.emojiList[emoji].shortnames.indexOf(shortname) === -1) {
					continue;
				}
				shortname = emoji;
				break;
			}
		}

		const unicode = emojiToolkit.emojiList[shortname].uc_full;
		const fname = emojiToolkit.emojiList[shortname].uc_base;
		const category = fname.indexOf('-1f3f') >= 0 ? 'diversity' : emojiToolkit.emojiList[shortname].category;
		const title = emojiToolkit.imageTitleTag ? `title="${shortname}"` : '';
		// const size = ns.spriteSize === '32' || ns.spriteSize === '64' ? ns.spriteSize : '32';
		// if the emoji path has been set, we'll use the provided path, otherwise we'll use the default path
		const ePath = getEmojiImagePath();

		// depending on the settings, we'll either add the native unicode as the alt tag, otherwise the shortname
		const alt = emojiToolkit.unicodeAlt ? emojiToolkit.convert(unicode.toUpperCase()) : shortname;

		if (emojiToolkit.sprites) {
			return `<span class="emojione emojione-${category} _${fname}" ${title}>${alt}</span>`;
		}
		return `<img class="emojione" alt="${alt}" ${title} src="${ePath}${fname}${emojiToolkit.fileExtension}"/>`;
	},
	{ maxAge: 1000 },
);

const convertUnicode = mem(
	(entire: string, _m1: string, m2: string, m3: string) => {
		const mappedUnicode = emojiToolkit.mapUnicodeToShort();

		if (typeof m3 === 'undefined' || m3 === '' || !(emojiToolkit.unescapeHTML(m3) in emojiToolkit.asciiList)) {
			// if the ascii doesnt exist just return the entire match
			return entire;
		}

		m3 = emojiToolkit.unescapeHTML(m3);
		const unicode = emojiToolkit.asciiList[m3];
		const shortname = mappedUnicode[unicode];
		const category = unicode.indexOf('-1f3f') >= 0 ? 'diversity' : emojiToolkit.emojiList[shortname].category;
		const title = emojiToolkit.imageTitleTag ? `title="${emojiToolkit.escapeHTML(m3)}"` : '';
		// const size = ns.spriteSize === '32' || ns.spriteSize === '64' ? ns.spriteSize : '32';
		// if the emoji path has been set, we'll use the provided path, otherwise we'll use the default path
		const ePath = getEmojiImagePath();

		// depending on the settings, we'll either add the native unicode as the alt tag, otherwise the shortname
		const alt = emojiToolkit.unicodeAlt ? emojiToolkit.convert(unicode.toUpperCase()) : emojiToolkit.escapeHTML(m3);

		if (emojiToolkit.sprites) {
			return `${m2}<span class="emojione emojione-${category} _${unicode}"  ${title}>${alt}</span>`;
		}
		return `${m2}<img class="emojione" alt="${alt}" ${title} src="${ePath}${unicode}${emojiToolkit.fileExtension}"/>`;
	},
	{ maxAge: 1000, cacheKey: JSON.stringify },
);

const shortnameToImage = (str: string) => {
	// replace regular shortnames first
	str = str.replace(emojiToolkit.regShortNames, convertShortName);

	// if ascii smileys are turned on, then we'll replace them!
	if (emojiToolkit.ascii) {
		const asciiRX = emojiToolkit.riskyMatchAscii ? emojiToolkit.regAsciiRisky : emojiToolkit.regAscii;

		return str.replace(asciiRX, convertUnicode);
	}

	return str;
};

const isEmojiSupported = (str: string) => {
	str = str.replace(emojiToolkit.regShortNames, convertShortName);

	// if ascii smileys are turned on, then we'll replace them!
	if (emojiToolkit.ascii) {
		const asciiRX = emojiToolkit.riskyMatchAscii ? emojiToolkit.regAsciiRisky : emojiToolkit.regAscii;

		return str.replace(asciiRX, convertUnicode);
	}

	return str;
};

export const getEmojiConfig = () => ({
	emojione: emojiToolkit,
	emojisByCategory,
	emojiCategories,
	toneList,
	render: shortnameToImage,
	renderPicker: shortnameToImage,
	sprites: false,
	isEmojiSupported,
});
