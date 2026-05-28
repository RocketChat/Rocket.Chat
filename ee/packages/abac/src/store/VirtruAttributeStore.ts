import type { AbacActor } from '@rocket.chat/core-services';
import type { IAbacAttribute, IAbacAttributeDefinition, IRoom, IRoomAbacRedaction } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import mem from 'mem';

import {
	AbacEntityResolutionFailedError,
	AbacInvalidAttributeValuesError,
	AbacNotAuthorizedToModifyRoomError,
	PdpUnavailableError,
} from '../errors';
import { logger } from '../logger';
import type { AttributeEntitlements, IAttributeStore, ListAttributesOptions, ListAttributesResult } from './types';
import type { VirtruClient } from '../clients/virtru/VirtruClient';
import { buildAttributeFqns, buildEntityIdentifier, getUserEntityKey, parseAttributeFqns } from '../clients/virtru/identity';
import type { IGetDecisionBulkRequest, IGetDecisionBulkResponse, IGetEntitlementsRequest, IGetEntitlementsResponse } from '../pdp/types';

const storeLogger = logger.section('VirtruAttributeStore');

const ENTITLEMENTS_CACHE_MS = 15_000;

export class VirtruAttributeStore implements IAttributeStore {
	private client: VirtruClient;

	private readonly entitlementsCache = new Map<string, { data: Promise<IAbacAttributeDefinition[]>; maxAge: number }>();

	private _entitlementsForEntity: (entityId: string) => Promise<IAbacAttributeDefinition[]>;

	constructor(client: VirtruClient) {
		this.client = client;
		this._entitlementsForEntity = mem(
			(entityId: string) => {
				const p = this.fetchEntitlements(entityId);
				p.catch(() => {
					this.entitlementsCache.delete(entityId);
				});
				return p;
			},
			{
				maxAge: ENTITLEMENTS_CACHE_MS,
				cacheKey: (args: [string]) => args[0],
				cache: this.entitlementsCache,
			},
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
		const request: IGetEntitlementsRequest = {
			entityIdentifier: {
				entityChain: {
					entities: [buildEntityIdentifier(defaultEntityKey, entityId)],
				},
			},
			withComprehensiveHierarchy: true,
		};
		const res = await this.client.apiCall<IGetEntitlementsResponse>('/authorization.v2.AuthorizationService/GetEntitlements', request);
		const { attributes, malformed } = parseAttributeFqns(Object.keys(res.entitlements?.[0]?.actionsPerAttributeValueFqn ?? {}));
		if (malformed.length) {
			storeLogger.warn({ msg: 'Virtru store: ignoring malformed attribute FQNs', malformed });
		}
		return attributes;
	}

	private async getEntitlements(actor: AbacActor): Promise<IAbacAttributeDefinition[]> {
		const entityId = await this.resolveEntityId(actor);
		return this._entitlementsForEntity(entityId);
	}

	async list(actor: AbacActor | undefined, opts?: ListAttributesOptions): Promise<ListAttributesResult> {
		if (!actor) {
			throw new AbacEntityResolutionFailedError();
		}
		let attributes = await this.getEntitlements(actor);
		const filter = (opts?.key ?? opts?.values)?.trim().toLowerCase();
		if (filter) {
			attributes = attributes
				.map((a) => ({ key: a.key, values: a.values.filter((v) => v.toLowerCase().includes(filter)) }))
				.filter((a) => a.key.toLowerCase().includes(filter) || a.values.length > 0);
		}
		const total = attributes.length;
		const offset = opts?.offset ?? 0;
		const count = opts?.count ?? total;
		const slice = attributes.slice(offset, offset + count);
		return {
			attributes: slice.map((a) => ({ _id: a.key, ...a })) as IAbacAttribute[],
			offset,
			count: slice.length,
			total,
		};
	}

	async entitlementsOf(actor: AbacActor): Promise<AttributeEntitlements> {
		const defs = await this.getEntitlements(actor);
		return new Map(defs.map((d) => [d.key, new Set(d.values)]));
	}

	onStoreSelected(): void {
		this.entitlementsCache.clear();
	}

	async validateAssignable(attrs: IAbacAttributeDefinition[], actor: AbacActor): Promise<void> {
		const owned = await this.entitlementsOf(actor);
		for (const a of attrs) {
			const allowed = owned.get(a.key);
			if (!allowed || !a.values.every((v) => allowed.has(v))) {
				throw new AbacInvalidAttributeValuesError();
			}
		}
	}

	async scopeRoomsPage<T extends Pick<IRoom, '_id' | 'abacAttributes'>>(
		rooms: T[],
		actor: AbacActor,
	): Promise<Array<T & IRoomAbacRedaction>> {
		if (!rooms.length) {
			return rooms;
		}
		const permitted = await this.decideRooms(rooms, actor).catch((err) => {
			storeLogger.warn({ msg: 'Virtru store: redacting all rooms after decision failure', err });
			return new Set<string>();
		});
		return rooms.map((r) => (permitted.has(r._id) ? r : { ...r, abacAttributes: [], abacAttributesRedacted: true }));
	}

	async assertCanModifyRoom(room: Pick<IRoom, '_id' | 'abacAttributes'>, actor: AbacActor): Promise<void> {
		if (!room.abacAttributes?.length) {
			return;
		}
		const permitted = await this.decideRooms([room], actor);
		if (!permitted.has(room._id)) {
			throw new AbacNotAuthorizedToModifyRoomError();
		}
	}

	private async decideRooms(rooms: Array<Pick<IRoom, '_id' | 'abacAttributes'>>, actor: AbacActor): Promise<Set<string>> {
		if (!(await this.client.isAvailable())) {
			throw new PdpUnavailableError();
		}
		const cfg = this.client.getConfig();
		const entityId = await this.resolveEntityId(actor);
		const requests: IGetDecisionBulkRequest[] = rooms.map((room) => ({
			entityIdentifier: {
				entityChain: {
					entities: [buildEntityIdentifier(cfg.defaultEntityKey, entityId)],
				},
			},
			action: { name: 'read' },
			resources: [
				{
					ephemeralId: room._id,
					attributeValues: { fqns: buildAttributeFqns(cfg.attributeNamespace, room.abacAttributes ?? []) },
				},
			],
		}));
		let res: IGetDecisionBulkResponse;
		try {
			res = await this.client.apiCall<IGetDecisionBulkResponse>('/authorization.v2.AuthorizationService/GetDecisionBulk', {
				decisionRequests: requests,
			});
		} catch (err) {
			throw new PdpUnavailableError();
		}
		const permitted = new Set<string>();
		for (const dr of res.decisionResponses ?? []) {
			for (const rd of dr.resourceDecisions ?? []) {
				if (rd.decision === 'DECISION_PERMIT' && rd.ephemeralResourceId) {
					permitted.add(rd.ephemeralResourceId);
				}
			}
		}
		return permitted;
	}
}
