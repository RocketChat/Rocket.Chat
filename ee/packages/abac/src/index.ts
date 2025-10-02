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
	 *
	 * @param filters optional filtering and pagination parameters
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

		// If key changed, all old values are considered removed under the old key context
		const valuesToCheck = keyChanged ? existing.values : removedValues;

		if (keyChanged || valuesToCheck.length) {
			// Delegate usage detection to model helper to avoid duplicating query logic
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
		// Fetch the attribute definition by key to obtain its values
		const attribute = await AbacAttributes.findOne({ key }, { projection: { values: 1 } });
		if (!attribute) {
			// If it doesn't exist, it cannot be in use
			return false;
		}
		// If any of its values is in use in any room, the attribute is considered in use
		return Rooms.isAbacAttributeInUse(key, attribute.values || []);
	}
}

export default AbacService;
