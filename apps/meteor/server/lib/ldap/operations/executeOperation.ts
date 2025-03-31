import type { ILDAPEntry } from '@rocket.chat/core-typings';

import type { LDAPVariableFallback } from './fallback';
import { executeFallback } from './fallback';
import type { LDAPVariableMatch } from './match';
import { executeMatch } from './match';
import type { LDAPVariableReplace } from './replace';
import { executeReplace } from './replace';
import type { LDAPVariableSubString } from './substring';
import { executeSubstring } from './substring';

export type LDAPVariableOperation = LDAPVariableReplace | LDAPVariableMatch | LDAPVariableSubString | LDAPVariableFallback;

export function executeOperation(ldapUser: ILDAPEntry, input: string, operation?: LDAPVariableOperation): string | undefined {
	switch (operation?.operation) {
		case 'replace':
			return executeReplace(input, operation);
		case 'match':
			return executeMatch(input, operation);
		case 'substring':
			return executeSubstring(input, operation);
		case 'fallback':
			return executeFallback(ldapUser, input, operation);
	}

	return input;
}
