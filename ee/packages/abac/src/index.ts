import { MeteorError, Room, ServiceClass } from '@rocket.chat/core-services';
import type { AbacActor, IAbacService } from '@rocket.chat/core-services';
import { AbacAccessOperation, AbacObjectType } from '@rocket.chat/core-typings';
import type { IAbacAttribute, IAbacAttributeDefinition, IRoom, AtLeast, IUser, ILDAPEntry } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { Rooms, AbacAttributes, Users, Subscriptions, Settings } from '@rocket.chat/models';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { Document, UpdateFilter } from 'mongodb';
import pLimit from 'p-limit';

import { Audit } from './audit';
import { diffAttributes, extractAttribute } from './helper';

// Limit concurrent user removals to avoid overloading the server with too many operations at once
const limit = pLimit(20);

export class AbacService extends ServiceClass implements IAbacService {
	protected name = 'abac';

	protected logger: Logger;

	constructor() {
		super();
		this.logger = new Logger('AbacService');
	}

	async addSubjectAttributes(user: IUser, ldapUser: ILDAPEntry, map: Record<string, string>): Promise<void> {
		if (!user?._id) {
			return;
		}

		const entries = Object.entries(map || {});

		const mergedMap = new Map<string, Set<string>>();
		for (const [ldapKey, abacKey] of entries) {
			const attr = extractAttribute(ldapUser, ldapKey, abacKey);
			if (!attr) {
				continue;
			}
			const existing = mergedMap.get(attr.key);
			if (!existing) {
				mergedMap.set(attr.key, new Set(attr.values));
				continue;
			}
			for (const v of attr.values) {
				existing.add(v);
			}
		}
		const finalAttributes = Array.from(mergedMap.entries()).map<IAbacAttributeDefinition>(([key, valuesSet]) => ({
			key,
			values: Array.from(valuesSet),
		}));

		if (!finalAttributes.length) {
			if (Array.isArray(user.abacAttributes) && user.abacAttributes.length) {
				const finalUser = await Users.unsetAbacAttributesById(user._id);
				await this.onSubjectAttributesChanged(finalUser!, []);
			}
			return;
		}

		const finalUser = await Users.setAbacAttributesById(user._id, finalAttributes);

		if (this.didSubjectLoseAttributes(user?.abacAttributes || [], finalAttributes)) {
			await this.onSubjectAttributesChanged(finalUser!, finalAttributes);
		}

		const diff = diffAttributes(user?.abacAttributes, finalAttributes);
		if (diff.length) {
			void Audit.subjectAttributeChanged(diff, { _id: user._id, username: user.username });
		}
	}

	async addAbacAttribute(attribute: IAbacAttributeDefinition, actor: AbacActor): Promise<void> {
		if (!attribute.values.length) {
			throw new Error('error-invalid-attribute-values');
		}

		try {
			await AbacAttributes.insertOne(attribute);
			void Audit.attributeCreated(attribute, actor);
		} catch (e) {
			if (e instanceof Error && e.message.includes('E11000')) {
				throw new Error('error-duplicate-attribute-key');
			}
			throw e;
		}
	}

	async listAbacAttributes(filters?: { key?: string; values?: string; offset?: number; count?: number }): Promise<{
		attributes: IAbacAttribute[];
		offset: number;
		count: number;
		total: number;
	}> {
		const query: Document[] = [];
		if (filters?.key) {
			query.push({ key: new RegExp(escapeRegExp(filters.key), 'i') });
		}
		if (filters?.values?.length) {
			query.push({ values: new RegExp(escapeRegExp(filters.values), 'i') });
		}

		const offset = filters?.offset ?? 0;
		const limit = filters?.count ?? 25;

		const { cursor, totalCount } = AbacAttributes.findPaginated(
			{ ...(query.length && { $or: query }) },
			{
				projection: { key: 1, values: 1 },
				skip: offset,
				limit,
			},
		);

		const attributes = await cursor.toArray();

		return {
			attributes,
			offset,
			count: attributes.length,
			total: await totalCount,
		};
	}

