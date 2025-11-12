import type { ILDAPEntry, IAbacAttributeDefinition } from '@rocket.chat/core-typings';

export const extractAttribute = (ldapUser: ILDAPEntry, ldapKey: string, abacKey: string): IAbacAttributeDefinition | undefined => {
	if (!ldapKey || !abacKey) {
		return;
	}
	const raw = ldapUser?.[ldapKey];
	if (!raw) {
		return;
	}
	const valuesSet = new Set<string>();
	const addIfValid = (value: unknown) => {
		if (typeof value !== 'string') {
			return;
		}
		const trimmed = value.trim();
		if (!trimmed.length) {
			return;
		}
		valuesSet.add(trimmed);
	};

	if (Array.isArray(raw)) {
		for (const v of raw) {
			addIfValid(v);
		}
	} else {
		addIfValid(raw);
	}
	if (!valuesSet.size) {
		return;
	}
	return { key: abacKey, values: Array.from(valuesSet) };
};
