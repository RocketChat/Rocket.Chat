import type { IAbacAttributeDefinition, IRoom, IUser, AtLeast } from '@rocket.chat/core-typings';
import { Rooms, Users } from '@rocket.chat/models';
import { serverFetch } from '@rocket.chat/server-fetch';
import { isTruthy } from '@rocket.chat/tools';
import pLimit from 'p-limit';

import { OnlyCompliantCanBeAddedToRoomError, PdpHealthCheckError } from '../errors';
import { logger } from '../logger';
import type { IPolicyDecisionPoint, IGetDecisionBulkRequest, IGetDecisionBulkResponse, IResourceDecision, ReevaluationUser } from './types';
import { HEALTH_CHECK_TIMEOUT } from '../clients/virtru/VirtruClient';
import type { VirtruClient } from '../clients/virtru/VirtruClient';
import { buildEntityIdentifier, buildAttributeFqns, getUserEntityKey } from '../clients/virtru/identity';

const pdpLogger = logger.section('VirtruPDP');

export class VirtruPDP implements IPolicyDecisionPoint {
	private client: VirtruClient;

	constructor(client: VirtruClient) {
		this.client = client;
	}

	async isAvailable(): Promise<boolean> {
		return this.client.isAvailable();
	}

	async getHealthStatus(): Promise<void> {
		await this.checkPlatformHealth();
		const token = await this.checkIdpConnectivity();
		await this.checkAuthorizedAccess(token);
		pdpLogger.info({ msg: 'Virtru PDP health check passed' });
	}

	private async checkIdpConnectivity(): Promise<string> {
		try {
			const token = await this.client.getClientTokenForHealthCheck();
			pdpLogger.info({ msg: 'Virtru PDP health check: IdP connectivity OK' });
			return token;
		} catch (err) {
			pdpLogger.warn({ msg: 'Virtru PDP health check: IdP connectivity failed', err });
			throw new PdpHealthCheckError('ABAC_PDP_Health_IdP_Failed');
		}
	}

	private async checkPlatformHealth(): Promise<void> {
		const config = this.client.getConfig();
		try {
			const response = await serverFetch(`${config.baseUrl}/healthz`, {
				method: 'GET',
				timeout: HEALTH_CHECK_TIMEOUT,
				// SECURITY: This can only be configured by users with enough privileges. It's ok to disable this check here.
				ignoreSsrfValidation: true,
			});

			if (!response.ok) {
				throw new Error(`Platform healthz returned HTTP ${response.status}`);
			}

			const data = (await response.json()) as { status?: string };
			if (data.status !== 'SERVING') {
				throw new Error(`Platform healthz status is '${data.status ?? 'unknown'}'`);
			}
			pdpLogger.info({ msg: 'Virtru PDP health check: platform OK', status: data.status });
		} catch (err) {
			pdpLogger.warn({ msg: 'Virtru PDP health check: platform failed', err });
			throw new PdpHealthCheckError('ABAC_PDP_Health_Platform_Failed');
		}
	}

	private async checkAuthorizedAccess(token: string): Promise<void> {
		const config = this.client.getConfig();
		try {
			const response = await serverFetch(`${config.baseUrl}/authorization.v2.AuthorizationService/GetEntitlements`, {
				method: 'POST',
				timeout: HEALTH_CHECK_TIMEOUT,
				headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
				body: JSON.stringify({
					entityIdentifier: { entityChain: { entities: [{ id: 'health-check', clientId: config.clientId }] } },
				}),
				// SECURITY: This can only be configured by users with enough privileges. It's ok to disable this check here.
				ignoreSsrfValidation: true,
			});

			if (!response.ok) {
				throw new Error(`Authorization endpoint returned HTTP ${response.status}`);
			}
			pdpLogger.info({ msg: 'Virtru PDP health check: authorization OK' });
		} catch (err) {
			pdpLogger.warn({ msg: 'Virtru PDP health check: authorization failed', err });
			throw new PdpHealthCheckError('ABAC_PDP_Health_Authorization_Failed');
		}
	}

