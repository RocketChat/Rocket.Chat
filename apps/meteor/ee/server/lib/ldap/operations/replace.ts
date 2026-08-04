export type LDAPVariableReplace = {
	operation: 'replace';
	pattern: string;
	regex?: boolean;
	flags?: string;
	all?: boolean;
	replacement: string;
};

export function executeReplace(input: string, operation: LDAPVariableReplace): string {
	if (!operation.pattern || typeof operation.replacement !== 'string') {
		throw new Error('Invalid REPLACE operation.');
	}

	const flags = operation.regex && operation.all ? `${operation.flags || ''}${operation.flags?.includes('g') ? '' : 'g'}` : operation.flags;
	const pattern = operation.regex ? new RegExp(operation.pattern, flags) : operation.pattern;

	if (operation.all) {
		return input.replaceAll(pattern, operation.replacement);
	}

	return input.replace(pattern, operation.replacement);
}
