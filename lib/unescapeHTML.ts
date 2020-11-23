const htmlEntityCodeToCharacter = {
	nbsp: ' ',
	cent: '¢',
	pound: '£',
	yen: '¥',
	euro: '€',
	copy: '©',
	reg: '®',
	lt: '<',
	gt: '>',
	quot: '"',
	amp: '&',
	apos: '\'',
} as const;

const toString = (object: unknown): string =>
	(object ? `${ object }` : '');

const isHtmlEntityCode = (htmlEntityCode: string): htmlEntityCode is keyof typeof htmlEntityCodeToCharacter =>
	htmlEntityCode in htmlEntityCodeToCharacter;

export const unescapeHTML = (str: string): string =>
	toString(str)
		.replace(/\&([^;]{1,10});/g, (entity, htmlEntityCode) => {
			let match;

			if (isHtmlEntityCode(htmlEntityCode)) {
				return htmlEntityCodeToCharacter[htmlEntityCode];
			}

			match = htmlEntityCode.match(/^#x([\da-fA-F]+)$/);
			if (match) {
				return String.fromCharCode(parseInt(match[1], 16));
			}

			match = htmlEntityCode.match(/^#(\d+)$/);
			if (match) {
				return String.fromCharCode(~~match[1]);
			}

			return entity;
		});
