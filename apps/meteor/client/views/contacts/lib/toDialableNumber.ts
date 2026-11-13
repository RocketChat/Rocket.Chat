import type { IContactPhone } from '@rocket.chat/core-typings';
import { normalizePhoneNumber } from '@rocket.chat/ui-voip';

/**
 * The number to dial for a contact phone, in international form when one is known. `undefined` when the phone holds
 * no number to dial.
 */
export const toDialableNumber = ({ raw, e164 }: Pick<IContactPhone, 'raw' | 'e164'>): string | undefined =>
	e164 || normalizePhoneNumber(raw);
