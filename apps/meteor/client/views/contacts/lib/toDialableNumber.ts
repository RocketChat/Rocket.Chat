import type { IContactPhone } from '@rocket.chat/core-typings';

/**
 * The number to hand to the dialer: the E.164 form when the server resolved one, otherwise `raw` reduced to digits,
 * '*', '#' and one leading '+'. `raw` keeps the source formatting for display ("+49 176 10848201"), which the dialer
 * does not accept.
 */
export const toDialableNumber = ({ raw, e164 }: Pick<IContactPhone, 'raw' | 'e164'>): string =>
	e164 ||
	raw
		.normalize('NFKC')
		.replace(/[^\d+*#]/g, '')
		.replace(/(?!^)\+/g, '');
