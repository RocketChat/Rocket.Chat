import type { IAbacAttributeDefinition, IRoom, IUser, AtLeast } from '@rocket.chat/core-typings';
import { Rooms, Users, Subscriptions } from '@rocket.chat/models';
import { serverFetch } from '@rocket.chat/server-fetch';

import { OnlyCompliantCanBeAddedToRoomError } from '../errors';
import { logger } from '../logger';
import type { IPolicyDecisionPoint } from './types';

const pdpLogger = logger.section('ExternalPDP');

export interface IExternalPDPConfig {
	baseUrl: string;
	clientId: string;
	clientSecret: string;
	oidcEndpoint: string;
	defaultEntityKey: string;
	attributeNamespace: string;
}

interface ITokenCache {
	accessToken: string;
	expiresAt: number;
}

export class ExternalPDP implements IPolicyDecisionPoint {
	private tokenCache: ITokenCache | null = null;

	private config: IExternalPDPConfig;

	constructor(config: IExternalPDPConfig) {
		this.config = config;
	}

	updateConfig(config: IExternalPDPConfig): void {
		this.config = config;
		this.tokenCache = null;
	}

	private async getClientToken(): Promise<string> {
		if (this.tokenCache && Date.now() < this.tokenCache.expiresAt) {
			return this.tokenCache.accessToken;
		}

		const response = await serverFetch(`${this.config.oidcEndpoint}/protocol/openid-connect/token`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				grant_type: 'client_credentials',
				client_id: this.config.clientId,
				client_secret: this.config.clientSecret,
			}),
			ignoreSsrfValidation: true,
		});

		if (!response.ok) {
			throw new Error(`Failed to obtain client token: ${response.status} ${response.statusText}`);
		}

		const data = (await response.json()) as { access_token: string; expires_in?: number };

		// Cache token with a safety margin of 30 seconds
		const expiresIn = data.expires_in ?? 300;
		this.tokenCache = {
			accessToken: data.access_token,
			expiresAt: Date.now() + (expiresIn - 30) * 1000,
		};

		return data.access_token;
	}

	private async apiCall<T>(endpoint: string, body: unknown): Promise<T> {
		const token = await this.getClientToken();

		const response = await serverFetch(`${this.config.baseUrl}${endpoint}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
			},
			body: JSON.stringify(body),
			ignoreSsrfValidation: true,
		});

		if (!response.ok) {
			const text = await response.text().catch(() => '');
			pdpLogger.error({ msg: 'External PDP API call failed', endpoint, status: response.status, response: text });
			throw new Error('External PDP call failed');
		}

		return response.json() as Promise<T>;
	}

	private buildAttributeFqns(attributes: IAbacAttributeDefinition[]): string[] {
		if (!this.config.attributeNamespace) {
			throw new Error('Attribute namespace is not configured for ExternalPDP');
		}

		return attributes.flatMap((attr) =>
			attr.values.map((value) => `https://${this.config.attributeNamespace}/attr/${attr.key}/value/${value}`),
		);
	}

	private buildEntityIdentifier(entityKey: string) {
		if (this.config.defaultEntityKey === 'emailAddress') {
			return { emailAddress: entityKey };
		}

		return { id: entityKey };
	}

	private getUserEntityKey(user: Pick<IUser, '_id' | 'emails' | 'username'>): string | undefined {
		if (!this.config.defaultEntityKey) {
			throw new Error('Default entity key is not configured for ExternalPDP');
		}

		switch (this.config.defaultEntityKey) {
			case 'emailAddress':
				return user.emails?.[0]?.address;
			case 'oidcIdentifier':
				return user.username; // For now, username, we're gonna change this to find the right oidc identifier for the user
			default:
				throw new Error('Unsupported default entity key configuration for ExternalPDP');
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
			pdpLogger.warn({ msg: 'User has no entity key for external PDP evaluation', userId: user._id });
			return { granted: false };
		}

		const fqns = this.buildAttributeFqns(attributes);

		const result = await this.apiCall<{
			decisionResponses?: Array<{
				decision?: string;
			}>;
		}>('/authorization.AuthorizationService/GetDecisions', {
			decisionRequests: [
				{
					actions: [{ standard: 1 }],
					resourceAttributes: [
						{
							resourceAttributesId: room._id,
							attributeValueFqns: fqns,
						},
					],
					entityChains: [
						{
							id: 'rc-access-check',
							entities: [this.buildEntityIdentifier(entityKey)],
						},
					],
				},
			],
		});

		const decision = result.decisionResponses?.[0]?.decision;
		pdpLogger.debug({ msg: 'GetDecisions response', userId: user._id, roomId: room._id, decision, fqns });

		const granted = decision === 'DECISION_PERMIT';

		if (!granted) {
			return { granted: false, userToRemove: fullUser };
		}

		return { granted };
	}

	async checkUsernamesMatchAttributes(usernames: string[], attributes: IAbacAttributeDefinition[], object: IRoom): Promise<void> {
		if (!usernames.length || !attributes.length) {
			return;
		}

		const users = await Users.find({ username: { $in: usernames } }, { projection: { _id: 1, emails: 1, username: 1 } }).toArray();

		const decisionRequests = users
			.map((user) => {
				const entityKey = this.getUserEntityKey(user);
				if (!entityKey) {
					return null;
				}

				return {
					entityIdentifier: {
						entityChain: {
							entities: [this.buildEntityIdentifier(entityKey)],
						},
					},
					action: { name: 'read' },
					resources: [
						{
							ephemeralId: object._id,
							attributeValues: { fqns: this.buildAttributeFqns(attributes) },
						},
					],
				};
			})
			.filter(Boolean);

		if (!decisionRequests.length) {
			throw new OnlyCompliantCanBeAddedToRoomError();
		}

		const result = await this.apiCall<{
			decisionResponses?: Array<{
				resourceDecisions?: Array<{
					decision?: string;
				}>;
			}>;
		}>('/authorization.v2.AuthorizationService/GetDecisionBulk', {
			decisionRequests,
		});

		pdpLogger.debug({ msg: 'GetDecisionBulk response (checkUsernames)', roomId: object._id, result: result.decisionResponses });

		const hasNonCompliant = result.decisionResponses?.some((resp) =>
			resp.resourceDecisions?.some((rd) => rd.decision !== 'DECISION_PERMIT'),
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

		const subscriptions = await Subscriptions.findByRoomId(room._id, { projection: { 'u._id': 1 } }).toArray();
		const userIds = subscriptions.map((s) => s.u._id);

		if (!userIds.length) {
			return [];
		}

		const users = await Users.find({ _id: { $in: userIds } }, { projection: { _id: 1, emails: 1, username: 1, __rooms: 1 } }).toArray();

		const usersWithKeys = users
			.map((user) => ({
				user,
				entityKey: this.getUserEntityKey(user),
			}))
			.filter((entry): entry is { user: IUser; entityKey: string } => !!entry.entityKey);

		if (!usersWithKeys.length) {
			return users;
		}

		const decisionRequests = usersWithKeys.map(({ entityKey }) => ({
			entityIdentifier: {
				entityChain: {
					entities: [this.buildEntityIdentifier(entityKey)],
				},
			},
			action: { name: 'read' },
			resources: [
				{
					ephemeralId: room._id,
					attributeValues: { fqns: this.buildAttributeFqns(newAttributes) },
				},
			],
		}));

		const result = await this.apiCall<{
			decisionResponses?: Array<{
				resourceDecisions?: Array<{
					decision?: string;
				}>;
			}>;
		}>('/authorization.v2.AuthorizationService/GetDecisionBulk', {
			decisionRequests,
		});

		pdpLogger.debug({ msg: 'GetDecisionBulk response (roomAttributesChanged)', roomId: room._id, result: result.decisionResponses });

		const nonCompliantUsers: IUser[] = [];

		result.decisionResponses?.forEach((resp, index) => {
			const permitted = resp.resourceDecisions?.every((rd) => rd.decision === 'DECISION_PERMIT');
			if (!permitted && usersWithKeys[index]) {
				nonCompliantUsers.push(usersWithKeys[index].user);
			}
		});

		// Users without entity keys are also non-compliant
		const usersWithoutKeys = users.filter((user) => !this.getUserEntityKey(user));
		nonCompliantUsers.push(...usersWithoutKeys);

		return nonCompliantUsers;
	}

	async evaluateUserRooms(
		entries: Array<{
			user: Pick<IUser, '_id' | 'emails' | 'username'>;
			rooms: AtLeast<IRoom, '_id' | 'abacAttributes'>[];
		}>,
	): Promise<Array<{ user: Pick<IUser, '_id' | 'emails' | 'username'>; room: IRoom }>> {
		const requestIndex: Array<{ user: Pick<IUser, '_id' | 'emails' | 'username'>; room: AtLeast<IRoom, '_id' | 'abacAttributes'> }> = [];
		const allRequests: unknown[] = [];

		for (const { user, rooms } of entries) {
			const entityKey = this.getUserEntityKey(user);
			if (!entityKey) {
				for (const room of rooms) {
					requestIndex.push({ user, room });
					allRequests.push(null);
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
			return [];
		}

		// Batch into chunks of 200 (GetDecisionBulk limit)
		const BATCH_SIZE = 200;
		const allDecisions: Array<string | undefined> = [];

		for (let i = 0; i < allRequests.length; i += BATCH_SIZE) {
			const batch = allRequests.slice(i, i + BATCH_SIZE);
			const validBatch = batch.filter(Boolean);

			if (!validBatch.length) {
				allDecisions.push(...batch.map(() => undefined));
				continue;
			}

			const result = await this.apiCall<{
				decisionResponses?: Array<{
					resourceDecisions?: Array<{
						decision?: string;
					}>;
				}>;
			}>('/authorization.v2.AuthorizationService/GetDecisionBulk', {
				decisionRequests: validBatch,
			});

			pdpLogger.debug({
				msg: 'GetDecisionBulk response (evaluateUserRooms)',
				batch: `${i}-${i + batch.length}`,
				result: result.decisionResponses,
			});

			let resultIdx = 0;
			for (const req of batch) {
				if (!req) {
					allDecisions.push(undefined);
				} else {
					const resp = result.decisionResponses?.[resultIdx];
					const permitted = resp?.resourceDecisions?.every((rd) => rd.decision === 'DECISION_PERMIT');
					allDecisions.push(permitted ? 'DECISION_PERMIT' : undefined);
					resultIdx++;
				}
			}
		}

		const nonCompliant: Array<{ user: Pick<IUser, '_id' | 'emails' | 'username'>; room: IRoom }> = [];

		allDecisions.forEach((decision, index) => {
			if (decision !== 'DECISION_PERMIT' && requestIndex[index]) {
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

		const entityKey = this.getUserEntityKey(user);
		if (!entityKey) {
			// Without an entity key we cannot evaluate, treat all ABAC rooms as non-compliant
			return Rooms.find(
				{
					_id: { $in: roomIds },
					abacAttributes: { $exists: true, $ne: [] },
				},
				{ projection: { _id: 1 } },
			).toArray();
		}

		const abacRooms = await Rooms.find(
			{
				_id: { $in: roomIds },
				abacAttributes: { $exists: true, $ne: [] },
			},
			{ projection: { _id: 1, abacAttributes: 1 } },
		).toArray();

		if (!abacRooms.length) {
			return [];
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

		const result = await this.apiCall<{
			decisionResponses?: Array<{
				resourceDecisions?: Array<{
					ephemeralResourceId?: string;
					decision?: string;
				}>;
			}>;
		}>('/authorization.v2.AuthorizationService/GetDecisionBulk', {
			decisionRequests,
		});

		pdpLogger.debug({ msg: 'GetDecisionBulk response (subjectAttributesChanged)', userId: user._id, result: result.decisionResponses });

		const nonCompliantRooms: IRoom[] = [];

		result.decisionResponses?.forEach((resp, index) => {
			const permitted = resp.resourceDecisions?.every((rd) => rd.decision === 'DECISION_PERMIT');
			if (!permitted && abacRooms[index]) {
				nonCompliantRooms.push(abacRooms[index]);
			}
		});

		return nonCompliantRooms;
	}
}
