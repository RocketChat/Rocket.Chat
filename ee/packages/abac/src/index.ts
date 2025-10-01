import { ServiceClass } from '@rocket.chat/core-services';
import type { IAbacService } from '@rocket.chat/core-services';
import type { IAbacAttribute, IAbacAttributeDefinition } from '@rocket.chat/core-typings';
import { Rooms, AbacAttributes } from '@rocket.chat/models';
import { Filter } from 'mongodb';

export class AbacService extends ServiceClass implements IAbacService {
	protected name = 'abac';

	/**
	 * Toggles the ABAC flag for a private room.
	 * Only rooms of type 'p' (private channels or teams) are currently eligible.
	 *
	 * @param rid Room ID
	 * @throws Error('error-invalid-room') if the room does not exist or is not a private room
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
	 * @throws Error('error-invalid-room') if the room does not exist or is not private
	 * @throws Error('error-invalid-attribute-key') if key fails validation
	 * @throws Error('error-invalid-attribute-values') if values list is empty after normalization
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
}

export default AbacService;
