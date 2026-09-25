import type { AbacActor } from '@rocket.chat/core-services';
import type { IAbacAttributeDefinition, IRoom, IRoomAbacRedaction, IUser } from '@rocket.chat/core-typings';
import { AbacAttributes, Users } from '@rocket.chat/models';
import { escapeRegExp } from '@rocket.chat/tools';
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

	async listAttributeKeys(_actor: AbacActor | undefined): Promise<string[]> {
		return AbacAttributes.findAllKeys();
	}

	async validateAssignable(attrs: IAbacAttributeDefinition[], _actor: AbacActor): Promise<void> {
		await ensureAttributeDefinitionsExist(attrs);
	}

	async entitlementsOf(actor: AbacActor): Promise<AttributeEntitlements> {
		const user = await Users.findOneById<Pick<IUser, 'abacAttributes'>>(actor._id, { projection: { abacAttributes: 1 } });
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
