import type { ILDAPEntry } from '@rocket.chat/core-typings';

import { getLdapDynamicValue } from '../getLdapDynamicValue';

export type LDAPVariableFallback = {
	operation: 'fallback';
	fallback: string;

	minLength?: number;
};

export function executeFallback(ldapUser: ILDAPEntry, input: string, operation: LDAPVariableFallback): string | undefined {
	let valid = Boolean(input);

	if (valid && typeof operation.minLength === 'number') {
		valid = input.length >= operation.minLength;
	}

	if (valid) {
		return input;
	}

	return getLdapDynamicValue(ldapUser, operation.fallback);
}
