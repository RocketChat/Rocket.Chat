import type { IAbacAttributeDefinition, IRoom, IUser, AtLeast } from '@rocket.chat/core-typings';
import { Rooms, Users } from '@rocket.chat/models';
import { serverFetch } from '@rocket.chat/server-fetch';
import pLimit from 'p-limit';

import { OnlyCompliantCanBeAddedToRoomError, PdpHealthCheckError } from '../errors';
import { logger } from '../logger';
import type {
	Decision,
	IEntityIdentifier,
	IPolicyDecisionPoint,
	IGetDecisionRequest,
	IGetDecisionBulkRequest,
	IGetDecisionsResponse,
	IGetDecisionBulkResponse,
	IResourceDecision,
	ITokenCache,
	IVirtruPDPConfig,
} from './types';

const pdpLogger = logger.section('VirtruPDP');

const HEALTH_CHECK_TIMEOUT = 5000;
const REQUEST_TIMEOUT = 10000;

export class VirtruPDP implements IPolicyDecisionPoint {
	private tokenCache: ITokenCache | null = null;

	private config: IVirtruPDPConfig;

	constructor(config: IVirtruPDPConfig) {
		this.config = config;
	}

	updateConfig(config: IVirtruPDPConfig): void {
		this.config = config;
		this.tokenCache = null;
	}

	async isAvailable(): Promise<boolean> {
		try {
			const response = await serverFetch(`${this.config.baseUrl}/healthz`, {
				method: 'GET',
				timeout: HEALTH_CHECK_TIMEOUT,
				// SECURITY: This can only be configured by users with enough privileges. It's ok to disable this check here.
				ignoreSsrfValidation: true,
			});

			if (!response.ok) {
				throw new Error('PDP Health check failed');
			}

			const data = (await response.json()) as { status?: string };

			pdpLogger.info({ msg: 'Virtru PDP health check response', data });
			return data.status === 'SERVING';
		} catch (err) {
			pdpLogger.warn({ msg: 'Virtru PDP is not reachable', err });
			return false;
		}
	}

	async getHealthStatus(): Promise<void> {
		await this.checkPlatformHealth();
		const token = await this.checkIdpConnectivity();
		await this.checkAuthorizedAccess(token);
		pdpLogger.info({ msg: 'Virtru PDP health check passed' });
	}

	private async checkIdpConnectivity(): Promise<string> {
		try {
			this.tokenCache = null;
			const token = await this.getClientToken();
			pdpLogger.info({ msg: 'Virtru PDP health check: IdP connectivity OK' });
			return token;
		} catch (err) {
			pdpLogger.warn({ msg: 'Virtru PDP health check: IdP connectivity failed', err });
			throw new PdpHealthCheckError('ABAC_PDP_Health_IdP_Failed');
		}
	}

