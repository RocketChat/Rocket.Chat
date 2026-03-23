import { Settings } from '@rocket.chat/core-services';
import type { IAbacAttributeDefinition, IRoom, IUser, AtLeast, ISubscription } from '@rocket.chat/core-typings';
import { Rooms, Users, Subscriptions } from '@rocket.chat/models';
import { serverFetch } from '@rocket.chat/server-fetch';

import { OnlyCompliantCanBeAddedToRoomError } from '../errors';
import { logger } from '../logger';
import type { IPolicyDecisionPoint } from './types';

const pdpLogger = logger.section('ExternalPDP');

interface VirtruConfig {
	baseUrl: string;
	clientId: string;
	clientSecret: string;
	oidcEndpoint: string;
	defaultEntityKey: string;
	attributeNamespace: string;
}

interface TokenCache {
	accessToken: string;
	expiresAt: number;
}

export class ExternalPDP implements IPolicyDecisionPoint {
	private tokenCache: TokenCache | null = null;

	private async getConfig(): Promise<VirtruConfig> {
		const [baseUrl, clientId, clientSecret, oidcEndpoint, defaultEntityKey, attributeNamespace] = await Promise.all([
			Settings.get<string>('ABAC_Virtru_Base_URL'),
			Settings.get<string>('ABAC_Virtru_Client_ID'),
			Settings.get<string>('ABAC_Virtru_Client_Secret'),
			Settings.get<string>('ABAC_Virtru_OIDC_Endpoint'),
			Settings.get<string>('ABAC_Virtru_Default_Entity_Key'),
			Settings.get<string>('ABAC_Virtru_Attribute_Namespace'),
		]);

		return { baseUrl, clientId, clientSecret, oidcEndpoint, defaultEntityKey, attributeNamespace: attributeNamespace || 'example.com' };
	}

