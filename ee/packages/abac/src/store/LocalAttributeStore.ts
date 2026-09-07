import type { AbacActor } from '@rocket.chat/core-services';
import type { IAbacAttributeDefinition, IRoom, IRoomAbacRedaction } from '@rocket.chat/core-typings';
import { AbacAttributes, Users } from '@rocket.chat/models';
import { escapeRegExp } from '@rocket.chat/tools';
import type { Document } from 'mongodb';

import { ensureAttributeDefinitionsExist } from '../helper';
import type { AttributeEntitlements, IAttributeStore, ListAttributesOptions, ListAttributesResult } from './types';

export class LocalAttributeStore implements IAttributeStore {
	/**
	 * With `restrictToOwned` the result is narrowed to what this actor actually holds — the keys
	 * they carry, and within each key only their own values. The Virtru store answers from the
	 * subject's entitlements to begin with, so this is what gives the local store the same
	 * behaviour instead of offering a picker full of attributes the PDP will refuse (ABAC-P4 QA).
	 */
	async list(actor: AbacActor | undefined, opts?: ListAttributesOptions): Promise<ListAttributesResult> {
		const offset = opts?.offset ?? 0;
		const limit = opts?.count ?? 25;

		const owned = opts?.restrictToOwned && actor ? await this.entitlementsOf(actor) : undefined;

		const clauses: Document[] = [];
		if (opts?.key) {
			clauses.push({ key: new RegExp(escapeRegExp(opts.key), 'i') });
		}
		if (opts?.values?.length) {
			clauses.push({ values: new RegExp(escapeRegExp(opts.values), 'i') });
		}

		const { cursor, totalCount } = AbacAttributes.findPaginated(
			{
				...(clauses.length && { $or: clauses }),
				// Narrowing in the query rather than after the fact keeps `total` and the paging
				// honest for the caller.
				...(owned && { key: { $in: [...owned.keys()] } }),
			},
			{
				projection: { key: 1, values: 1 },
				skip: offset,
				limit,
			},
		);
		const attributes = await cursor.toArray();

		if (!owned) {
			return {
				attributes,
				offset,
				count: attributes.length,
				total: await totalCount,
			};
		}

		// A definition can be edited to drop a value someone still carries, which leaves them
		// holding a key with nothing selectable under it; those are dropped from the page rather
		// than offered as an empty picker.
		const narrowed = attributes
			.map((attribute) => ({ ...attribute, values: attribute.values.filter((value) => owned.get(attribute.key)?.has(value)) }))
			.filter((attribute) => attribute.values.length > 0);

		return {
			attributes: narrowed,
			offset,
			count: narrowed.length,
			total: await totalCount,
		};
	}

	async validateAssignable(attrs: IAbacAttributeDefinition[], _actor: AbacActor): Promise<void> {
		await ensureAttributeDefinitionsExist(attrs);
	}

	/**
	 * For the local PDP a subject's entitlements are simply the attributes on their own user
	 * document, synced from LDAP. Previously this returned an empty map, which made the
	 * "assign only attributes you possess" policy (ABAC-P4/D12) unenforceable for this store.
	 */
	async entitlementsOf(actor: AbacActor): Promise<AttributeEntitlements> {
		const user = await Users.findOneById(actor._id, { projection: { abacAttributes: 1 } });

		return new Map((user?.abacAttributes ?? []).map(({ key, values }) => [key, new Set(values)]));
	}

	async scopeRoomsPage<T extends Pick<IRoom, '_id' | 'abacAttributes'>>(
		rooms: T[],
		_actor: AbacActor,
	): Promise<Array<T & IRoomAbacRedaction>> {
		return rooms;
	}

	async assertCanModifyRoom(_room: Pick<IRoom, '_id' | 'abacAttributes'>, _actor: AbacActor): Promise<void> {
		// nop
	}
}
