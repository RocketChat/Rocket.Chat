import { ServiceClass } from '@rocket.chat/core-services';
import type { IAbacService } from '@rocket.chat/core-services';
import type { IAbacAttribute, IAbacAttributeDefinition } from '@rocket.chat/core-typings';
import { Rooms, AbacAttributes } from '@rocket.chat/models';
import type { Filter, UpdateFilter } from 'mongodb';

export class AbacService extends ServiceClass implements IAbacService {
	protected name = 'abac';

	/**
	 * Toggles the ABAC flag for a private room.
	 * Only rooms of type 'p' (private channels or teams) are currently eligible.
	 * For now, this doenst remove the attributes associated with the room
	 *
	 * @param rid Room ID
	 */
	async toggleAbacConfigurationForRoom(rid: string): Promise<void> {
		const room = await Rooms.findOneByIdAndType(rid, 'p', { projection: { abac: 1 } });

		if (!room) {
			throw new Error('error-invalid-room');
		}

		await Rooms.updateAbacConfigurationById(rid, !room.abac);
	}

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
	 *
	 * Validation & behavior:
	 *  - Attribute must exist
	 *  - key (if provided) must match /^[A-Za-z0-9_-]+$/
	 *  - values (if provided) must be a non-empty array
	 *  - Duplicate key conflict surfaces as error-duplicate-attribute-key
	 *  - If the key changes OR any existing value is removed, verify none of the removed identity (old key + removed values)
	 *    is currently in use by any room.
	 *
	 *
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
			const inUse = await Rooms.findOne(
				{
					abacAttributes: {
						$elemMatch: {
							key: existing.key,
							values: { $in: valuesToCheck.length ? valuesToCheck : existing.values },
						},
					},
				},
				{ projection: { _id: 1 } },
			);

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
}

export default AbacService;
