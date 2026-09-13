import { toString } from './toString';

const htmlEntityCodeToCharacter = {
	nbsp: ' ',
	cent: '¢',
	pound: '£',
	yen: '¥',
	euro: '€',
	copy: '©',
	reg: '®',
	trade: '™',
	lt: '<',
	gt: '>',
	quot: '"',
	amp: '&',
	apos: "'",
} as const;

const isHtmlEntityCode = (htmlEntityCode: string): htmlEntityCode is keyof typeof htmlEntityCodeToCharacter =>
	htmlEntityCode in htmlEntityCodeToCharacter;

export const unescapeHTML = (str: string): string =>
	toString(str).replace(/\&([^;]{1,10});/g, (entity, htmlEntityCode) => {
		let match;

		if (isHtmlEntityCode(htmlEntityCode)) {
			return htmlEntityCodeToCharacter[htmlEntityCode];
		}

		// `fromCodePoint` (not `fromCharCode`) so astral code points such as
		// emoji (`&#128512;`, `&#x1F600;`) decode to a full character instead of
		// a truncated UTF-16 code unit. Guard the range: `fromCodePoint` throws on
		// values above U+10FFFF, and the entity length limit still admits a
		// 9-digit decimal that exceeds it.
		const MAX_CODE_POINT = 0x10ffff;

		match = htmlEntityCode.match(/^#x([\da-fA-F]+)$/);
		if (match) {
			const codePoint = parseInt(match[1], 16);
			return codePoint <= MAX_CODE_POINT ? String.fromCodePoint(codePoint) : entity;
		}

		match = htmlEntityCode.match(/^#(\d+)$/);
		if (match) {
			const codePoint = parseInt(match[1], 10);
			return codePoint <= MAX_CODE_POINT ? String.fromCodePoint(codePoint) : entity;
		}

		return entity;
	});
