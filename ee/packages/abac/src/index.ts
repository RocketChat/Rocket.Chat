import { ServiceClass } from '@rocket.chat/core-services';
import type { IAbacService } from '@rocket.chat/core-services';
import type { IAbacAttribute, IAbacAttributeDefinition } from '@rocket.chat/core-typings';
import { Rooms, AbacAttributes } from '@rocket.chat/models';
import type { Filter, UpdateFilter } from 'mongodb';

export class AbacService extends ServiceClass implements IAbacService {
	protected name = 'abac';

	/**
	 * Adds a new ABAC attribute definition entry for a given private room.
	 *
	 * @param rid Room ID
	 * @param attribute Attribute definition payload
	 *
	 */
	async addAbacAttribute(attribute: IAbacAttributeDefinition): Promise<void> {
		const keyPattern = /^[A-Za-z0-9_-]+$/;
		if (!keyPattern.test(attribute.key)) {
			throw new Error('error-invalid-attribute-key');
		}

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

	/**
	 * Lists ABAC attribute definitions with optional filtering and pagination.
	 */
	async listAbacAttributes(filters?: { key?: string; values?: string[]; offset?: number; count?: number }): Promise<{
		attributes: IAbacAttribute[];
		offset: number;
		count: number;
		total: number;
	}> {
		const query: Filter<IAbacAttribute> = {};
		if (filters?.key) {
			query.key = filters.key;
		}
		if (filters?.values?.length) {
			query.values = { $in: filters.values };
		}

		const offset = filters?.offset ?? 0;
		const limit = filters?.count ?? 25;

		const { cursor, totalCount } = AbacAttributes.findPaginated(query, {
			projection: { key: 1, values: 1 },
			skip: offset,
			limit,
		});

		const attributes = await cursor.toArray();

		return {
			attributes,
			offset,
			count: attributes.length,
			total: await totalCount,
		};
	}

	/**
	 * Updates an ABAC attribute definition by its _id.
	 */
	async updateAbacAttributeById(_id: string, update: { key?: string; values?: string[] }): Promise<void> {
		if (!update.key && !update.values) {
			return;
		}

		const existing = await AbacAttributes.findOne({ _id }, { projection: { key: 1, values: 1 } });
		if (!existing) {
			throw new Error('error-attribute-not-found');
		}

		const keyPattern = /^[A-Za-z0-9_-]+$/;
		if (update.key && !keyPattern.test(update.key)) {
			throw new Error('error-invalid-attribute-key');
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
		} catch (e) {
			if (e instanceof Error && e.message.includes('E11000')) {
				throw new Error('error-duplicate-attribute-key');
			}
			throw e;
		}
	}

	/**
	 * Deletes an ABAC attribute definition by its _id.
	 */
	async deleteAbacAttributeById(_id: string): Promise<void> {
		const existing = await AbacAttributes.findOne({ _id }, { projection: { key: 1, values: 1 } });
		if (!existing) {
			throw new Error('error-attribute-not-found');
		}

		const inUse = await Rooms.isAbacAttributeInUse(existing.key, existing.values);
		if (inUse) {
			throw new Error('error-attribute-in-use');
		}

		await AbacAttributes.deleteOne({ _id });
	}

	async getAbacAttributeById(_id: string): Promise<{ key: string; values: string[]; usage: Record<string, boolean> }> {
		const attribute = await AbacAttributes.findOne({ _id }, { projection: { key: 1, values: 1 } });
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
		const attribute = await AbacAttributes.findOne({ key }, { projection: { values: 1 } });
		if (!attribute) {
			return false;
		}
		return Rooms.isAbacAttributeInUse(key, attribute.values || []);
	}

	/**
	 * Sets ABAC attributes for a private room.
	 * This method now delegates to smaller private helpers for readability and testability.
	 */
	async setRoomAbacAttributes(rid: string, attributes: Record<string, string[]>): Promise<void> {
		const room = await this.getPrivateRoomOrThrow(rid);

		const normalized = this.validateAndNormalizeAttributes(attributes);

		await this.ensureAttributeDefinitionsExist(normalized);

		const previous: IAbacAttributeDefinition[] = room.abacAttributes || [];
		const removed = this.computeAttributesRemoval(previous, normalized);

		if (removed) {
			await this.onRoomAttributesChanged(rid, normalized);
		}

		await Rooms.setAbacAttributesById(rid, normalized);
	}

	/**
	 * Fetches a private room by id or throws if not found.
	 */
	private async getPrivateRoomOrThrow(rid: string): Promise<{ abacAttributes?: IAbacAttributeDefinition[] }> {
		const room = await Rooms.findOneByIdAndType(rid, 'p', { projection: { abacAttributes: 1 } });
		if (!room) {
			throw new Error('error-room-not-found');
		}
		return room;
	}

	/**
	 * Validates provided raw attributes object and normalizes it into a list
	 * of attribute definitions while deduplicating values.
	 */
	private validateAndNormalizeAttributes(attributes: Record<string, string[]>): IAbacAttributeDefinition[] {
		const keyPattern = /^[A-Za-z0-9_-]+$/;
		const normalized: IAbacAttributeDefinition[] = [];

		for (const [key, values] of Object.entries(attributes)) {
			if (!keyPattern.test(key)) {
				throw new Error('error-invalid-attribute-key');
			}
			if (!values?.length) {
				throw new Error('error-invalid-attribute-values');
			}
			const uniqueValues = Array.from(new Set(values));
			normalized.push({ key, values: uniqueValues });
		}

		return normalized;
	}

	/**
	 * Ensures all attribute definitions exist in the global registry and that every
	 * provided value is allowed for its corresponding key.
	 */
	private async ensureAttributeDefinitionsExist(normalized: IAbacAttributeDefinition[]): Promise<void> {
		if (!normalized.length) {
			return;
		}

		const keys = normalized.map((a) => a.key);
		const attributeDefinitionsCursor = AbacAttributes.find({ key: { $in: keys } }, { projection: { key: 1, values: 1 } });
		const attributeDefinitions = await attributeDefinitionsCursor.toArray();

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

	/**
	 * Compares previous vs new attributes and returns true if any attribute key
	 * or individual attribute value has been removed.
	 */
	private computeAttributesRemoval(previous: IAbacAttributeDefinition[], next: IAbacAttributeDefinition[]): boolean {
		const newMap = new Map<string, Set<string>>(next.map((a) => [a.key, new Set(a.values)]));

		for (const prev of previous) {
			const current = newMap.get(prev.key);
			if (!current) {
				return true;
			}
			for (const val of prev.values) {
				if (!current.has(val)) {
					return true;
				}
			}
		}

		return false;
	}

	protected async onRoomAttributesChanged(_rid: string, _newAttributes: IAbacAttributeDefinition[]): Promise<void> {
		throw new Error('not implemented');
	}
}

export default AbacService;
