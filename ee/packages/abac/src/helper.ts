import type { AbacCreationAttributesResult, AbacRoomMembershipPreviewPage } from '@rocket.chat/core-services';
import type {
	AbacMembershipGroup,
	AbacMembershipVerdict,
	AbacRoomPreviewMember,
	ILDAPEntry,
	IAbacAttributeDefinition,
	IRoom,
	ISubscription,
	IUser,
} from '@rocket.chat/core-typings';
import { isDiscussion, isRoomFederated, isRoomXMPPFederated } from '@rocket.chat/core-typings';
import { AbacAttributes, Rooms, Subscriptions, Users } from '@rocket.chat/models';
import mem from 'mem';

import {
	AbacAttributeDefinitionNotFoundError,
	AbacAttributeStoreExternalError,
	AbacContractError,
	AbacEntityResolutionFailedError,
	AbacError,
	AbacErrorCode,
	AbacInvalidAttributeKeyError,
	AbacInvalidAttributeValuesError,
	AbacRoomNotFoundError,
	PdpUnavailableError,
} from './errors';
import type { Evaluation, IResourceDecision, RoomMembersPreview } from './pdp/types';

export const MAX_ABAC_ATTRIBUTE_KEYS = 10;
export const MAX_ABAC_ATTRIBUTE_VALUES = 10;
export const PREVIEW_SCAN_LIMIT = 1000;
export const PREVIEW_READ_OPTIONS = { projection: { _id: 1, username: 1, name: 1, emails: 1 } } as const;

const MEMBERSHIP_VERDICTS: AbacMembershipVerdict[] = ['compliant', 'nonCompliant', 'inconclusive'];

export function toCreationDenial(
	err: unknown,
	reasonForAttributeError: 'invalid' | 'not-entitled' | 'creator-not-admitted',
): Extract<AbacCreationAttributesResult, { allowed: false }> {
	if (err instanceof PdpUnavailableError || err instanceof AbacAttributeStoreExternalError) {
		return { allowed: false, reason: 'unavailable', code: err.code };
	}
	if (err instanceof AbacEntityResolutionFailedError) {
		return { allowed: false, reason: 'inconclusive', code: err.code };
	}
	if (err instanceof AbacError) {
		const { key, attributes } = (err.details ?? {}) as { key?: string; attributes?: IAbacAttributeDefinition[] };
		return {
			allowed: false,
			reason: reasonForAttributeError,
			code: err.code,
			...(key && { key }),
			...(attributes && { attributes }),
		};
	}
	throw err;
}

export function verdictOf({ compliant, nonCompliant }: Evaluation, id: string): AbacMembershipVerdict {
	if (compliant.includes(id)) {
		return 'compliant';
	}
	if (nonCompliant.includes(id)) {
		return 'nonCompliant';
	}
	return 'inconclusive';
}

function verdictsOf(evaluation: Evaluation): (id: string) => AbacMembershipVerdict {
	const verdicts = new Map(MEMBERSHIP_VERDICTS.flatMap((verdict) => evaluation[verdict].map((id) => [id, verdict] as const)));
	return (id) => verdicts.get(id) ?? 'inconclusive';
}

export type PreviewSubject = Pick<IUser, '_id' | 'username' | 'name' | 'emails'>;

export type PreviewWindow = AbacRoomMembershipPreviewPage & { count: number };

const isInGroup = (group: AbacMembershipGroup, verdict: AbacMembershipVerdict): boolean =>
	(group === 'loses') === (verdict !== 'compliant');

export async function withRoomRoles(rid: IRoom['_id'], members: AbacRoomPreviewMember[]): Promise<AbacRoomPreviewMember[]> {
	if (!members.length) {
		return members;
	}

	const subscriptions = await Subscriptions.findByRoomIdAndUserIds<Pick<ISubscription, 'u' | 'roles'>>(
		rid,
		members.map(({ _id }) => _id),
		{ projection: { 'u._id': 1, 'roles': 1 } },
	).toArray();
	const rolesOf = new Map(subscriptions.flatMap(({ u, roles }) => (roles?.length ? [[u._id, roles] as const] : [])));

	return members.map((member) => {
		const roles = rolesOf.get(member._id);
		return roles ? { ...member, roles } : member;
	});
}