	async listAbacRooms(filters?: {
		offset?: number;
		count?: number;
		filter?: string;
		filterType?: 'all' | 'roomName' | 'attribute' | 'value';
	}): Promise<{
		rooms: IRoom[];
		offset: number;
		count: number;
		total: number;
	}> {
		const offset = filters?.offset ?? 0;
		const limit = filters?.count ?? 25;

		const baseQuery: Document = {
			t: 'p',
			abacAttributes: { $exists: true, $ne: [] },
		};

		const { filter, filterType } = filters || {};

		if (filter?.trim().length) {
			const regex = new RegExp(escapeRegExp(filter.trim()), 'i');

			let condition: Document;

			switch (filterType) {
				case 'roomName':
					condition = { $or: [{ name: regex }, { fname: regex }] };
					break;
				case 'attribute':
					condition = { 'abacAttributes.key': regex };
					break;
				case 'value':
					condition = { 'abacAttributes.values': regex };
					break;
				case 'all':
				default:
					condition = {
						$or: [{ name: regex }, { fname: regex }, { 'abacAttributes.key': regex }, { 'abacAttributes.values': regex }],
					};
					break;
			}

			Object.assign(baseQuery, condition);
		}

		const { cursor, totalCount } = Rooms.findPaginated(baseQuery, {
			skip: offset,
			limit,
			sort: { name: 1 },
		});

		const rooms = await cursor.toArray();

		return {
			rooms,
			offset,
			count: rooms.length,
			total: await totalCount,
		};
	}

	async updateAbacAttributeById(_id: string, update: { key?: string; values?: string[] }, actor: AbacActor): Promise<void> {
		if (!update.key && !update.values) {
			return;
		}

		const existing = await AbacAttributes.findOneById(_id, { projection: { key: 1, values: 1 } });
		if (!existing) {
			throw new Error('error-attribute-not-found');
		}

		if (update.values && !update.values.length) {
			throw new Error('error-invalid-attribute-values');
		}

		const newKey = update.key ?? existing.key;
		const newValues = update.values ?? existing.values;

		const removedValues = existing.values.filter((v) => !newValues.includes(v));
		const keyChanged = newKey !== existing.key;

		const valuesToCheck = keyChanged ? existing.values : removedValues;

		if (keyChanged || valuesToCheck.length) {
			const inUse = await Rooms.isAbacAttributeInUse(existing.key, valuesToCheck.length ? valuesToCheck : existing.values);
			if (inUse) {
				throw new Error('error-attribute-in-use');
			}
		}

		const modifier: UpdateFilter<IAbacAttribute> = {};
		if (update.key) {
			modifier.key = update.key;
		}
		if (update.values) {
			modifier.values = update.values;
		}

		if (!Object.keys(modifier).length) {
			return;
		}

		try {
			await AbacAttributes.updateOne({ _id }, { $set: modifier });
			void Audit.attributeUpdated(existing, modifier as IAbacAttributeDefinition, actor);
		} catch (e) {
			if (e instanceof Error && e.message.includes('E11000')) {
				throw new Error('error-duplicate-attribute-key');
			}
			throw e;
		}
	}

	async deleteAbacAttributeById(_id: string, actor: AbacActor): Promise<void> {
		const existing = await AbacAttributes.findOneById(_id, { projection: { key: 1, values: 1 } });
		if (!existing) {
			throw new Error('error-attribute-not-found');
		}

		const inUse = await Rooms.isAbacAttributeInUse(existing.key, existing.values);
		if (inUse) {
			throw new Error('error-attribute-in-use');
		}

		await AbacAttributes.removeById(_id);
		void Audit.attributeDeleted(existing, actor);
	}

	async getAbacAttributeById(_id: string): Promise<{ key: string; values: string[]; usage: Record<string, boolean> }> {
		const attribute = await AbacAttributes.findOneById(_id, { projection: { key: 1, values: 1 } });
		if (!attribute) {
			throw new Error('error-attribute-not-found');
		}

		const usageEntries = await Promise.all(
			(attribute.values || []).map(async (value) => {
				const used = await Rooms.isAbacAttributeInUse(attribute.key, [value]);
				return [value, used] as const;
			}),
		);

		const usage: Record<string, boolean> = Object.fromEntries(usageEntries);

		return {
			...attribute,
			usage,
		};
	}

