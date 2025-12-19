import { Room, ServiceClass } from '@rocket.chat/core-services';
import type { AbacActor, IAbacService } from '@rocket.chat/core-services';
import { AbacAccessOperation, AbacObjectType } from '@rocket.chat/core-typings';
import type {
	IAbacAttribute,
	IAbacAttributeDefinition,
	IRoom,
	AtLeast,
	IUser,
	ILDAPEntry,
	ISubscription,
	AbacAuditReason,
} from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { Rooms, AbacAttributes, Users, Subscriptions, Settings } from '@rocket.chat/models';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { Document, FindCursor, UpdateFilter } from 'mongodb';
import pLimit from 'p-limit';

import { Audit } from './audit';
import {
	AbacAttributeInUseError,
	AbacAttributeNotFoundError,
	AbacDuplicateAttributeKeyError,
	AbacInvalidAttributeValuesError,
	AbacUnsupportedObjectTypeError,
	AbacUnsupportedOperationError,
	OnlyCompliantCanBeAddedToRoomError,
} from './errors';
import {
	getAbacRoom,
	diffAttributes,
	extractAttribute,
	diffAttributeSets,
	buildCompliantConditions,
	buildNonCompliantConditions,
	validateAndNormalizeAttributes,
	ensureAttributeDefinitionsExist,
	buildRoomNonCompliantConditionsFromSubject,
	MAX_ABAC_ATTRIBUTE_KEYS,
} from './helper';

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
				void Audit.subjectAttributeChanged([], { _id: user._id, username: user.username });
			}
			return;
		}

		const finalUser = await Users.setAbacAttributesById(user._id, finalAttributes);

		if (diffAttributeSets(user?.abacAttributes || [], finalAttributes).removed) {
			await this.onSubjectAttributesChanged(finalUser!, finalAttributes);
		}

		const diff = diffAttributes(user?.abacAttributes, finalAttributes);
		if (diff.length) {
			void Audit.subjectAttributeChanged(diff, { _id: user._id, username: user.username });
		}
	}

	async addAbacAttribute(attribute: IAbacAttributeDefinition, actor: AbacActor): Promise<void> {
		if (!attribute.values.length) {
			throw new AbacInvalidAttributeValuesError();
		}

		try {
			await AbacAttributes.insertOne(attribute);
			void Audit.attributeCreated(attribute, actor);
		} catch (e) {
			if (e instanceof Error && e.message.includes('E11000')) {
				throw new AbacDuplicateAttributeKeyError();
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
			throw new AbacAttributeNotFoundError();
		}

		if (update.values && !update.values.length) {
			throw new AbacInvalidAttributeValuesError();
		}

		const newKey = update.key ?? existing.key;
		const newValues = update.values ?? existing.values;

		const removedValues = existing.values.filter((v) => !newValues.includes(v));
		const keyChanged = newKey !== existing.key;

		const valuesToCheck = keyChanged ? existing.values : removedValues;

		if (keyChanged || valuesToCheck.length) {
			const inUse = await Rooms.isAbacAttributeInUse(existing.key, valuesToCheck.length ? valuesToCheck : existing.values);
			if (inUse) {
				throw new AbacAttributeInUseError();
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
				throw new AbacDuplicateAttributeKeyError();
			}
			throw e;
		}
	}

	async deleteAbacAttributeById(_id: string, actor: AbacActor): Promise<void> {
		const existing = await AbacAttributes.findOneById(_id, { projection: { key: 1, values: 1 } });
		if (!existing) {
			throw new AbacAttributeNotFoundError();
		}

		const inUse = await Rooms.isAbacAttributeInUse(existing.key, existing.values);
		if (inUse) {
			throw new AbacAttributeInUseError();
		}

		await AbacAttributes.removeById(_id);
		void Audit.attributeDeleted(existing, actor);
	}

	async getAbacAttributeById(_id: string, _actor: AbacActor | undefined): Promise<{ key: string; values: string[] }> {
		const attribute = await AbacAttributes.findOneById(_id, { projection: { key: 1, values: 1 } });
		if (!attribute) {
			throw new AbacAttributeNotFoundError();
		}

		return {
			key: attribute.key,
			values: attribute.values || [],
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
		const room = await getAbacRoom(rid);

		if (!Object.keys(attributes).length && room.abacAttributes?.length) {
			await Rooms.unsetAbacAttributesById(rid);
			void Audit.objectAttributesRemoved({ _id: room._id, name: room.name }, room.abacAttributes, actor);
			return;
		}

		const normalized = validateAndNormalizeAttributes(attributes);

		await ensureAttributeDefinitionsExist(normalized);

		const updated = await Rooms.setAbacAttributesById(rid, normalized);
		void Audit.objectAttributeChanged({ _id: room._id, name: room.name }, room.abacAttributes || [], normalized, 'updated', actor);

		const previous: IAbacAttributeDefinition[] = room.abacAttributes || [];
		if (diffAttributeSets(previous, normalized).added) {
			await this.onRoomAttributesChanged(room, (updated?.abacAttributes as IAbacAttributeDefinition[] | undefined) ?? normalized);
		}
	}

	async updateRoomAbacAttributeValues(rid: string, key: string, values: string[], actor: AbacActor): Promise<void> {
		const room = await getAbacRoom(rid);

		const previous: IAbacAttributeDefinition[] = room.abacAttributes || [];

		const existingIndex = previous.findIndex((a) => a.key === key);
		const isNewKey = existingIndex === -1;
		if (isNewKey && previous.length >= MAX_ABAC_ATTRIBUTE_KEYS) {
			throw new AbacInvalidAttributeValuesError();
		}

		await ensureAttributeDefinitionsExist([{ key, values }]);

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

		if (diffAttributeSets([previous[existingIndex]], [{ key, values }]).added) {
			const next = previous.map((a, i) => (i === existingIndex ? { key, values } : a));
			await this.onRoomAttributesChanged(room, next);
		}
	}

	async removeRoomAbacAttribute(rid: string, key: string, actor: AbacActor): Promise<void> {
		const room = await getAbacRoom(rid);

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
		await ensureAttributeDefinitionsExist([{ key, values }]);

		const room = await getAbacRoom(rid);

		const previous: IAbacAttributeDefinition[] = room.abacAttributes || [];
		if (previous.some((a) => a.key === key)) {
			throw new AbacDuplicateAttributeKeyError();
		}

		if (previous.length >= MAX_ABAC_ATTRIBUTE_KEYS) {
			throw new AbacInvalidAttributeValuesError();
		}

		const updated = await Rooms.insertAbacAttributeIfNotExistsById(rid, key, values);
		const next = updated?.abacAttributes || [...previous, { key, values }];

		void Audit.objectAttributeChanged({ _id: room._id, name: room.name }, previous, next, 'key-added', actor);

		await this.onRoomAttributesChanged(room, next);
	}

	async replaceRoomAbacAttributeByKey(rid: string, key: string, values: string[], actor: AbacActor): Promise<void> {
		await ensureAttributeDefinitionsExist([{ key, values }]);

		const room = await getAbacRoom(rid);

		const exists = room?.abacAttributes?.find((a) => a.key === key);

		if (exists) {
			const updated = await Rooms.updateAbacAttributeValuesArrayFilteredById(rid, key, values);

			void Audit.objectAttributeChanged(
				{ _id: room._id, name: room.name },
				room.abacAttributes || [],
				updated?.abacAttributes || [],
				'key-updated',
				actor,
			);
			if (diffAttributeSets([exists], [{ key, values }]).added) {
				await this.onRoomAttributesChanged(room, updated?.abacAttributes || []);
			}

			return;
		}

		if (room?.abacAttributes?.length === MAX_ABAC_ATTRIBUTE_KEYS) {
			throw new AbacInvalidAttributeValuesError();
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

	async checkUsernamesMatchAttributes(usernames: string[], attributes: IAbacAttributeDefinition[], object: IRoom): Promise<void> {
		if (!usernames.length || !attributes.length) {
			return;
		}

		const nonCompliantUsersFromList = await Users.find(
			{
				username: { $in: usernames },
				$or: buildNonCompliantConditions(attributes),
			},
			{ projection: { username: 1 } },
		)
			.map((u) => u.username as string)
			.toArray();

		const nonCompliantSet = new Set<string>(nonCompliantUsersFromList);

		if (nonCompliantSet.size) {
			throw new OnlyCompliantCanBeAddedToRoomError();
		}

		usernames.forEach((username) => {
			// TODO: Add room name
			void Audit.actionPerformed({ username }, { _id: object._id, name: object.name }, 'system', 'granted-object-access');
		});
	}

	private shouldUseCache(decisionCacheTimeout: number, userSub: ISubscription) {
		// Cases:
		// 1) Never checked before -> check now
		// 2) Checked before, but cache expired -> check now
		// 3) Checked before, and cache valid -> use cached decision (subsciprtion exists)
		// 4) Cache disabled (0) -> always check
		return (
			decisionCacheTimeout > 0 &&
			userSub.abacLastTimeChecked &&
			Date.now() - userSub.abacLastTimeChecked.getTime() < decisionCacheTimeout * 1000
		);
	}

	async canAccessObject(
		room: Pick<IRoom, '_id' | 't' | 'teamId' | 'prid' | 'abacAttributes'>,
		user: Pick<IUser, '_id'>,
		action: AbacAccessOperation,
		objectType: AbacObjectType,
	) {
		// We may need this flex for phase 2, but for now only ROOM/READ is supported
		if (objectType !== AbacObjectType.ROOM) {
			throw new AbacUnsupportedObjectTypeError();
		}

		if (action !== AbacAccessOperation.READ) {
			throw new AbacUnsupportedOperationError();
		}

		if (!user?._id || !room?.abacAttributes?.length) {
			return false;
		}

		const decisionCacheTimeout = (await Settings.getValueById('Abac_Cache_Decision_Time_Seconds')) as number;
		const userSub = await Subscriptions.findOneByRoomIdAndUserId(room._id, user._id, { projection: { abacLastTimeChecked: 1 } });
		if (!userSub) {
			return false;
		}

		if (this.shouldUseCache(decisionCacheTimeout, userSub)) {
			this.logger.debug({ msg: 'Using cached ABAC decision', userId: user._id, roomId: room._id });
			return !!userSub;
		}

		const isUserCompliant = await Users.findOne(
			{
				_id: user._id,
				$and: buildCompliantConditions(room.abacAttributes),
			},
			{ projection: { _id: 1 } },
		);

		if (!isUserCompliant) {
			const fullUser = await Users.findOneById(user._id);
			if (!fullUser) {
				return false;
			}

			// When a user is not compliant, remove them from the room automatically
			await this.removeUserFromRoom(room, fullUser, 'realtime-policy-eval');

			return false;
		}

		// Set last time the decision was made
		await Subscriptions.setAbacLastTimeCheckedByUserIdAndRoomId(user._id, room._id, new Date());
		return true;
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
			const query = {
				__rooms: rid,
				$or: buildNonCompliantConditions(newAttributes),
			};

			const cursor = Users.find(query, { projection: { __rooms: 0 } });

			const usersToRemove: string[] = [];
			const userRemovalPromises = [];
			for await (const doc of cursor) {
				usersToRemove.push(doc._id);
				userRemovalPromises.push(limit(() => this.removeUserFromRoom(room, doc, 'room-attributes-change')));
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

	private async removeUserFromRoom(room: AtLeast<IRoom, '_id'>, user: IUser, reason: AbacAuditReason): Promise<void> {
		return Room.removeUserFromRoom(room._id, user, {
			skipAppPreEvents: true,
			customSystemMessage: 'abac-removed-user-from-room' as const,
		})
			.then(() => void Audit.actionPerformed({ _id: user._id, username: user.username }, { _id: room._id, name: room.name }, reason))
			.catch((err) => {
				this.logger.error({
					msg: 'Failed to remove user from ABAC room',
					rid: room._id,
					err,
					reason,
				});
			});
	}

	private async removeUserFromRoomList(roomList: FindCursor<IRoom>, user: IUser, reason: AbacAuditReason): Promise<void> {
		const removalPromises: Promise<void>[] = [];
		for await (const room of roomList) {
			removalPromises.push(limit(() => this.removeUserFromRoom(room, user, reason)));
		}

		await Promise.all(removalPromises);
	}

	protected async onSubjectAttributesChanged(user: IUser, _next: IAbacAttributeDefinition[]): Promise<void> {
		if (!user?._id || !Array.isArray(user.__rooms) || !user.__rooms.length) {
			return;
		}
		const roomIds = user.__rooms;

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

				return await this.removeUserFromRoomList(cursor, user, 'ldap-sync');
			}

			const query = {
				_id: { $in: roomIds },
				$or: buildRoomNonCompliantConditionsFromSubject(_next),
			};

			const cursor = Rooms.find(query, { projection: { _id: 1 } });

			return await this.removeUserFromRoomList(cursor, user, 'ldap-sync');
		} catch (err) {
			this.logger.error({
				msg: 'Failed to query and remove user from non-compliant ABAC rooms',
				err,
			});
		}
	}
}

export default AbacService;
