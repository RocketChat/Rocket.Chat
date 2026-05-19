import type { AbacActor } from '@rocket.chat/core-services';
import type { IAbacAttributeDefinition, IRoom } from '@rocket.chat/core-typings';
import { AbacAttributes } from '@rocket.chat/models';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { ensureAttributeDefinitionsExist } from '../helper';
import type { AttributeEntitlements, IAttributeStore } from './types';

export class LocalAttributeStore implements IAttributeStore {
	async list(
		_actor: AbacActor,
		opts?: { filter?: string; offset?: number; count?: number },
	): Promise<{ attributes: IAbacAttributeDefinition[]; total: number }> {
		const offset = opts?.offset ?? 0;
		const limit = opts?.count ?? 25;
		const query = opts?.filter?.trim().length ? { key: new RegExp(escapeRegExp(opts.filter.trim()), 'i') } : {};
		const { cursor, totalCount } = AbacAttributes.findPaginated(query, {
			projection: { key: 1, values: 1 },
			skip: offset,
			limit,
		});
		const attributes = (await cursor.toArray()).map(({ key, values }) => ({ key, values }));
		return { attributes, total: await totalCount };
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
	): Promise<Array<T & { abacAttributesRedacted?: boolean }>> {
		return rooms;
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	async assertCanModifyRoom(_room: Pick<IRoom, '_id' | 'abacAttributes'>, _actor: AbacActor): Promise<void> {}
}