	async isAbacAttributeInUseByKey(key: string): Promise<boolean> {
		const attribute = await AbacAttributes.findOneByKey(key, { projection: { values: 1 } });
		if (!attribute) {
			return false;
		}
		return Rooms.isAbacAttributeInUse(key, attribute.values || []);
	}

	async setRoomAbacAttributes(rid: string, attributes: Record<string, string[]>, actor: AbacActor): Promise<void> {
		const room = await Rooms.findOneByIdAndType<
			Pick<IRoom, '_id' | 'abacAttributes' | 't' | 'teamMain' | 'teamDefault' | 'default' | 'name'>
		>(rid, 'p', {
			projection: { abacAttributes: 1, t: 1, teamMain: 1, teamDefault: 1, default: 1, name: 1 },
		});
		if (!room) {
			throw new Error('error-room-not-found');
		}
		if (room.default || room.teamDefault) {
			throw new Error('error-cannot-convert-default-room-to-abac');
		}

		if (!Object.keys(attributes).length && room.abacAttributes?.length) {
			await Rooms.unsetAbacAttributesById(rid);
			void Audit.objectAttributesRemoved({ _id: room._id, name: room.name }, room.abacAttributes, actor);
			return;
		}

		const normalized = this.validateAndNormalizeAttributes(attributes);

		await this.ensureAttributeDefinitionsExist(normalized);

		const updated = await Rooms.setAbacAttributesById(rid, normalized);
		void Audit.objectAttributeChanged({ _id: room._id, name: room.name }, room.abacAttributes || [], normalized, 'updated', actor);

		const previous: IAbacAttributeDefinition[] = room.abacAttributes || [];
		if (this.didAttributesChange(previous, normalized)) {
			await this.onRoomAttributesChanged(room, (updated?.abacAttributes as IAbacAttributeDefinition[] | undefined) ?? normalized);
		}
	}

