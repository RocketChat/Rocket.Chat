import ascii, { asciiRegexp } from './ascii';
import emojis from './emojis';

const shortnamePattern = new RegExp(/:[-+_a-z0-9]+:/, 'gi');
const replaceShortNameWithUnicode = (shortname) => emojis[shortname] || shortname;
const regAscii = new RegExp(`((\\s|^)${ asciiRegexp }(?=\\s|$|[!,.?]))`, 'gi');

const unescapeHTML = (string) => {
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
		'&apos;': '\'',
		'&#39;': '\'',
		'&#x27;': '\'',
	};

	return string.replace(/&(?:amp|#38|#x26|lt|#60|#x3C|gt|#62|#x3E|apos|#39|#x27|quot|#34|#x22);/ig, (match) => unescaped[match]);
};

const shortnameToUnicode = (stringMessage) => {
	stringMessage = stringMessage.replace(shortnamePattern, replaceShortNameWithUnicode);
	stringMessage = stringMessage.replace(regAscii, (entire, m1, m2, m3) => {
		if (!m3 || !(unescapeHTML(m3) in ascii)) {
			return entire;
		}

		m3 = unescapeHTML(m3);
		return ascii[m3];
	});

	return stringMessage;
};

export default shortnameToUnicode;
