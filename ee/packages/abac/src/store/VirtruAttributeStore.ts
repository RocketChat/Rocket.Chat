import type { AbacActor } from '@rocket.chat/core-services';
import type { IAbacAttributeDefinition, IRoom } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import mem from 'mem';

import { AbacEntityResolutionFailedError, AbacInvalidAttributeValuesError, PdpUnavailableError } from '../errors';
import type { AttributeEntitlements, IAttributeStore } from './types';
import type { IGetEntitlementsResponse } from '../pdp/types';
import type { VirtruClient } from '../virtru/VirtruClient';
import { buildEntityIdentifier, getUserEntityKey, parseAttributeFqns } from '../virtru/identity';

const ENTITLEMENTS_CACHE_MS = 15_000;

export class VirtruAttributeStore implements IAttributeStore {
	private client: VirtruClient;

	private _entitlementsForEntity: (entityId: string) => Promise<IAbacAttributeDefinition[]>;

	constructor(client: VirtruClient) {
		this.client = client;
		this._entitlementsForEntity = mem(
			(entityId: string) => {
				const p = this.fetchEntitlements(entityId);
				p.catch(() => {
					mem.clear(this._entitlementsForEntity);
				});
				return p;
			},
			{ maxAge: ENTITLEMENTS_CACHE_MS, cacheKey: (args: [string]) => args[0] },
		);
	}

	private async resolveEntityId(actor: AbacActor): Promise<string> {
		const { defaultEntityKey } = this.client.getConfig();
		const fullUser = await Users.findOneById(actor._id, { projection: { _id: 1, emails: 1, username: 1 } });
		const entityKey = fullUser && getUserEntityKey(defaultEntityKey, fullUser);
		if (!entityKey) {
			throw new AbacEntityResolutionFailedError();
		}
		return entityKey;
	}

	private async fetchEntitlements(entityId: string): Promise<IAbacAttributeDefinition[]> {
		if (!(await this.client.isAvailable())) {
			throw new PdpUnavailableError();
		}
		const { defaultEntityKey } = this.client.getConfig();
		const res = await this.client.apiCall<IGetEntitlementsResponse>('/authorization.v2.AuthorizationService/GetEntitlements', {
			entityIdentifier: buildEntityIdentifier(defaultEntityKey, entityId),
			withComprehensiveHierarchy: true,
		});
		return parseAttributeFqns(Object.keys(res.entitlements?.[0]?.actionsPerAttributeValueFqn ?? {}));
	}

	private async getEntitlements(actor: AbacActor): Promise<IAbacAttributeDefinition[]> {
		const entityId = await this.resolveEntityId(actor);
		return this._entitlementsForEntity(entityId);
	}

	async list(
		actor: AbacActor,
		opts?: { filter?: string; offset?: number; count?: number },
	): Promise<{ attributes: IAbacAttributeDefinition[]; total: number }> {
		let attributes = await this.getEntitlements(actor);
		const filter = opts?.filter?.trim().toLowerCase();
		if (filter) {
			attributes = attributes
				.map((a) => ({ key: a.key, values: a.values.filter((v) => v.toLowerCase().includes(filter)) }))
				.filter((a) => a.key.toLowerCase().includes(filter) || a.values.length > 0);
		}
		const total = attributes.length;
		const offset = opts?.offset ?? 0;
		const count = opts?.count ?? total;
		return { attributes: attributes.slice(offset, offset + count), total };
	}

	async entitlementsOf(actor: AbacActor): Promise<AttributeEntitlements> {
		const defs = await this.getEntitlements(actor);
		return new Map(defs.map((d) => [d.key, new Set(d.values)]));
	}

	async validateAssignable(attrs: IAbacAttributeDefinition[], actor: AbacActor): Promise<void> {
		const owned = await this.entitlementsOf(actor);
		for (const a of attrs) {
			const allowed = owned.get(a.key);
			if (!allowed) {
				throw new AbacInvalidAttributeValuesError();
			}
			for (const v of a.values) {
				if (!allowed.has(v)) {
					throw new AbacInvalidAttributeValuesError();
				}
			}
		}
	}

	async scopeRoomsPage<T extends Pick<IRoom, '_id' | 'abacAttributes'>>(
		_rooms: T[],
		_actor: AbacActor,
	): Promise<Array<T & { abacAttributesRedacted?: boolean }>> {
		throw new Error('not implemented - Task 2.1');
	}

	async assertCanModifyRoom(_room: Pick<IRoom, '_id' | 'abacAttributes'>, _actor: AbacActor): Promise<void> {
		throw new Error('not implemented - Task 2.1');
	}
}