	private async getDecisionBulk(
		requests: Array<IGetDecisionBulkRequest | null>,
	): Promise<Array<{ resourceDecisions?: IResourceDecision[] } | undefined>> {
		const BATCH_SIZE = 200;
		const limit = pLimit(4);

		const batches: Array<(IGetDecisionBulkRequest | null)[]> = [];
		for (let i = 0; i < requests.length; i += BATCH_SIZE) {
			batches.push(requests.slice(i, i + BATCH_SIZE));
		}

		const batchResults = await Promise.all(
			batches.map((batch, batchIndex) =>
				limit(async (): Promise<Array<{ resourceDecisions?: IResourceDecision[] } | undefined>> => {
					const validBatch = batch.filter(Boolean);

					if (!validBatch.length) {
						return batch.map(() => undefined);
					}

					const result = await this.client.apiCall<IGetDecisionBulkResponse>('/authorization.v2.AuthorizationService/GetDecisionBulk', {
						decisionRequests: validBatch,
					});

					pdpLogger.debug({ msg: 'GetDecisionBulk response', batch: batchIndex + 1, result });

					const responses = result.decisionResponses ?? [];
					let responseIdx = 0;
					return batch.map((req) => (req ? responses[responseIdx++] : undefined));
				}),
			),
		);

		return batchResults.flat();
	}

	async canAccessObject(
		room: AtLeast<IRoom, '_id' | 'abacAttributes'>,
		user: AtLeast<IUser, '_id'>,
	): Promise<{ granted: boolean; userToRemove?: IUser }> {
		const attributes = room.abacAttributes ?? [];

		if (!attributes.length) {
			return { granted: true };
		}

		const config = this.client.getConfig();
		const fullUser = await Users.findOneById(user._id);
		if (!fullUser) {
			return { granted: false };
		}

		const entityKey = getUserEntityKey(config.defaultEntityKey, fullUser);
		if (!entityKey) {
			pdpLogger.warn({ msg: 'User has no entity key for Virtru PDP evaluation', userId: user._id });
			return { granted: false };
		}

		const responses = await this.getDecisionBulk([
			{
				entityIdentifier: {
					entityChain: {
						entities: [buildEntityIdentifier(config.defaultEntityKey, entityKey)],
					},
				},
				action: { name: 'read' },
				resources: [
					{
						ephemeralId: room._id,
						attributeValues: { fqns: buildAttributeFqns(config.attributeNamespace, attributes) },
					},
				],
			},
		]);

		const decision = responses[0]?.resourceDecisions?.[0]?.decision;

		if (decision === 'DECISION_PERMIT') {
			pdpLogger.debug({ msg: 'Virtru PDP canAccessObject: permitted', roomId: room._id, userId: user._id });
			return { granted: true };
		}

		if (decision === 'DECISION_DENY') {
			pdpLogger.debug({ msg: 'Virtru PDP canAccessObject: denied', roomId: room._id, userId: user._id });
			return { granted: false, userToRemove: fullUser };
		}

		pdpLogger.debug({
			msg: 'Virtru PDP canAccessObject: inconclusive decision, denying without removal',
			roomId: room._id,
			userId: user._id,
			decision,
		});
		return { granted: false };
	}

