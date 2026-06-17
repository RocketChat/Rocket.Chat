import type { AbacActor } from '@rocket.chat/core-services';
import type { IAbacAttributeDefinition, IRoom, IRoomAbacRedaction } from '@rocket.chat/core-typings';
import { AbacAttributes } from '@rocket.chat/models';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { Document } from 'mongodb';

import { ensureAttributeDefinitionsExist } from '../helper';
import type { AttributeEntitlements, IAttributeStore, ListAttributesOptions, ListAttributesResult } from './types';

export class LocalAttributeStore implements IAttributeStore {
	async list(_actor: AbacActor | undefined, opts?: ListAttributesOptions): Promise<ListAttributesResult> {
		const offset = opts?.offset ?? 0;
		const limit = opts?.count ?? 25;

		const clauses: Document[] = [];
		if (opts?.key) {
			clauses.push({ key: new RegExp(escapeRegExp(opts.key), 'i') });
		}
		if (opts?.values?.length) {
			clauses.push({ values: new RegExp(escapeRegExp(opts.values), 'i') });
		}

		const { cursor, totalCount } = AbacAttributes.findPaginated(
			{ ...(clauses.length && { $or: clauses }) },
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

	async validateAssignable(attrs: IAbacAttributeDefinition[], _actor: AbacActor): Promise<void> {
		await ensureAttributeDefinitionsExist(attrs);
	}

	async entitlementsOf(_actor: AbacActor): Promise<AttributeEntitlements> {
		return new Map();
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
