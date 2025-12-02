import type { ILDAPEntry, IAbacAttributeDefinition } from '@rocket.chat/core-typings';
import { AbacAttributes } from '@rocket.chat/models';

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

export function didAttributesChange(current: IAbacAttributeDefinition[], next: IAbacAttributeDefinition[]) {
	let added = false;
	const prevMap = new Map(current.map((a) => [a.key, new Set(a.values)]));
	for (const { key, values } of next) {
		const prevValues = prevMap.get(key);
		if (!prevValues) {
			added = true;
			break;
		}
		for (const v of values) {
			if (!prevValues.has(v)) {
				added = true;
				break;
			}
		}
		if (added) {
			break;
		}
	}

	return added;
}

export function validateAndNormalizeAttributes(attributes: Record<string, string[]>): IAbacAttributeDefinition[] {
	const keyPattern = /^[A-Za-z0-9_-]+$/;
	const normalized: IAbacAttributeDefinition[] = [];

	if (Object.keys(attributes).length > 10) {
		throw new Error('error-invalid-attribute-values');
	}

	for (const [key, values] of Object.entries(attributes)) {
		if (!keyPattern.test(key)) {
			throw new Error('error-invalid-attribute-key');
		}
		if (values.length > 10) {
			throw new Error('error-invalid-attribute-values');
		}
		normalized.push({ key, values });
	}

	return normalized;
}

export async function ensureAttributeDefinitionsExist(normalized: IAbacAttributeDefinition[]): Promise<void> {
	if (!normalized.length) {
		return;
	}

	const uniqueKeys = [...new Set(normalized.map((a) => a.key))];
	const attributeDefinitions = await AbacAttributes.find({ key: { $in: uniqueKeys } }, { projection: { key: 1, values: 1 } }).toArray();

	const definitionValuesMap = new Map<string, Set<string>>(attributeDefinitions.map((def: any) => [def.key, new Set(def.values)]));
	if (definitionValuesMap.size !== uniqueKeys.length) {
		throw new Error('error-attribute-definition-not-found');
	}

	for (const a of normalized) {
		const allowed = definitionValuesMap.get(a.key);
		if (!allowed) {
			throw new Error('error-attribute-definition-not-found');
		}
		for (const v of a.values) {
			if (!allowed.has(v)) {
				throw new Error('error-invalid-attribute-values');
			}
		}
	}
}

export function wereAttributeValuesAdded(prevValues: string[], newValues: string[]) {
	const prevSet = new Set(prevValues);
	return newValues.some((v) => !prevSet.has(v));
}

export function buildNonCompliantConditions(newAttributes: IAbacAttributeDefinition[]) {
	return newAttributes.map(({ key, values }) => ({
		abacAttributes: {
			$not: {
				$elemMatch: {
					key,
					values: { $all: values },
				},
			},
		},
	}));
}

export function buildCompliantConditions(attributes: IAbacAttributeDefinition[]) {
	return attributes.map(({ key, values }) => ({
		abacAttributes: {
			$elemMatch: {
				key,
				values: { $all: values },
			},
		},
	}));
}

export function didSubjectLoseAttributes(previous: IAbacAttributeDefinition[], next: IAbacAttributeDefinition[]): boolean {
	if (!previous.length) {
		return false;
	}
	const nextMap = new Map(next.map((a) => [a.key, new Set(a.values)]));
	for (const prevAttr of previous) {
		const nextValues = nextMap.get(prevAttr.key);
		if (!nextValues) {
			return true;
		}
		for (const v of prevAttr.values) {
			if (!nextValues.has(v)) {
				return true;
			}
		}
	}
	return false;
}

export function buildRoomNonCompliantConditionsFromSubject(subjectAttributes: IAbacAttributeDefinition[]) {
	const map = new Map(subjectAttributes.map((a) => [a.key, new Set(a.values)]));
	const userKeys = Array.from(map.keys());
	const conditions = [];
	conditions.push({
		abacAttributes: {
			$elemMatch: {
				key: { $nin: userKeys },
			},
		},
	});
	for (const [key, valuesSet] of map.entries()) {
		const valuesArr = Array.from(valuesSet);
		conditions.push({
			abacAttributes: {
				$elemMatch: {
					key,
					values: { $elemMatch: { $nin: valuesArr } },
				},
			},
		});
	}
	return conditions;
}
