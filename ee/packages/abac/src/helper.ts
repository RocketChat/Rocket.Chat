import type { ILDAPEntry, IAbacAttributeDefinition, IRoom } from '@rocket.chat/core-typings';
import { AbacAttributes, Rooms } from '@rocket.chat/models';
import mem from 'mem';

import {
	AbacAttributeDefinitionNotFoundError,
	AbacCannotConvertDefaultRoomToAbacError,
	AbacInvalidAttributeKeyError,
	AbacInvalidAttributeValuesError,
	AbacRoomNotFoundError,
} from './errors';

export const MAX_ABAC_ATTRIBUTE_KEYS = 10;
export const MAX_ABAC_ATTRIBUTE_VALUES = 10;

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

export function validateAndNormalizeAttributes(attributes: Record<string, string[]>): IAbacAttributeDefinition[] {
	const keyPattern = /^[A-Za-z0-9_-]+$/;
	const normalized: IAbacAttributeDefinition[] = [];

	const entries = Object.entries(attributes);

	const aggregated = new Map<string, Set<string>>();

	for (const [rawKey, values] of entries) {
		const key = rawKey.trim();

		if (!key.length || !keyPattern.test(key)) {
			throw new AbacInvalidAttributeKeyError();
		}

		const bucket = aggregated.get(key) ?? new Set<string>();
		if (!aggregated.has(key)) {
			if (aggregated.size >= MAX_ABAC_ATTRIBUTE_KEYS) {
				throw new AbacInvalidAttributeValuesError();
			}
			aggregated.set(key, bucket);
		}

		for (const value of values) {
			if (typeof value !== 'string') {
				continue;
			}
			const trimmed = value.trim();
			if (!trimmed.length) {
				continue;
			}
			if (bucket.size >= MAX_ABAC_ATTRIBUTE_VALUES && !bucket.has(trimmed)) {
				throw new AbacInvalidAttributeValuesError();
			}
			bucket.add(trimmed);
		}
	}

	if (aggregated.size > MAX_ABAC_ATTRIBUTE_KEYS) {
		throw new AbacInvalidAttributeValuesError();
	}

	for (const [key, valueSet] of aggregated.entries()) {
		if (!valueSet.size) {
			throw new AbacInvalidAttributeValuesError();
		}
		normalized.push({ key, values: Array.from(valueSet) });
	}

	return normalized;
}

const getAttributeDefinitionsFromDb = async (keys: string[]) =>
	AbacAttributes.find({ key: { $in: keys } }, { projection: { key: 1, values: 1 } }).toArray();

const getAttributeDefinitionsCached = mem(getAttributeDefinitionsFromDb, {
	maxAge: 30_000,
	cacheKey: JSON.stringify,
});

export async function ensureAttributeDefinitionsExist(normalized: IAbacAttributeDefinition[]): Promise<void> {
	if (!normalized.length) {
		return;
	}

	const uniqueKeys = [...new Set(normalized.map((a) => a.key))];
	const attributeDefinitions = await getAttributeDefinitionsCached(uniqueKeys);

	const definitionValuesMap = new Map<string, Set<string>>(attributeDefinitions.map((def) => [def.key, new Set(def.values)]));
	if (definitionValuesMap.size !== uniqueKeys.length) {
		throw new AbacAttributeDefinitionNotFoundError();
	}

	for (const a of normalized) {
		const allowed = definitionValuesMap.get(a.key);
		if (!allowed) {
			throw new AbacAttributeDefinitionNotFoundError();
		}
		for (const v of a.values) {
			if (!allowed.has(v)) {
				throw new AbacInvalidAttributeValuesError();
			}
		}
	}
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

export async function getAbacRoom(
	rid: string,
): Promise<Pick<IRoom, '_id' | 'abacAttributes' | 't' | 'teamMain' | 'teamDefault' | 'default' | 'name'>> {
	const room = await Rooms.findOneByIdAndType<
		Pick<IRoom, '_id' | 'abacAttributes' | 't' | 'teamMain' | 'teamDefault' | 'default' | 'name'>
	>(rid, 'p', {
		projection: { abacAttributes: 1, t: 1, teamMain: 1, teamDefault: 1, default: 1, name: 1 },
	});
	if (!room) {
		throw new AbacRoomNotFoundError();
	}
	if (room.default || room.teamDefault) {
		throw new AbacCannotConvertDefaultRoomToAbacError();
	}

	return room;
}

export function diffAttributeSets(
	current: IAbacAttributeDefinition[] = [],
	next: IAbacAttributeDefinition[] = [],
): { added: boolean; removed: boolean } {
	const currentMap = new Map<string, Set<string>>(current.map((attr) => [attr.key, new Set(attr.values)]));
	const nextMap = new Map<string, Set<string>>(next.map((attr) => [attr.key, new Set(attr.values)]));

	let added = false;
	let removed = false;

	// Check removals and per-key value changes
	for (const [key, currentValues] of currentMap) {
		const nextValues = nextMap.get(key);

		if (!nextValues) {
			// Key was completely removed
			removed = true;
		} else {
			// Check removed values
			for (const v of currentValues) {
				if (!nextValues.has(v)) {
					removed = true;
					break;
				}
			}
		}

		if (removed) {
			break;
		}
	}

	// Check additions (new keys or new values on existing keys)
	if (!removed) {
		for (const [key, nextValues] of nextMap) {
			const currentValues = currentMap.get(key);

			if (!currentValues) {
				// New key added
				added = true;
				break;
			}

			for (const v of nextValues) {
				if (!currentValues.has(v)) {
					added = true;
					break;
				}
			}

			if (added) {
				break;
			}
		}
	} else {
		// Even if we've already seen removals, we might still want to know if additions happened too
		for (const [key, nextValues] of nextMap) {
			const currentValues = currentMap.get(key);

			if (!currentValues) {
				added = true;
				break;
			}

			for (const v of nextValues) {
				if (!currentValues.has(v)) {
					added = true;
					break;
				}
			}

			if (added) {
				break;
			}
		}
	}

	return { added, removed };
}
