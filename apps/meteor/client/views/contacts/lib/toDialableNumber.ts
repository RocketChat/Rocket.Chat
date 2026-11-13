import type { IContactPhone } from '@rocket.chat/core-typings';

const beyondOneNumber = /[\p{L},;]|[^\d\P{Nd}]/u;

/**
 * The number to dial for a contact phone, or `undefined` when the phone has no form that is safe to dial as a single
 * number.
 */
export const toDialableNumber = ({ raw, e164 }: Pick<IContactPhone, 'raw' | 'e164'>): string | undefined => {
	if (e164) {
		return e164;
	}

	const text = raw.normalize('NFKC');

	if (beyondOneNumber.test(text)) {
		return undefined;
	}

	const number = text.replace(/[^\d+*#]/g, '');

	if (!/\d/.test(number) || number.lastIndexOf('+') > 0) {
		return undefined;
	}

	return number;
};