	async checkUsernamesMatchAttributes(usernames: string[], attributes: IAbacAttributeDefinition[], object: IRoom): Promise<void> {
		if (!usernames.length || !attributes.length) {
			return;
		}

		const config = this.client.getConfig();
		const users = await Users.findByUsernames(usernames, { projection: { _id: 1, emails: 1, username: 1 } }).toArray();

		const fqns = buildAttributeFqns(config.attributeNamespace, attributes);
		const decisionRequests: IGetDecisionBulkRequest[] = [];

		for (const user of users) {
			const entityKey = getUserEntityKey(config.defaultEntityKey, user);
			if (!entityKey) {
				throw new OnlyCompliantCanBeAddedToRoomError();
			}

			decisionRequests.push({
				entityIdentifier: {
					entityChain: {
						entities: [buildEntityIdentifier(config.defaultEntityKey, entityKey)],
					},
				},
				action: { name: 'read' },
				resources: [
					{
						ephemeralId: object._id,
						attributeValues: { fqns },
					},
				],
			});
		}

		if (!decisionRequests.length) {
			throw new OnlyCompliantCanBeAddedToRoomError();
		}

		const responses = await this.getDecisionBulk(decisionRequests);

		const hasNonCompliant = responses.some(
			(resp) => !resp?.resourceDecisions?.length || resp.resourceDecisions.some((rd) => rd.decision !== 'DECISION_PERMIT'),
		);

		if (hasNonCompliant) {
			throw new OnlyCompliantCanBeAddedToRoomError();
		}
	}

	async onRoomAttributesChanged(
		room: AtLeast<IRoom, '_id' | 't' | 'teamMain' | 'abacAttributes'>,
		newAttributes: IAbacAttributeDefinition[],
	): Promise<IUser[]> {
		if (!newAttributes.length) {
			return [];
		}

		const users = Users.findActiveByRoomIds([room._id], {
			projection: { _id: 1, emails: 1, username: 1 },
		});

		const config = this.client.getConfig();
		const nonCompliantUsers: IUser[] = [];
		const decisionRequests: IGetDecisionBulkRequest[] = [];
		const requestUserIndex: IUser[] = [];
		const fqns = buildAttributeFqns(config.attributeNamespace, newAttributes);

		for await (const user of users) {
			const entityKey = getUserEntityKey(config.defaultEntityKey, user);
			if (!entityKey) {
				pdpLogger.warn({ msg: 'User has no entity key for Virtru PDP evaluation, treating as non-compliant', userId: user._id });
				nonCompliantUsers.push(user);
				continue;
			}

			requestUserIndex.push(user);
			decisionRequests.push({
				entityIdentifier: {
					entityChain: {
						entities: [buildEntityIdentifier(config.defaultEntityKey, entityKey)],
					},
				},
				action: { name: 'read' },
				resources: [
					{
						ephemeralId: room._id,
						attributeValues: { fqns },
					},
				],
			});
		}

		if (!decisionRequests.length) {
			return nonCompliantUsers;
		}

		const responses = await this.getDecisionBulk(decisionRequests);

		responses.forEach((resp, index) => {
			const permitted = resp?.resourceDecisions?.length && resp.resourceDecisions.every((rd) => rd.decision === 'DECISION_PERMIT');
			if (!permitted && requestUserIndex[index]) {
				nonCompliantUsers.push(requestUserIndex[index]);
			}
		});

		return nonCompliantUsers;
	}

