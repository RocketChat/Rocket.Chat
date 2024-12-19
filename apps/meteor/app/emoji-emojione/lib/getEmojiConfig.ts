import emojiToolkit from 'emoji-toolkit';
import mem from 'mem';

import { emojisByCategory, emojiCategories, toneList } from './emojiPicker';

// TODO remove fix below when issue is solved: https://github.com/joypixels/emojione/issues/617

// add missing emojis not provided by JS object, but included on emoji.json
// emojione.shortnames +=
// 	'|:tm:|:copyright:|:registered:|:digit_zero:|:digit_one:|:digit_two:|:digit_three:|:digit_four:|:digit_five:|:digit_six:|:digit_seven:|:digit_eight:|:digit_nine:|:pound_symbol:|:asterisk_symbol:';
// emojione.regShortNames = new RegExp(
// 	`<object[^>]*>.*?<\/object>|<span[^>]*>.*?<\/span>|<(?:object|embed|svg|img|div|span|p|a)[^>]*>|(${emojione.shortnames})`,
// 	'gi',
// );

const customEmojis = {
	':tm:': {
	  uc_base: '2122',
	  uc_output: '2122-fe0f',
	  uc_match: '2122-fe0f',
	  uc_greedy: '2122-fe0f',
	  shortnames: [],
	  category: 'symbols',
	  emojiPackage: 'emojione',
	},
	':copyright:': {
	  uc_base: '00a9',
	  uc_output: '00a9-fe0f',
	  uc_match: '00a9-fe0f',
	  uc_greedy: '00a9-fe0f',
	  shortnames: [],
	  category: 'symbols',
	  emojiPackage: 'emojione',
	},
	':registered:': {
	  uc_base: '00ae',
	  uc_output: '00ae-fe0f',
	  uc_match: '00ae-fe0f',
	  uc_greedy: '00ae-fe0f',
	  shortnames: [],
	  category: 'symbols',
	  emojiPackage: 'emojione',
	},
	':digit_zero:': {
	  uc_base: '0030',
	  uc_output: '0030-fe0f',
	  uc_match: '0030-fe0f',
	  uc_greedy: '0030-fe0f',
	  shortnames: [],
	  category: 'symbols',
	  emojiPackage: 'emojione',
	},
':digit_one:':{
	uc_base: '0031',
	uc_output: '0031-fe0f',
	uc_match: '0031-fe0f',
	uc_greedy: '0031-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
},
':digit_two:':{
	uc_base: '0032',
	uc_output: '0032-fe0f',
	uc_match: '0032-fe0f',
	uc_greedy: '0032-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
},
':digit_three:':{
	uc_base: '0033',
	uc_output: '0033-fe0f',
	uc_match: '0033-fe0f',
	uc_greedy: '0033-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
},
':digit_four:':{
	uc_base: '0034',
	uc_output: '0034-fe0f',
	uc_match: '0034-fe0f',
	uc_greedy: '0034-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
},
':digit_five:':{
	uc_base: '0035',
	uc_output: '0035-fe0f',
	uc_match: '0035-fe0f',
	uc_greedy: '0035-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
},
':digit_six:':{
	uc_base: '0036',
	uc_output: '0036-fe0f',
	uc_match: '0036-fe0f',
	uc_greedy: '0036-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
},
':digit_seven:':{
	uc_base: '0037',
	uc_output: '0037-fe0f',
	uc_match: '0037-fe0f',
	uc_greedy: '0037-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
},
':digit_eight:':{
	uc_base: '0038',
	uc_output: '0038-fe0f',
	uc_match: '0038-fe0f',
	uc_greedy: '0038-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
},
':digit_nine:':{
	uc_base: '0039',
	uc_output: '0039-fe0f',
	uc_match: '0039-fe0f',
	uc_greedy: '0039-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
},
':pound_symbol:':{
	uc_base: '0023',
	uc_output: '0023-fe0f',
	uc_match: '0023-fe0f',
	uc_greedy: '0023-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
},
':asterisk_symbol:':{
	uc_base: '002a',
	uc_output: '002a-fe0f',
	uc_match: '002a-fe0f',
	uc_greedy: '002a-fe0f',
	shortnames: [],
	category: 'symbols',
	emojiPackage: 'emojione',
},

  };
  Object.assign(emojiToolkit.emojiList, customEmojis);
  Object.assign(emojiToolkit.emojiList, customEmojis);