export async function previewRoomMembersInSteps(
	rid: IRoom['_id'],
	{ filter, after, count, group }: PreviewWindow,
	evaluate: (subjects: PreviewSubject[]) => Promise<Evaluation>,
	step?: number,
): Promise<RoomMembersPreview> {
	const size = group ? PREVIEW_SCAN_LIMIT : count;

	const read = await Users.findActiveByRoomIdAfterUsername<PreviewSubject>(
		rid,
		{ search: filter, after, limit: size + 1 },
		PREVIEW_READ_OPTIONS,
	).toArray();
	const subjects = read.slice(0, size);
	const batchSize = step ?? subjects.length;
	const members: AbacRoomPreviewMember[] = [];
	let checked = 0;

	while (checked < subjects.length && members.length < count) {
		const batch = subjects.slice(checked, checked + batchSize);
		const verdictFor = verdictsOf(await evaluate(batch));
		members.push(
			...batch
				.map(({ _id, username, name }) => ({ _id, username, name, verdict: verdictFor(_id) }))
				.filter(({ verdict }) => !group || isInGroup(group, verdict)),
		);
		checked += batch.length;
	}

	const last = subjects[checked - 1];
	const next = last?.username && checked < read.length ? { _id: last._id, username: last.username } : undefined;
	return {
		members,
		checked,
		...(!after && { total: await Users.countActiveByRoomIdAfterUsername(rid, { search: filter }) }),
		...(next && { next }),
	};
}

export async function previewRetainingEveryone(rid: IRoom['_id'], page: PreviewWindow): Promise<RoomMembersPreview> {
	if (page.group === 'loses') {
		const remaining = await Users.countActiveByRoomIdAfterUsername(rid, { search: page.filter, after: page.after });
		return { members: [], checked: remaining, ...(!page.after && { total: remaining }) };
	}

	return previewRoomMembersInSteps(rid, { ...page, group: undefined }, async (subjects) => ({
		compliant: subjects.map(({ _id }) => _id),
		nonCompliant: [],
		inconclusive: [],
	}));
}

const filterValuesByOwnership = (
	attributes: IAbacAttributeDefinition[],
	owned: Map<string, Set<string>>,
	keepOwned: boolean,
): IAbacAttributeDefinition[] =>
	attributes.flatMap(({ key, values }) => {
		const kept = values.filter((value) => (owned.get(key)?.has(value) ?? false) === keepOwned);
		return kept.length ? [{ key, values: kept }] : [];
	});

export const findUnownedValues = (attributes: IAbacAttributeDefinition[], owned: Map<string, Set<string>>) =>
	filterValuesByOwnership(attributes, owned, false);

export const findOwnedValues = (attributes: IAbacAttributeDefinition[], owned: Map<string, Set<string>>) =>
	filterValuesByOwnership(attributes, owned, true);

export function withAttributeValues(
	owned: Map<string, Set<string>>,
	attributes: IAbacAttributeDefinition[] = [],
): Map<string, Set<string>> {
	const merged = new Map(Array.from(owned, ([key, values]) => [key, new Set(values)]));
	for (const { key, values } of attributes) {
		merged.set(key, new Set([...(merged.get(key) ?? []), ...values]));
	}

	return merged;
}

export const toAttributeDefinitions = (entitlements: Map<string, Set<string>>): IAbacAttributeDefinition[] =>
	Array.from(entitlements, ([key, values]) => ({ key, values: [...values] }));

export const sortByKey = (attributes: IAbacAttributeDefinition[]): IAbacAttributeDefinition[] =>
	[...attributes].sort((a, b) => a.key.localeCompare(b.key));

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

export const listAttributeDefinitions = async (): Promise<IAbacAttributeDefinition[]> =>
	AbacAttributes.findAll({ projection: { key: 1, values: 1 } })
		.map(({ key, values }) => ({ key, values }))
		.toArray();

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

export async function getAbacRoom(rid: string): Promise<IRoom> {
	const room = await Rooms.findOneByIdAndType(rid, 'p');
	if (!room) {
		throw new AbacRoomNotFoundError();
	}

	return room;
}

export function assertRoomAcceptsAttributes(room: IRoom): void {
	if (isRoomFederated(room) || isRoomXMPPFederated(room)) {
		throw new AbacContractError(AbacErrorCode.FederatedRoomAttributes);
	}

	if (isDiscussion(room)) {
		throw new AbacContractError(AbacErrorCode.DiscussionRoomAttributes);
	}
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

export const stripTrailingSlashes = (value: string): string => value.replace(/\/+$/, '');

export const classifyDecisions = (decisions: IResourceDecision[] = []): keyof Evaluation => {
	if (decisions.some((rd) => rd.decision === 'DECISION_DENY')) {
		return 'nonCompliant';
	}

	if (decisions.length && decisions.every((rd) => rd.decision === 'DECISION_PERMIT')) {
		return 'compliant';
	}

	return 'inconclusive';
};
