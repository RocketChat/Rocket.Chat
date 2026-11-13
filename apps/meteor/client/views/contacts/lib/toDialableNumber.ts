import type { IContactPhone } from '@rocket.chat/core-typings';

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
 * The number to dial for a contact phone: its main line, in international form when one is known. `undefined` when the
 * phone holds no number to dial.
 */
export const toDialableNumber = ({ raw, e164 }: Pick<IContactPhone, 'raw' | 'e164'>): string | undefined => {
	if (e164) {
		return e164;
	}

	const number = withoutExtension(raw.normalize('NFKC').replace(invisibleFormatCharacters, ''))
		.replace(trunkPrefixAfterCountryCode, '$1')
		.replace(/[^\d+*#]/g, '')
		.replace(/(?!^)\+/g, '');

	return /\d/.test(number) ? number : undefined;
};
