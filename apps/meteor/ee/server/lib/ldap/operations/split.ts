export type LDAPVariableSplit = {
	operation: 'split';
	pattern: string;
	indexToUse?: number;
};

export function executeSplit(input: string, operation: LDAPVariableSplit): string | undefined {
	if (!operation.pattern) {
		throw new Error('Invalid SPLIT operation.');
	}

	if (!input) {
		return input;
	}

	const result = input.split(operation.pattern);
	if (!result) {
		return;
	}

	if (typeof operation.indexToUse === 'number') {
		if (result.length > operation.indexToUse) {
			return result[operation.indexToUse];
		}

		return;
	}

	return result.shift();
}
