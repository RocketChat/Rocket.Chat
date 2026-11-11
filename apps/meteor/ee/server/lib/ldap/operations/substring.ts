export type LDAPVariableSubString = {
	operation: 'substring';
	start: number;
	end?: number;
};

export function executeSubstring(input: string, operation: LDAPVariableSubString): string | undefined {
	if (typeof operation.start !== 'number' || (operation.end !== undefined && typeof operation.end !== 'number')) {
		throw new Error('Invalid SUBSTRING operation.');
	}

	return input.substring(operation.start, operation.end);
}
