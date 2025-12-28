import type { ILDAPEntry } from '@rocket.chat/core-typings';

import { executeFallback, type LDAPVariableFallback } from './fallback';
import { executeMatch, type LDAPVariableMatch } from './match';
import { executeReplace, type LDAPVariableReplace } from './replace';
import { executeSplit, type LDAPVariableSplit } from './split';
import { executeSubstring, type LDAPVariableSubString } from './substring';

export type LDAPVariableOperation =
	| LDAPVariableReplace
	| LDAPVariableMatch
	| LDAPVariableSubString
	| LDAPVariableFallback
	| LDAPVariableSplit;

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
		case 'split':
			return executeSplit(input, operation);
	}

	return input;
}
