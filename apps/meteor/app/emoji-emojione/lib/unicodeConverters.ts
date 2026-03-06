import { emojiList } from './emojiData';

export const ucToChar = (uc: string): string =>
	uc
		.split('-')
		.map((cp) => String.fromCodePoint(parseInt(cp, 16)))
		.join('');

let unicodeToShortCache: Record<string, string> | null = null;

const getUnicodeToShortMap = (): Record<string, string> => {
	if (unicodeToShortCache) {
		return unicodeToShortCache;
	}
	unicodeToShortCache = {};
	for (const [shortname, data] of Object.entries(emojiList)) {
		const unicode = ucToChar(data.uc_full);
		if (!unicodeToShortCache[unicode]) {
			unicodeToShortCache[unicode] = shortname;
		}
		const unicodeBase = ucToChar(data.uc_base);
		if (unicodeBase !== unicode && !unicodeToShortCache[unicodeBase]) {
			unicodeToShortCache[unicodeBase] = shortname;
		}
	}
	return unicodeToShortCache;
};

const asciiToUnicode: Record<string, string> = {
	'*\\0/*': '\u{1F646}',
	'*\\O/*': '\u{1F646}',
	'-___-': '\u{1F611}',
	"':-)": '\u{1F605}',
	"':-D": '\u{1F605}',
	'>:-)': '\u{1F606}',
	"':-(": '\u{1F613}',
	'>:-(': '\u{1F620}',
	":'-(": '\u{1F622}',
	'O:-)': '\u{1F607}',
	'0:-3': '\u{1F607}',
	'0:-)': '\u{1F607}',
	'0;^)': '\u{1F607}',
	'O;-)': '\u{1F607}',
	'0;-)': '\u{1F607}',
	'O:-3': '\u{1F607}',
	'-__-': '\u{1F611}',
	':-\u00de': '\u{1F61B}',
	'</3': '\u{1F494}',
	":'-)": '\u{1F602}',
	":')": '\u{1F602}',
	':-D': '\u{1F603}',
	"':)": '\u{1F605}',
	"'=)": '\u{1F605}',
	"':D": '\u{1F605}',
	"'=D": '\u{1F605}',
	'>:)': '\u{1F606}',
	'>;)': '\u{1F606}',
	'>=)': '\u{1F606}',
	';-)': '\u{1F609}',
	'*-)': '\u{1F609}',
	';-]': '\u{1F609}',
	';^)': '\u{1F609}',
	"':(": '\u{1F613}',
	"'=(": '\u{1F613}',
	':-*': '\u{1F618}',
	':^*': '\u{1F618}',
	'>:P': '\u{1F61C}',
	'X-P': '\u{1F61C}',
	'>:[': '\u{1F61E}',
	':-(': '\u{1F61E}',
	':-[': '\u{1F61E}',
	'>:(': '\u{1F620}',
	":'(": '\u{1F622}',
	';-(': '\u{1F622}',
	'>.<': '\u{1F623}',
	'#-)': '\u{1F635}',
	'%-)': '\u{1F635}',
	'X-)': '\u{1F635}',
	'\\0/': '\u{1F646}',
	'\\O/': '\u{1F646}',
	'0:3': '\u{1F607}',
	'0:)': '\u{1F607}',
	'O:)': '\u{1F607}',
	'O=)': '\u{1F607}',
	'O:3': '\u{1F607}',
	'B-)': '\u{1F60E}',
	'8-)': '\u{1F60E}',
	'B-D': '\u{1F60E}',
	'8-D': '\u{1F60E}',
	'-_-': '\u{1F611}',
	'>:\\': '\u{1F615}',
	'>:/': '\u{1F615}',
	':-/': '\u{1F615}',
	':-.': '\u{1F615}',
	':-P': '\u{1F61B}',
	':\u00de': '\u{1F61B}',
	':-b': '\u{1F61B}',
	':-O': '\u{1F62E}',
	'O_O': '\u{1F62E}',
	'>:O': '\u{1F62E}',
	':-X': '\u{1F636}',
	':-#': '\u{1F636}',
	':-)': '\u{1F642}',
	'(y)': '\u{1F44D}',
	'<3': '\u{2764}\u{FE0F}',
	'=D': '\u{1F603}',
	';)': '\u{1F609}',
	'*)': '\u{1F609}',
	';]': '\u{1F609}',
	';D': '\u{1F609}',
	':*': '\u{1F618}',
	'=*': '\u{1F618}',
	':(': '\u{1F61E}',
	':[': '\u{1F61E}',
	'=(': '\u{1F61E}',
	':@': '\u{1F620}',
	';(': '\u{1F622}',
	'D:': '\u{1F628}',
	':$': '\u{1F633}',
	'=$': '\u{1F633}',
	'#)': '\u{1F635}',
	'%)': '\u{1F635}',
	'X)': '\u{1F635}',
	'B)': '\u{1F60E}',
	'8)': '\u{1F60E}',
	':/': '\u{1F615}',
	':\\': '\u{1F615}',
	'=/': '\u{1F615}',
	'=\\': '\u{1F615}',
	':L': '\u{1F615}',
	'=L': '\u{1F615}',
	':P': '\u{1F61B}',
	'=P': '\u{1F61B}',
	':b': '\u{1F61B}',
	':O': '\u{1F62E}',
	':X': '\u{1F636}',
	':#': '\u{1F636}',
	'=X': '\u{1F636}',
	'=#': '\u{1F636}',
	':)': '\u{1F642}',
	'=]': '\u{1F642}',
	'=)': '\u{1F642}',
	':]': '\u{1F642}',
	':D': '\u{1F604}',
};