	private async checkPlatformHealth(): Promise<void> {
		try {
			const response = await serverFetch(`${this.config.baseUrl}/healthz`, {
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
		try {
			const response = await serverFetch(`${this.config.baseUrl}/authorization.AuthorizationService/GetDecisions`, {
				method: 'POST',
				timeout: HEALTH_CHECK_TIMEOUT,
				headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
				body: JSON.stringify({ decisionRequests: [] }),
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

	private async getClientToken(): Promise<string> {
		if (this.tokenCache && Date.now() < this.tokenCache.expiresAt) {
			return this.tokenCache.accessToken;
		}
		const response = await serverFetch(`${this.config.oidcEndpoint}/protocol/openid-connect/token`, {
			method: 'POST',
			timeout: REQUEST_TIMEOUT,
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				grant_type: 'client_credentials',
				client_id: this.config.clientId,
				client_secret: this.config.clientSecret,
			}),
			// SECURITY: This can only be configured by users with enough privileges. It's ok to disable this check here.
			ignoreSsrfValidation: true,
		});

		if (!response.ok) {
			throw new Error(`Failed to obtain client token: ${response.status} ${response.statusText}`);
		}

		const data = (await response.json()) as { access_token: string; expires_in?: number };

		const expiresIn = data.expires_in ?? 300;
		this.tokenCache = {
			accessToken: data.access_token,
			// We check for expiry 30 seconds before the actual expiry time for safety.
			expiresAt: Date.now() + (expiresIn - 30) * 1000,
		};

		return data.access_token;
	}

	private async apiCall<T>(endpoint: string, body: unknown): Promise<T> {
		const token = await this.getClientToken();

		const response = await serverFetch(`${this.config.baseUrl}${endpoint}`, {
			method: 'POST',
			timeout: REQUEST_TIMEOUT,
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
			},
			body: JSON.stringify(body),
			// SECURITY: This can only be configured by users with enough privileges. It's ok to disable this check here.
			ignoreSsrfValidation: true,
		});

		if (!response.ok) {
			const text = await response.text().catch(() => '');
			pdpLogger.error({ msg: 'Virtru PDP API call failed', endpoint, status: response.status, response: text });
			throw new Error('Virtru PDP call failed');
		}

		return response.json() as Promise<T>;
	}

	private async getDecision(request: IGetDecisionRequest): Promise<Decision | undefined> {
		const result = await this.apiCall<IGetDecisionsResponse>('/authorization.AuthorizationService/GetDecisions', {
			decisionRequests: [request],
		});

		pdpLogger.debug({ msg: 'GetDecision response', result: result.decisionResponses });

		return result.decisionResponses?.[0]?.decision;
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

					const result = await this.apiCall<IGetDecisionBulkResponse>('/authorization.v2.AuthorizationService/GetDecisionBulk', {
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

	private buildAttributeFqns(attributes: IAbacAttributeDefinition[]): string[] {
		if (!this.config.attributeNamespace) {
			throw new Error('Attribute namespace is not configured for VirtruPDP');
		}

		return attributes.flatMap((attr) =>
			attr.values.map((value) => `https://${this.config.attributeNamespace}/attr/${attr.key}/value/${value}`),
		);
	}

	private buildEntityIdentifier(entityKey: string): IEntityIdentifier {
		if (this.config.defaultEntityKey === 'emailAddress') {
			return { emailAddress: entityKey };
		}

		return { id: entityKey };
	}

	private getUserEntityKey(user: Pick<IUser, '_id' | 'emails' | 'username'>): string | undefined {
		switch (this.config.defaultEntityKey) {
			case 'emailAddress':
				return user.emails?.[0]?.address;
			case 'oidcIdentifier':
				return user.username; // For now, username, we're gonna change this to find the right oidc identifier for the user
		}
	}

	async canAccessObject(
		room: AtLeast<IRoom, '_id' | 'abacAttributes'>,
		user: AtLeast<IUser, '_id'>,
	): Promise<{ granted: boolean; userToRemove?: IUser }> {
		const attributes = room.abacAttributes ?? [];

		if (!attributes.length) {
			return { granted: true };
		}

		const fullUser = await Users.findOneById(user._id);
		if (!fullUser) {
			return { granted: false };
		}

		const entityKey = this.getUserEntityKey(fullUser);
		if (!entityKey) {
			pdpLogger.warn({ msg: 'User has no entity key for Virtru PDP evaluation', userId: user._id });
			return { granted: false };
		}

		const decision = await this.getDecision({
			actions: [{ standard: 1 }],
			resourceAttributes: [
				{
					resourceAttributesId: room._id,
					attributeValueFqns: this.buildAttributeFqns(attributes),
				},
			],
			entityChains: [
				{
					id: 'rc-access-check',
					entities: [this.buildEntityIdentifier(entityKey)],
				},
			],
		});

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

		const users = await Users.findByUsernames(usernames, { projection: { _id: 1, emails: 1, username: 1 } }).toArray();

		const fqns = this.buildAttributeFqns(attributes);
		const decisionRequests: IGetDecisionBulkRequest[] = [];

		for (const user of users) {
			const entityKey = this.getUserEntityKey(user);
			if (!entityKey) {
				throw new OnlyCompliantCanBeAddedToRoomError();
			}

			decisionRequests.push({
				entityIdentifier: {
					entityChain: {
						entities: [this.buildEntityIdentifier(entityKey)],
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

		const nonCompliantUsers: IUser[] = [];
		const decisionRequests: IGetDecisionBulkRequest[] = [];
		const requestUserIndex: IUser[] = [];
		const fqns = this.buildAttributeFqns(newAttributes);

		for await (const user of users) {
			const entityKey = this.getUserEntityKey(user);
			if (!entityKey) {
				pdpLogger.warn({ msg: 'User has no entity key for Virtru PDP evaluation, treating as non-compliant', userId: user._id });
				nonCompliantUsers.push(user);
				continue;
			}

			requestUserIndex.push(user);
			decisionRequests.push({
				entityIdentifier: {
					entityChain: {
						entities: [this.buildEntityIdentifier(entityKey)],
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

		const nonCompliant: Array<{ user: Pick<IUser, '_id' | 'emails' | 'username'>; room: IRoom }> = [];

		for (const { user, rooms } of entries) {
			const entityKey = this.getUserEntityKey(user);
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
							entities: [this.buildEntityIdentifier(entityKey)],
						},
					},
					action: { name: 'read' },
					resources: [
						{
							ephemeralId: room._id,
							attributeValues: { fqns: this.buildAttributeFqns(room.abacAttributes ?? []) },
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

		const entityKey = this.getUserEntityKey(user);
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
					entities: [this.buildEntityIdentifier(entityKey)],
				},
			},
			action: { name: 'read' },
			resources: [
				{
					ephemeralId: room._id,
					attributeValues: { fqns: this.buildAttributeFqns(room.abacAttributes ?? []) },
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
