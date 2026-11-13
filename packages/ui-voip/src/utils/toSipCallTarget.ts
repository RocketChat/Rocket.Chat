import { normalizePhoneNumber } from './normalizePhoneNumber';

const sipUserName = /^\p{L}[\p{L}\p{N}._-]*$/u;

/**
 * What to call for a SIP peer: a named extension as it is, anything else as a phone number. `undefined` when there
 * is nothing to call.
 */
export const toSipCallTarget = (id: string): string | undefined => {
	const name = id.trim();

	return sipUserName.test(name) ? name : normalizePhoneNumber(id);
};
