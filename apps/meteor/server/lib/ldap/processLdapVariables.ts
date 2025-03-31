import type { ILDAPEntry } from '@rocket.chat/core-typings';

import { getLdapDynamicValue } from './getLdapDynamicValue';
import { executeOperation, type LDAPVariableOperation } from './operations/executeOperation';

export type LDAPVariableConfiguration = {
	input: string;
	output?: LDAPVariableOperation;
};
export type LDAPVariableMap = Record<string, LDAPVariableConfiguration>;

export function processLdapVariables(entry: ILDAPEntry, variableMap: LDAPVariableMap): ILDAPEntry {
	if (!variableMap || !Object.keys(variableMap).length) {
		return entry;
	}

	for (const variableName in variableMap) {
		if (!variableMap.hasOwnProperty(variableName)) {
			continue;
		}

		const variableData = variableMap[variableName];
		if (!variableData?.input) {
			continue;
		}

		const input = getLdapDynamicValue(entry, variableData.input) || '';
		const output = executeOperation(entry, input, variableData.output) || '';

		entry[variableName] = output;
	}

	return entry;
}
