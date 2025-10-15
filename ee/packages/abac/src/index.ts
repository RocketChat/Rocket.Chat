import { Room, ServiceClass } from '@rocket.chat/core-services';
import type { IAbacService } from '@rocket.chat/core-services';
import type { IAbacAttribute, IAbacAttributeDefinition, IRoom, AtLeast } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { Rooms, AbacAttributes, Users } from '@rocket.chat/models';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { Document, UpdateFilter } from 'mongodb';
import pLimit from 'p-limit';

// Limit concurrent user removals to avoid overloading the server with too many operations at once
const limit = pLimit(20);

export class AbacService extends ServiceClass implements IAbacService {
	protected name = 'abac';

	protected logger: Logger;

	constructor() {
		super();
		this.logger = new Logger('AbacService');
	}

	async addAbacAttribute(attribute: IAbacAttributeDefinition): Promise<void> {
		if (!attribute.values.length) {
			throw new Error('error-invalid-attribute-values');
		}

		try {
			await AbacAttributes.insertOne(attribute);
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

	async updateAbacAttributeById(_id: string, update: { key?: string; values?: string[] }): Promise<void> {
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
			this.logger.debug({
				msg: 'Abac attribute updated',
				...update,
			});
		} catch (e) {
			if (e instanceof Error && e.message.includes('E11000')) {
				throw new Error('error-duplicate-attribute-key');
			}
			throw e;
		}
	}

	async deleteAbacAttributeById(_id: string): Promise<void> {
		const existing = await AbacAttributes.findOneById(_id, { projection: { key: 1, values: 1 } });
		if (!existing) {
			throw new Error('error-attribute-not-found');
		}

		const inUse = await Rooms.isAbacAttributeInUse(existing.key, existing.values);
		if (inUse) {
			throw new Error('error-attribute-in-use');
		}

		await AbacAttributes.removeById(_id);
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

	async setRoomAbacAttributes(rid: string, attributes: Record<string, string[]>): Promise<void> {
		const room = await Rooms.findOneByIdAndType<Pick<IRoom, '_id' | 'abacAttributes' | 't' | 'teamMain'>>(rid, 'p', {
			projection: { abacAttributes: 1, t: 1, teamMain: 1 },
		});
		if (!room) {
			throw new Error('error-room-not-found');
		}

		const normalized = this.validateAndNormalizeAttributes(attributes);

		await this.ensureAttributeDefinitionsExist(normalized);

		const updated = await Rooms.setAbacAttributesById(rid, normalized);

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

	async updateRoomAbacAttributeValues(rid: string, key: string, values: string[]): Promise<void> {
		const room = await Rooms.findOneByIdAndType<Pick<IRoom, '_id' | 'abacAttributes' | 't' | 'teamMain'>>(rid, 'p', {
			projection: { abacAttributes: 1, t: 1, teamMain: 1 },
		});
		if (!room) {
			throw new Error('error-room-not-found');
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
			const next = [...previous, { key, values }];

			await this.onRoomAttributesChanged(room, next);
			return;
		}

		const prevValues = previous[existingIndex].values;

		if (prevValues.length === values.length && prevValues.every((v, i) => v === values[i])) {
			return;
		}

		await Rooms.updateAbacAttributeValuesArrayFilteredById(rid, key, values);

		if (this.wereAttributeValuesAdded(prevValues, values)) {
			const next = previous.map((a, i) => (i === existingIndex ? { key, values } : a));
			await this.onRoomAttributesChanged(room, next);
		}
	}

	private wereAttributeValuesAdded(prevValues: string[], newValues: string[]) {
		const prevSet = new Set(prevValues);
		return newValues.some((v) => !prevSet.has(v));
	}

	async removeRoomAbacAttribute(rid: string, key: string): Promise<void> {
		const room = await Rooms.findOneByIdAndType<Pick<IRoom, '_id' | 'abacAttributes'>>(rid, 'p', { projection: { abacAttributes: 1 } });
		if (!room) {
			throw new Error('error-room-not-found');
		}

		const previous: IAbacAttributeDefinition[] = room.abacAttributes || [];
		const exists = previous.some((a) => a.key === key);
		if (!exists) {
			return;
		}

		await Rooms.removeAbacAttributeByRoomIdAndKey(rid, key);
		this.logger.debug({
			msg: 'Room ABAC attribute removed',
			rid,
			key,
		});
	}

	async addRoomAbacAttributeByKey(rid: string, key: string, values: string[]): Promise<void> {
		await this.ensureAttributeDefinitionsExist([{ key, values }]);

		const room = await Rooms.findOneByIdAndType<Pick<IRoom, '_id' | 'abacAttributes' | 't' | 'teamMain'>>(rid, 'p', {
			projection: { abacAttributes: 1, t: 1, teamMain: 1 },
		});
		if (!room) {
			throw new Error('error-room-not-found');
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

		await this.onRoomAttributesChanged(room, next);
	}

	async replaceRoomAbacAttributeByKey(rid: string, key: string, values: string[]): Promise<void> {
		await this.ensureAttributeDefinitionsExist([{ key, values }]);

		const room = await Rooms.findOneByIdAndType<Pick<IRoom, '_id' | 'abacAttributes' | 't' | 'teamMain'>>(rid, 'p', {
			projection: { abacAttributes: 1, t: 1, teamMain: 1 },
		});
		if (!room) {
			throw new Error('error-room-not-found');
		}

		const exists = room?.abacAttributes?.some((a) => a.key === key);

		if (exists) {
			const updated = await Rooms.updateAbacAttributeValuesArrayFilteredById(rid, key, values);
			const prevValues = room.abacAttributes?.find((a) => a.key === key)?.values ?? [];

			if (this.wereAttributeValuesAdded(prevValues, values)) {
				await this.onRoomAttributesChanged(room, updated?.abacAttributes || []);
			}

			return;
		}

		if (room?.abacAttributes?.length === 10) {
			throw new Error('error-invalid-attribute-values');
		}

		const updated = await Rooms.insertAbacAttributeIfNotExistsById(rid, key, values);

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
				userRemovalPromises.push(
					limit(() =>
						Room.removeUserFromRoom(rid, doc, {
							skipAppPreEvents: true,
							customSystemMessage: 'abac-removed-user-from-room' as const,
						}),
					),
				);
			}

			this.logger.debug({
				msg: 'Room ABAC attributes changed',
				rid,
				newAttributes,
				usersToRemove,
			});

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
}

export default AbacService;