const unescapeHTML = (str: string): string =>
	str.replace(/&(?:amp|#38|#x26|lt|#60|#x3C|gt|#62|#x3E|apos|#39|#x27|quot|#34|#x22);/gi, (match) => {
		const map: Record<string, string> = {
			'&amp;': '&',
			'&#38;': '&',
			'&#x26;': '&',
			'&lt;': '<',
			'&#60;': '<',
			'&#x3C;': '<',
			'&gt;': '>',
			'&#62;': '>',
			'&#x3E;': '>',
			'&quot;': '"',
			'&#34;': '"',
			'&#x22;': '"',
			'&apos;': "'",
			'&#39;': "'",
			'&#x27;': "'",
		};
		return map[match] || match;
	});

const escapeHTML = (str: string): string =>
	str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

let asciiRegexCache: RegExp | null = null;

const getAsciiRegex = (): RegExp => {
	if (asciiRegexCache) {
		return asciiRegexCache;
	}
	const escapedKeys = Object.keys(asciiToUnicode)
		.sort((a, b) => b.length - a.length)
		.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
	asciiRegexCache = new RegExp(`(\\s|^)(${escapedKeys.join('|')})(?=\\s|$|[!,.?])`, 'g');
	return asciiRegexCache;
};

export const shortnameToUnicode = (str: string): string => {
	str = str.replace(/:[\w+-]+:/g, (shortname) => {
		const entry = emojiList[shortname];
		if (entry) {
			return ucToChar(entry.uc_full);
		}
		for (const [key, data] of Object.entries(emojiList)) {
			if (data.shortnames?.includes(shortname)) {
				return ucToChar(emojiList[key].uc_full);
			}
		}
		return shortname;
	});
	return str;
};

export const toShort = (str: string): string => {
	const map = getUnicodeToShortMap();
	const sorted = Object.keys(map).sort((a, b) => b.length - a.length);
	for (const unicode of sorted) {
		if (str.includes(unicode)) {
			str = str.split(unicode).join(map[unicode]);
		}
	}
	return str;
};

export const renderEmoji = (shortname: string): string => {
	const entry = emojiList[shortname];
	if (entry) {
		const unicode = ucToChar(entry.uc_full);
		return `<span class="emoji" title="${shortname}">${unicode}</span>`;
	}
	for (const [key, data] of Object.entries(emojiList)) {
		if (data.shortnames?.includes(shortname)) {
			const unicode = ucToChar(emojiList[key].uc_full);
			return `<span class="emoji" title="${key}">${unicode}</span>`;
		}
	}
	return shortname;
};

export const renderMessage = (str: string, ascii = false): string => {
	str = str.replace(/<object[^>]*>.*?<\/object>|<span[^>]*>.*?<\/span>|<(?:object|embed|svg|img|div|span|p|a)[^>]*>/gi, (match) => match);

	str = str.replace(/:[\w+-]+:/g, (shortname) => {
		const entry = emojiList[shortname];
		if (entry) {
			const unicode = ucToChar(entry.uc_full);
			return `<span class="emoji" title="${shortname}">${unicode}</span>`;
		}
		for (const [, data] of Object.entries(emojiList)) {
			if (data.shortnames?.includes(shortname)) {
				const unicode = ucToChar(data.uc_full);
				return `<span class="emoji" title="${shortname}">${unicode}</span>`;
			}
		}
		return shortname;
	});

	if (ascii) {
		const asciiRX = getAsciiRegex();
		str = str.replace(asciiRX, (_entire, prefix, m3) => {
			const key = unescapeHTML(m3);
			if (!(key in asciiToUnicode)) {
				return _entire;
			}
			const unicode = asciiToUnicode[key as keyof typeof asciiToUnicode];
			const title = escapeHTML(m3);
			return `${prefix}<span class="emoji" title="${title}">${unicode}</span>`;
		});
	}

	return str;
};
