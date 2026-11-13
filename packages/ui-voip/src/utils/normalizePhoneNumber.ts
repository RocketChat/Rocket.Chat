const invisibleFormatCharacters = /\p{Cf}/gu;

const extensionMarker = /[;,]|[\d)\s](?:ext(?:ension)?\.?|x)\s*[:.#]?\s*(?=\d)/i;

const trunkPrefixAfterCountryCode = /^([^\d+]*(?:\+|00)[\s.-]*\d{1,3}[\s.-]*)\(\s*0\s*\)/;

const withoutExtension = (text: string): string => {
	const match = extensionMarker.exec(text);

	if (!match) {
		return text;
	}

	return text.slice(0, /^[;,]/.test(match[0]) ? match.index : match.index + 1);
};

/**
 * The number a dialer can call from a phone number as people write it: its main line, without the formatting.
 * `undefined` when the text holds no number.
 */
export const normalizePhoneNumber = (text: string): string | undefined => {
	const number = withoutExtension(text.normalize('NFKC').replace(invisibleFormatCharacters, ''))
		.replace(trunkPrefixAfterCountryCode, '$1')
		.replace(/[^\d+*#]/g, '')
		.replace(/(?!^)\+/g, '');

	return /\d/.test(number) ? number : undefined;
};
