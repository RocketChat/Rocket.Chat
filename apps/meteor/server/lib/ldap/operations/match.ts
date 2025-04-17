export type LDAPVariableMatch = {
	operation: 'match';
	pattern: string;
	regex?: boolean;
	flags?: string;
	indexToUse?: number;
	valueIfTrue?: string;
	valueIfFalse?: string;
};

export function executeMatch(input: string, operation: LDAPVariableMatch): string | undefined {
	if (!operation.pattern || (typeof operation.valueIfTrue !== 'string' && typeof operation.indexToUse !== 'number')) {
		throw new Error('Invalid MATCH operation.');
	}

	const pattern = operation.regex ? new RegExp(operation.pattern, operation.flags) : operation.pattern;

	const result = input.match(pattern);
	if (!result) {
		return operation.valueIfFalse;
	}

	if (typeof operation.indexToUse === 'number' && result.length > operation.indexToUse) {
		return result[operation.indexToUse];
	}

	return operation.valueIfTrue;
}
