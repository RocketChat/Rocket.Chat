export type LDAPVariableReplace = {
	operation: 'replace';
	pattern: string;
	regex?: boolean;
	flags?: string;
	all?: boolean;
	replacement: string;
};

export function executeReplace(input: string, operation: LDAPVariableReplace): string {
	if (!operation.pattern || operation.replacement !== 'string') {
		throw new Error('Invalid REPLACE operation.');
	}

	const pattern = operation.regex ? new RegExp(operation.pattern, operation.flags) : operation.pattern;

	if (operation.all) {
		return input.replaceAll(pattern, operation.replacement);
	}

	return input.replace(pattern, operation.replacement);
}