// end fix

// fix for :+1: - had to replace all function that does its conversion: https://github.com/joypixels/emojione/blob/4.5.0/lib/js/emojione.js#L249
const memoizedShortnameConversionMap = mem(emojiToolkit.shortnameConversionMap, { maxAge: 1000 });
const memoizedUnicodeCharRegex = mem(emojiToolkit.unicodeCharRegex, { maxAge: 1000 });

const convertShortName = mem(
	(shortname) => {
	  if (!shortname || !emojiToolkit.shortnames.includes(shortname.replace(/[+]/g, '\\$&'))) {
		return shortname;
	  }
  
	  if (!emojiToolkit.emojiList[shortname]) {
		for (const emoji in emojiToolkit.emojiList) {
		  if (emojiToolkit.emojiList[emoji]?.shortnames.includes(shortname)) {
			shortname = emoji;
			break;
		  }
		}
	  }
  
	  const emojiData = emojiToolkit.emojiList[shortname];
	  const unicode = emojiData.uc_output;
	  const fname = emojiData.uc_base;
	  const category = fname.includes('-1f3f') ? 'diversity' : emojiData.category;
	  const title = emojiToolkit.imageTitleTag ? `title="${shortname}"` : '';
	  const path = `${emojiToolkit.imagePathPNG || emojiToolkit.defaultPathPNG}${emojiToolkit.emojiSize || ''}/`;
	  const alt = emojiToolkit.unicodeAlt ? emojiToolkit.convert(unicode.toUpperCase()) : shortname;
  
	  if (emojiToolkit.sprites) {
		return `<span class="emojione emojione-${category} _${fname}" ${title}>${alt}</span>`;
	  }
  
	  return `<img class="emojione" alt="${alt}" ${title} src="${path}${fname}${emojiToolkit.fileExtension}"/>`;
	},
	{ maxAge: 1000 }
  );


const convertUnicode = mem(
  (entire, _m1, m2, m3) => {
    const mappedUnicode = emojiToolkit.mapUnicodeToShort();

    if (!m3 || !(emojiToolkit.unescapeHTML(m3) in emojiToolkit.asciiList)) {
      return entire;
    }

    const m3Unescaped = emojiToolkit.unescapeHTML(m3);
    const unicode = emojiToolkit.asciiList[m3Unescaped];
    const shortname = mappedUnicode[unicode];
    const emojiData = emojiToolkit.emojiList[shortname];
    const category = unicode.includes('-1f3f') ? 'diversity' : emojiData.category;
    const title = emojiToolkit.imageTitleTag ? `title="${emojiToolkit.escapeHTML(m3)}"` : '';
    const path = `${emojiToolkit.imagePathPNG || emojiToolkit.defaultPathPNG}${emojiToolkit.emojiSize || ''}/`;
    const alt = emojiToolkit.unicodeAlt ? emojiToolkit.convert(unicode.toUpperCase()) : emojiToolkit.escapeHTML(m3);

    if (emojiToolkit.sprites) {
      return `${m2}<span class="emojione emojione-${category} _${unicode}" ${title}>${alt}</span>`;
    }

    return `${m2}<img class="emojione" alt="${alt}" ${title} src="${path}${unicode}${emojiToolkit.fileExtension}"/>`;
  },
  { maxAge: 1000, cacheKey: JSON.stringify }
);


emojiToolkit.shortnameToImage = (str) => {
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
	render: emojiToolkit.toImage,
	renderPicker: emojiToolkit.shortnameToImage,
	sprites: true,
	isEmojiSupported,
  });