	private async getClientToken(config: VirtruConfig): Promise<string> {
		if (this.tokenCache && Date.now() < this.tokenCache.expiresAt) {
			return this.tokenCache.accessToken;
		}

		const response = await serverFetch(
			`${config.oidcEndpoint}/protocol/openid-connect/token`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					grant_type: 'client_credentials',
					client_id: config.clientId,
					client_secret: config.clientSecret,
				}),
				ignoreSsrfValidation: true,
			},
			true,
		);

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

	private async apiCall<T>(config: VirtruConfig, endpoint: string, body: unknown): Promise<T> {
		const token = await this.getClientToken(config);

		const response = await serverFetch(
			`${config.baseUrl}${endpoint}`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
				},
				body: JSON.stringify(body),
				ignoreSsrfValidation: true,
			},
			true,
		);

		if (!response.ok) {
			const text = await response.text().catch(() => '');
			throw new Error(`Virtru API call to ${endpoint} failed: ${response.status} ${response.statusText} - ${text}`);
		}

		return response.json() as Promise<T>;
	}

	private buildAttributeFqns(attributes: IAbacAttributeDefinition[], namespace: string): string[] {
		if (!namespace) {
			throw new Error('ExternalPDP: attribute namespace is not configured');
		}

		return attributes.flatMap((attr) => attr.values.map((value) => `https://${namespace}/attr/${attr.key}/value/${value}`));
	}

	private buildEntityIdentifier(entityKey: string, defaultEntityKey: string) {
		if (defaultEntityKey === 'emailAddress') {
			return { emailAddress: entityKey };
		}

		return { id: entityKey };
	}

	private getUserEntityKey(user: Pick<IUser, '_id' | 'emails' | 'username'>, defaultEntityKey: string): string | undefined {
		if (!defaultEntityKey) {
			throw new Error('ExternalPDP: default entity key is not configured');
		}

		switch (defaultEntityKey) {
			case 'emailAddress':
				return user.emails?.[0]?.address;
			case 'oidcIdentifier':
				return user.username;
			default:
				throw new Error(`ExternalPDP: unknown entity key type: ${defaultEntityKey}`);
		}
	}

	async canAccessObject(
		room: AtLeast<IRoom, '_id' | 'abacAttributes'>,
		user: AtLeast<IUser, '_id'>,
		_userSub: ISubscription,
		_decisionCacheTimeout: number,
	): Promise<{ granted: boolean; userToRemove?: IUser }> {
		const config = await this.getConfig();
		const attributes = room.abacAttributes ?? [];

		if (!attributes.length) {
			return { granted: true };
		}

		const fullUser = await Users.findOneById(user._id, { projection: { _id: 1, emails: 1, username: 1 } });
		if (!fullUser) {
			return { granted: false };
		}

		const entityKey = this.getUserEntityKey(fullUser, config.defaultEntityKey);
		if (!entityKey) {
			pdpLogger.warn({ msg: 'User has no entity key for external PDP evaluation', userId: user._id });
			return { granted: false };
		}

		const fqns = this.buildAttributeFqns(attributes, config.attributeNamespace);

		const result = await this.apiCall<{
			decisionResponses?: Array<{
				decision?: string;
			}>;
		}>(config, '/authorization.AuthorizationService/GetDecisions', {
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
							entities: [this.buildEntityIdentifier(entityKey, config.defaultEntityKey)],
						},
					],
				},
			],
		});

		const decision = result.decisionResponses?.[0]?.decision;
		pdpLogger.debug({ msg: 'GetDecisions response', userId: user._id, roomId: room._id, decision, fqns });

		const granted = decision === 'DECISION_PERMIT';

		if (!granted) {
			const userToRemove = await Users.findOneById(user._id);
			if (userToRemove) {
				return { granted: false, userToRemove };
			}
		}

		return { granted };
	}

	async checkUsernamesMatchAttributes(usernames: string[], attributes: IAbacAttributeDefinition[], object: IRoom): Promise<void> {
		if (!usernames.length || !attributes.length) {
			return;
		}

		const config = await this.getConfig();
		const fqns = this.buildAttributeFqns(attributes, config.attributeNamespace);

		const users = await Users.find({ username: { $in: usernames } }, { projection: { _id: 1, emails: 1, username: 1 } }).toArray();

		const decisionRequests = users
			.map((user) => {
				const entityKey = this.getUserEntityKey(user, config.defaultEntityKey);
				if (!entityKey) {
					return null;
				}

				return {
					entityIdentifier: {
						entityChain: {
							entities: [this.buildEntityIdentifier(entityKey, config.defaultEntityKey)],
						},
					},
					action: { name: 'read' },
					resources: [
						{
							ephemeralId: object._id,
							attributeValues: { fqns },
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
		}>(config, '/authorization.v2.AuthorizationService/GetDecisionBulk', {
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

		const config = await this.getConfig();
		const fqns = this.buildAttributeFqns(newAttributes, config.attributeNamespace);

		const subscriptions = await Subscriptions.findByRoomId(room._id, { projection: { 'u._id': 1 } }).toArray();
		const userIds = subscriptions.map((s) => s.u._id);

		if (!userIds.length) {
			return [];
		}

		const users = await Users.find({ _id: { $in: userIds } }, { projection: { _id: 1, emails: 1, username: 1, __rooms: 1 } }).toArray();

		const usersWithKeys = users
			.map((user) => ({
				user,
				entityKey: this.getUserEntityKey(user, config.defaultEntityKey),
			}))
			.filter((entry): entry is { user: IUser; entityKey: string } => !!entry.entityKey);

		if (!usersWithKeys.length) {
			return users as IUser[];
		}

		const decisionRequests = usersWithKeys.map(({ entityKey }) => ({
			entityIdentifier: {
				entityChain: {
					entities: [this.buildEntityIdentifier(entityKey, config.defaultEntityKey)],
				},
			},
			action: { name: 'read' },
			resources: [
				{
					ephemeralId: room._id,
					attributeValues: { fqns },
				},
			],
		}));

		const result = await this.apiCall<{
			decisionResponses?: Array<{
				resourceDecisions?: Array<{
					decision?: string;
				}>;
			}>;
		}>(config, '/authorization.v2.AuthorizationService/GetDecisionBulk', {
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
		const usersWithoutKeys = users.filter((user) => !this.getUserEntityKey(user, config.defaultEntityKey));
		nonCompliantUsers.push(...(usersWithoutKeys as IUser[]));

		return nonCompliantUsers;
	}

	async evaluateUserRooms(
		user: Pick<IUser, '_id' | 'emails' | 'username'>,
		rooms: AtLeast<IRoom, '_id' | 'abacAttributes'>[],
	): Promise<IRoom[]> {
		if (!rooms.length) {
			return [];
		}

		const config = await this.getConfig();

		const entityKey = this.getUserEntityKey(user, config.defaultEntityKey);
		if (!entityKey) {
			return rooms as IRoom[];
		}

		const decisionRequests = rooms.map((room) => ({
			entityIdentifier: {
				entityChain: {
					entities: [this.buildEntityIdentifier(entityKey, config.defaultEntityKey)],
				},
			},
			action: { name: 'read' },
			resources: [
				{
					ephemeralId: room._id,
					attributeValues: { fqns: this.buildAttributeFqns(room.abacAttributes ?? [], config.attributeNamespace) },
				},
			],
		}));

		const result = await this.apiCall<{
			decisionResponses?: Array<{
				resourceDecisions?: Array<{
					decision?: string;
				}>;
			}>;
		}>(config, '/authorization.v2.AuthorizationService/GetDecisionBulk', {
			decisionRequests,
		});

		pdpLogger.debug({ msg: 'GetDecisionBulk response (evaluateUserRooms)', userId: user._id, result: result.decisionResponses });

		const nonCompliantRooms: IRoom[] = [];

		result.decisionResponses?.forEach((resp, index) => {
			const permitted = resp.resourceDecisions?.every((rd) => rd.decision === 'DECISION_PERMIT');
			if (!permitted && rooms[index]) {
				nonCompliantRooms.push(rooms[index] as IRoom);
			}
		});

		return nonCompliantRooms;
	}

	async onSubjectAttributesChanged(user: IUser, _next: IAbacAttributeDefinition[]): Promise<IRoom[]> {
		const roomIds = user.__rooms;
		if (!roomIds?.length) {
			return [];
		}

		const config = await this.getConfig();

		const entityKey = this.getUserEntityKey(user, config.defaultEntityKey);
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
					entities: [this.buildEntityIdentifier(entityKey, config.defaultEntityKey)],
				},
			},
			action: { name: 'read' },
			resources: [
				{
					ephemeralId: room._id,
					attributeValues: { fqns: this.buildAttributeFqns(room.abacAttributes ?? [], config.attributeNamespace) },
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
		}>(config, '/authorization.v2.AuthorizationService/GetDecisionBulk', {
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