	private didAttributesChange(current: IAbacAttributeDefinition[], next: IAbacAttributeDefinition[]) {
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

	private validateAndNormalizeAttributes(attributes: Record<string, string[]>): IAbacAttributeDefinition[] {
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

	private async ensureAttributeDefinitionsExist(normalized: IAbacAttributeDefinition[]): Promise<void> {
		if (!normalized.length) {
			return;
		}

		const keys = normalized.map((a) => a.key);
		const attributeDefinitions = await AbacAttributes.find({ key: { $in: keys } }, { projection: { key: 1, values: 1 } }).toArray();

		const definitionValuesMap = new Map<string, Set<string>>(attributeDefinitions.map((def: any) => [def.key, new Set(def.values)]));
		if (definitionValuesMap.size !== keys.length) {
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

	async updateRoomAbacAttributeValues(rid: string, key: string, values: string[], actor: AbacActor): Promise<void> {
		const room = await Rooms.findOneByIdAndType<
			Pick<IRoom, '_id' | 'abacAttributes' | 't' | 'teamMain' | 'teamDefault' | 'default' | 'name'>
		>(rid, 'p', {
			projection: { abacAttributes: 1, t: 1, teamMain: 1, teamDefault: 1, default: 1, name: 1 },
		});
		if (!room) {
			throw new Error('error-room-not-found');
		}

		if (room.default || room.teamDefault) {
			throw new Error('error-cannot-convert-default-room-to-abac');
		}

		const previous: IAbacAttributeDefinition[] = room.abacAttributes || [];

		const existingIndex = previous.findIndex((a) => a.key === key);
		const isNewKey = existingIndex === -1;
		if (isNewKey && previous.length >= 10) {
			throw new Error('error-invalid-attribute-values');
		}

		await this.ensureAttributeDefinitionsExist([{ key, values }]);

		if (isNewKey) {
			await Rooms.updateSingleAbacAttributeValuesById(rid, key, values);
			void Audit.objectAttributeChanged(
				{ _id: room._id, name: room.name },
				room.abacAttributes || [],
				[{ key, values }],
				'key-added',
				actor,
			);
			const next = [...previous, { key, values }];

			await this.onRoomAttributesChanged(room, next);
			return;
		}

		const prevValues = previous[existingIndex].values;

		if (prevValues.length === values.length && prevValues.every((v, i) => v === values[i])) {
			return;
		}

		await Rooms.updateAbacAttributeValuesArrayFilteredById(rid, key, values);
		void Audit.objectAttributeChanged(
			{ _id: room._id, name: room.name },
			room.abacAttributes || [],
			[{ key, values }],
			'key-updated',
			actor,
		);

		if (this.wereAttributeValuesAdded(prevValues, values)) {
			const next = previous.map((a, i) => (i === existingIndex ? { key, values } : a));
			await this.onRoomAttributesChanged(room, next);
		}
	}

	private wereAttributeValuesAdded(prevValues: string[], newValues: string[]) {
		const prevSet = new Set(prevValues);
		return newValues.some((v) => !prevSet.has(v));
	}

	async removeRoomAbacAttribute(rid: string, key: string, actor: AbacActor): Promise<void> {
		const room = await Rooms.findOneByIdAndType<Pick<IRoom, '_id' | 'abacAttributes' | 'teamDefault' | 'default' | 'name'>>(rid, 'p', {
			projection: { abacAttributes: 1, default: 1, teamDefault: 1, name: 1 },
		});
		if (!room) {
			throw new Error('error-room-not-found');
		}

		if (room.default || room.teamDefault) {
			throw new Error('error-cannot-convert-default-room-to-abac');
		}

		const previous: IAbacAttributeDefinition[] = room.abacAttributes || [];
		const exists = previous.some((a) => a.key === key);
		if (!exists) {
			return;
		}

		// if is the last attribute, just remove all
		if (previous.length === 1) {
			await Rooms.unsetAbacAttributesById(rid);
			void Audit.objectAttributesRemoved({ _id: room._id }, previous, actor);

			return;
		}

		await Rooms.removeAbacAttributeByRoomIdAndKey(rid, key);
		void Audit.objectAttributeRemoved(
			{ _id: room._id, name: room.name },
			previous,
			previous.filter((a) => a.key !== key),
			'key-removed',
			actor,
		);
	}

	async addRoomAbacAttributeByKey(rid: string, key: string, values: string[], actor: AbacActor): Promise<void> {
		await this.ensureAttributeDefinitionsExist([{ key, values }]);

		const room = await Rooms.findOneByIdAndType<
			Pick<IRoom, '_id' | 'abacAttributes' | 't' | 'teamMain' | 'default' | 'teamDefault' | 'name'>
		>(rid, 'p', {
			projection: { abacAttributes: 1, t: 1, teamMain: 1, teamDefault: 1, default: 1, name: 1 },
		});
		if (!room) {
			throw new Error('error-room-not-found');
		}

		if (room.default || room.teamDefault) {
			throw new Error('error-cannot-convert-default-room-to-abac');
		}

		const previous: IAbacAttributeDefinition[] = room.abacAttributes || [];
		if (previous.some((a) => a.key === key)) {
			throw new Error('error-duplicate-attribute-key');
		}

		if (previous.length >= 10) {
			throw new Error('error-invalid-attribute-values');
		}

		const updated = await Rooms.insertAbacAttributeIfNotExistsById(rid, key, values);
		const next = updated?.abacAttributes || [...previous, { key, values }];

		void Audit.objectAttributeChanged({ _id: room._id, name: room.name }, previous, next, 'key-added', actor);

		await this.onRoomAttributesChanged(room, next);
	}

	async replaceRoomAbacAttributeByKey(rid: string, key: string, values: string[], actor: AbacActor): Promise<void> {
		await this.ensureAttributeDefinitionsExist([{ key, values }]);

		const room = await Rooms.findOneByIdAndType<
			Pick<IRoom, '_id' | 'abacAttributes' | 't' | 'teamMain' | 'default' | 'teamDefault' | 'name'>
		>(rid, 'p', {
			projection: { abacAttributes: 1, t: 1, teamMain: 1, teamDefault: 1, default: 1, name: 1 },
		});
		if (!room) {
			throw new Error('error-room-not-found');
		}

		if (room.default || room.teamDefault) {
			throw new Error('error-cannot-convert-default-room-to-abac');
		}

		const exists = room?.abacAttributes?.some((a) => a.key === key);

		if (exists) {
			const updated = await Rooms.updateAbacAttributeValuesArrayFilteredById(rid, key, values);
			const prevValues = room.abacAttributes?.find((a) => a.key === key)?.values ?? [];

			void Audit.objectAttributeChanged(
				{ _id: room._id, name: room.name },
				room.abacAttributes || [],
				updated?.abacAttributes || [],
				'key-updated',
				actor,
			);
			if (this.wereAttributeValuesAdded(prevValues, values)) {
				await this.onRoomAttributesChanged(room, updated?.abacAttributes || []);
			}

			return;
		}

		if (room?.abacAttributes?.length === 10) {
			throw new Error('error-invalid-attribute-values');
		}

		const updated = await Rooms.insertAbacAttributeIfNotExistsById(rid, key, values);
		void Audit.objectAttributeChanged(
			{ _id: room._id, name: room.name },
			room.abacAttributes || [],
			updated?.abacAttributes || [],
			'key-added',
			actor,
		);

		await this.onRoomAttributesChanged(room, updated?.abacAttributes || []);
	}

	private buildNonCompliantConditions(newAttributes: IAbacAttributeDefinition[]) {
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

	private buildCompliantConditions(attributes: IAbacAttributeDefinition[]) {
		return attributes.map(({ key, values }) => ({
			abacAttributes: {
				$elemMatch: {
					key,
					values: { $all: values },
				},
			},
		}));
	}

	async checkUsernamesMatchAttributes(usernames: string[], attributes: IAbacAttributeDefinition[]): Promise<void> {
		if (!usernames.length || !attributes.length) {
			return;
		}

		const nonComplianceConditions = this.buildNonCompliantConditions(attributes);
		const nonCompliantUsersFromList = await Users.find(
			{
				username: { $in: usernames },
				$or: nonComplianceConditions,
			},
			{ projection: { username: 1 } },
		)
			.map((u) => u.username as string)
			.toArray();

		const nonCompliantSet = new Set<string>(nonCompliantUsersFromList);

		if (nonCompliantSet.size) {
			throw new MeteorError(
				'error-usernames-not-matching-abac-attributes',
				'Some usernames do not comply with the ABAC attributes for the room',
				Array.from(nonCompliantSet),
			);
		}

		this.logger.debug({
			msg: 'User list complied with ABAC attributes for room',
			usernames,
		});
	}

	protected async onRoomAttributesChanged(
		room: AtLeast<IRoom, '_id' | 't' | 'teamMain' | 'abacAttributes'>,
		newAttributes: IAbacAttributeDefinition[],
	): Promise<void> {
		const rid = room._id;
		if (!newAttributes?.length) {
			// When a room has no ABAC attributes, it becomes a normal private group and no user removal is necessary
			this.logger.warn({
				msg: 'Room ABAC attributes removed. Room is not abac managed anymore',
				rid,
			});

			return;
		}

		try {
			const nonCompliantConditions = this.buildNonCompliantConditions(newAttributes);

			if (!nonCompliantConditions.length) {
				return;
			}

			const query = {
				__rooms: rid,
				$or: nonCompliantConditions,
			};

			const cursor = Users.find(query, { projection: { __rooms: 0 } });

			const usersToRemove: string[] = [];
			const userRemovalPromises = [];
			for await (const doc of cursor) {
				usersToRemove.push(doc._id);
				void Audit.actionPerformed({ _id: doc._id, username: doc.username }, { _id: rid }, 'room-attributes-change');
				userRemovalPromises.push(
					limit(() =>
						Room.removeUserFromRoom(rid, doc, {
							skipAppPreEvents: true,
							customSystemMessage: 'abac-removed-user-from-room' as const,
						}),
					),
				);
			}

			if (!usersToRemove.length) {
				return;
			}

			await Promise.all(userRemovalPromises);
		} catch (err) {
			this.logger.error({
				msg: 'Failed to re-evaluate room subscriptions after ABAC attributes changed',
				rid,
				err,
			});
		}
	}

	async canAccessObject(
		room: Pick<IRoom, '_id' | 't' | 'teamId' | 'prid' | 'abacAttributes'>,
		user: Pick<IUser, '_id'>,
		action: AbacAccessOperation,
		objectType: AbacObjectType,
	) {
		// We may need this flex for phase 2, but for now only ROOM/READ is supported
		if (objectType !== AbacObjectType.ROOM) {
			throw new Error('error-abac-unsupported-object-type');
		}

		if (action !== AbacAccessOperation.READ) {
			throw new Error('error-abac-unsupported-operation');
		}

		if (!user?._id || !room?.abacAttributes?.length) {
			return false;
		}

		const decisionCacheTimeout = (await Settings.getValueById('Abac_Cache_Decision_Time_Seconds')) as number;
		const userSub = await Subscriptions.findOneByRoomIdAndUserId(room._id, user._id, { projection: { abacLastTimeChecked: 1 } });
		if (!userSub) {
			return false;
		}

		// Cases:
		// 1) Never checked before -> check now
		// 2) Checked before, but cache expired -> check now
		// 3) Checked before, and cache valid -> use cached decision (subsciprtion exists)
		// 4) Cache disabled (0) -> always check
		if (
			decisionCacheTimeout > 0 &&
			userSub.abacLastTimeChecked &&
			Date.now() - userSub.abacLastTimeChecked.getTime() < decisionCacheTimeout * 1000
		) {
			this.logger.debug({ msg: 'Using cached ABAC decision', userId: user._id, roomId: room._id });
			return !!userSub;
		}

		const isUserCompliant = await Users.findOne(
			{
				_id: user._id,
				$and: this.buildCompliantConditions(room.abacAttributes),
			},
			{ projection: { _id: 1 } },
		);

		if (!isUserCompliant) {
			const fullUser = await Users.findOneById(user._id);
			if (!fullUser) {
				return false;
			}

			// When a user is not compliant, remove them from the room automatically
			await Room.removeUserFromRoom(room._id, fullUser, {
				skipAppPreEvents: true,
				customSystemMessage: 'abac-removed-user-from-room' as const,
			});

			void Audit.actionPerformed({ _id: user._id, username: fullUser.username }, { _id: room._id }, 'realtime-policy-eval');
			return false;
		}

		// Set last time the decision was made
		await Subscriptions.setAbacLastTimeCheckedByUserIdAndRoomId(user._id, room._id, new Date());
		return true;
	}

	private didSubjectLoseAttributes(previous: IAbacAttributeDefinition[], next: IAbacAttributeDefinition[]): boolean {
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

	protected async onSubjectAttributesChanged(user: IUser, _next: IAbacAttributeDefinition[]): Promise<void> {
		if (!user?._id || !Array.isArray(user.__rooms) || !user.__rooms.length) {
			return;
		}

		const roomIds: string[] = user.__rooms;

		try {
			// No attributes: no rooms :(
			if (!_next.length) {
				const cursor = Rooms.find(
					{
						_id: { $in: roomIds },
						abacAttributes: { $exists: true, $ne: [] },
					},
					{ projection: { _id: 1 } },
				);

				const removalPromises: Promise<void>[] = [];
				for await (const room of cursor) {
					void Audit.actionPerformed({ _id: user._id, username: user.username }, { _id: room._id }, 'ldap-sync');
					removalPromises.push(
						limit(() =>
							Room.removeUserFromRoom(room._id, user, {
								skipAppPreEvents: true,
								customSystemMessage: 'abac-removed-user-from-room' as const,
							}),
						),
					);
				}

				await Promise.all(removalPromises);
				return;
			}

			const query = {
				_id: { $in: roomIds },
				$or: this.buildRoomNonCompliantConditionsFromSubject(_next),
			};

			const cursor = Rooms.find(query, { projection: { _id: 1 } });

			const removalPromises: Promise<unknown>[] = [];
			for await (const room of cursor) {
				void Audit.actionPerformed({ _id: user._id, username: user.username }, { _id: room._id }, 'ldap-sync');
				removalPromises.push(
					limit(() =>
						Room.removeUserFromRoom(room._id, user, {
							skipAppPreEvents: true,
							customSystemMessage: 'abac-removed-user-from-room' as const,
						}),
					),
				);
			}

			await Promise.all(removalPromises);
		} catch (err) {
			this.logger.error({
				msg: 'Failed to query and remove user from non-compliant ABAC rooms',
				err,
			});
		}
	}

	private buildRoomNonCompliantConditionsFromSubject(subjectAttributes: IAbacAttributeDefinition[]) {
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
}

export default AbacService;
