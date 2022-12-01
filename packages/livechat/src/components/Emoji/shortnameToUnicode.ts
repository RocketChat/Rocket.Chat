import ascii, { asciiRegexp } from './ascii';
import emojis from './emojis';

const shortnamePattern = new RegExp(/:[-+_a-z0-9]+:/, 'gi');
const replaceShortNameWithUnicode = (shortname: keyof typeof emojis) => emojis[shortname] || shortname;
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

const unescapeHTML = (string: string) => {
	return string.replace(/&(?:amp|#38|#x26|lt|#60|#x3C|gt|#62|#x3E|apos|#39|#x27|quot|#34|#x22);/gi, (match: keyof typeof unescaped) => unescaped[match]);
};

const isAscii = (string: string): string is keyof typeof ascii => {
	if (!string?.trim() || !(unescapeHTML(string) in ascii)) {
		return false;
	}
	return true;
}

const shortnameToUnicode = (stringMessage: string) => {
	stringMessage = stringMessage.replace(shortnamePattern, replaceShortNameWithUnicode);
	stringMessage = stringMessage.replace(regAscii, (entire, m1, m2, m3) => {
		const result = isAscii(m3) ? unescapeHTML(m3) : entire;
		return result;
		
	});

	return stringMessage;
};

export default shortnameToUnicode;
