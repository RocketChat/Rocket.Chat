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
	Object.hasOwn(htmlEntityCodeToCharacter, htmlEntityCode);

const fromCodePoint = (codePoint: number, entity: string): string => (codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : entity);

export const unescapeHTML = (str: string): string =>
	toString(str).replace(/\&([^;]{1,10});/g, (entity, htmlEntityCode) => {
		let match;

		if (isHtmlEntityCode(htmlEntityCode)) {
			return htmlEntityCodeToCharacter[htmlEntityCode];
		}

		match = htmlEntityCode.match(/^#x([\da-fA-F]+)$/);
		if (match) {
			return fromCodePoint(parseInt(match[1], 16), entity);
		}

		match = htmlEntityCode.match(/^#(\d+)$/);
		if (match) {
			return fromCodePoint(parseInt(match[1], 10), entity);
		}

		return entity;
	});