	async evaluateUserRooms(
		entries: Array<{
			user: Pick<IUser, '_id' | 'emails' | 'username'>;
			rooms: AtLeast<IRoom, '_id' | 'abacAttributes'>[];
		}>,
	): Promise<Array<{ user: Pick<IUser, '_id' | 'emails' | 'username'>; room: IRoom }>> {
		const requestIndex: Array<{ user: Pick<IUser, '_id' | 'emails' | 'username'>; room: AtLeast<IRoom, '_id' | 'abacAttributes'> }> = [];
		const allRequests: IGetDecisionBulkRequest[] = [];

		const config = this.client.getConfig();
		const nonCompliant: Array<{ user: Pick<IUser, '_id' | 'emails' | 'username'>; room: IRoom }> = [];

		for (const { user, rooms } of entries) {
			const entityKey = getUserEntityKey(config.defaultEntityKey, user);
			if (!entityKey) {
				pdpLogger.warn({ msg: 'User has no entity key for Virtru PDP evaluation, treating as non-compliant', userId: user._id });
				for (const room of rooms) {
					nonCompliant.push({ user, room: room as IRoom });
				}
				continue;
			}

			for (const room of rooms) {
				requestIndex.push({ user, room });
				allRequests.push({
					entityIdentifier: {
						entityChain: {
							entities: [buildEntityIdentifier(config.defaultEntityKey, entityKey)],
						},
					},
					action: { name: 'read' },
					resources: [
						{
							ephemeralId: room._id,
							attributeValues: { fqns: buildAttributeFqns(config.attributeNamespace, room.abacAttributes ?? []) },
						},
					],
				});
			}
		}

		if (!allRequests.length) {
			return nonCompliant;
		}

		const responses = await this.getDecisionBulk(allRequests);

		responses.forEach((resp, index) => {
			const permitted = resp?.resourceDecisions?.length && resp.resourceDecisions.every((rd) => rd.decision === 'DECISION_PERMIT');
			if (!permitted && requestIndex[index]) {
				nonCompliant.push({ user: requestIndex[index].user, room: requestIndex[index].room as IRoom });
			}
		});

		return nonCompliant;
	}

	async reevaluateUsers(users: ReevaluationUser[]): Promise<Array<{ user: Pick<IUser, '_id' | 'emails' | 'username'>; room: IRoom }>> {
		const roomIds = [...new Set(users.flatMap((u) => u.__rooms ?? []))];
		if (!roomIds.length) {
			return [];
		}

		const abacRoomCursor = Rooms.findPrivateRoomsByIdsWithAbacAttributes(roomIds, {
			projection: { _id: 1, abacAttributes: 1 },
		});

		const abacRoomById = new Map<string, IRoom>();
		for await (const room of abacRoomCursor) {
			abacRoomById.set(room._id, room);
		}

		const entries = users
			.map((user) => {
				const rooms = (user.__rooms ?? []).map((rid) => abacRoomById.get(rid)).filter(isTruthy);
				return rooms.length ? { user, rooms } : null;
			})
			.filter(isTruthy);

		return this.evaluateUserRooms(entries);
	}

	async onSubjectAttributesChanged(user: IUser, _next: IAbacAttributeDefinition[]): Promise<IRoom[]> {
		const roomIds = user.__rooms;
		if (!roomIds?.length) {
			return [];
		}

		const abacRooms = await Rooms.findPrivateRoomsByIdsWithAbacAttributes(roomIds, {
			projection: { _id: 1, abacAttributes: 1 },
		}).toArray();

		if (!abacRooms.length) {
			return [];
		}

		const config = this.client.getConfig();
		const entityKey = getUserEntityKey(config.defaultEntityKey, user);
		if (!entityKey) {
			pdpLogger.warn({
				msg: 'User has no entity key for Virtru PDP evaluation, treating as non-compliant for all ABAC rooms',
				userId: user._id,
			});
			return abacRooms;
		}

		const decisionRequests = abacRooms.map((room) => ({
			entityIdentifier: {
				entityChain: {
					entities: [buildEntityIdentifier(config.defaultEntityKey, entityKey)],
				},
			},
			action: { name: 'read' },
			resources: [
				{
					ephemeralId: room._id,
					attributeValues: { fqns: buildAttributeFqns(config.attributeNamespace, room.abacAttributes ?? []) },
				},
			],
		}));

		const responses = await this.getDecisionBulk(decisionRequests);

		const nonCompliantRooms: IRoom[] = [];

		responses.forEach((resp, index) => {
			const permitted = resp?.resourceDecisions?.length && resp.resourceDecisions.every((rd) => rd.decision === 'DECISION_PERMIT');
			if (!permitted && abacRooms[index]) {
				nonCompliantRooms.push(abacRooms[index]);
			}
		});

		return nonCompliantRooms;
	}
}
