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

export function diffAttributes(a: IAbacAttributeDefinition[] = [], b: IAbacAttributeDefinition[] = []): IAbacAttributeDefinition[] {
	if (!a?.length && b?.length) {
		return b;
	}

	if (!b?.length) {
		return [];
	}

	const mapA = new Map(a.map((item) => [item.key, new Set(item.values)]));
	const mapB = new Map(b.map((item) => [item.key, new Set(item.values)]));

	const diff: IAbacAttributeDefinition[] = [];

	// Check keys in A
	for (const [key, valuesA] of mapA) {
		const valuesB = mapB.get(key);

		if (!valuesB) {
			// key removed
			diff.push({ key, values: [...valuesA] });
			continue;
		}

		const setA = valuesA;
		const setB = valuesB;

		const changed = [...setA].some((v) => !setB.has(v)) || [...setB].some((v) => !setA.has(v));

		if (changed) {
			diff.push({ key, values: [...setB] });
		}
	}

	// Check keys added in B
	for (const [key, valuesB] of mapB) {
		if (!mapA.has(key)) {
			diff.push({ key, values: [...valuesB] });
		}
	}

	return diff;
}
