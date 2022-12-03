import ascii, { asciiRegexp } from './ascii';
import emojis from './emojis';

type EmojiShortname = keyof typeof emojis;
type EmojiASCIICode = keyof typeof ascii;

const shortnamePattern = new RegExp(/:[-+_a-z0-9]+:/, 'gi');
const replaceShortNameWithUnicode = (shortname: EmojiShortname) => emojis[shortname] || shortname;
const regAscii = new RegExp(`((\\s|^)${asciiRegexp}(?=\\s|$|[!,.?]))`, 'gi');

const unescaped = {
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
} as const;

type HTMLEntity = keyof typeof unescaped;

const unescapeHTML = (string: string) => {
	return string.replace(
		/&(?:amp|#38|#x26|lt|#60|#x3C|gt|#62|#x3E|apos|#39|#x27|quot|#34|#x22);/gi,
		(match: HTMLEntity) => unescaped[match],
	);
};

const isAscii = (string: string): string is EmojiASCIICode => {
	if (!string?.trim() || !(unescapeHTML(string) in ascii)) {
		return false;
	}
	return true;
};

const shortnameToUnicode = (stringMessage: string) => {
	stringMessage = stringMessage.replace(shortnamePattern, replaceShortNameWithUnicode);
	stringMessage = stringMessage.replace(regAscii, (entire, _dummy1, _dummy2, m3) => {
		return isAscii(m3) ? unescapeHTML(m3) : entire;
	});

	return stringMessage;
};

export default shortnameToUnicode;
