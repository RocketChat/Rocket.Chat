import type { IAbacAttributeDefinition, IRoom, IUser, AtLeast } from '@rocket.chat/core-typings';

export type IEntityIdentifier = { emailAddress: string } | { id: string };

export interface IGetDecisionRequest {
	actions: Array<{ standard: number }>;
	resourceAttributes: Array<{
		resourceAttributesId: string;
		attributeValueFqns: string[];
	}>;
	entityChains: Array<{
		id: string;
		entities: IEntityIdentifier[];
	}>;
}

export interface IGetDecisionBulkRequest {
	entityIdentifier: {
		entityChain: {
			entities: IEntityIdentifier[];
		};
	};
	action: { name: string };
	resources: Array<{
		ephemeralId: string;
		attributeValues: { fqns: string[] };
	}>;
}

export type Decision = 'DECISION_PERMIT' | 'DECISION_DENY' | 'DECISION_UNSPECIFIED';

export interface IResourceDecision {
	decision?: Decision;
	ephemeralResourceId?: string;
}

export interface IGetDecisionsResponse {
	decisionResponses?: Array<{
		decision?: Decision;
	}>;
}

export interface IGetDecisionBulkResponse {
	decisionResponses?: Array<{
		resourceDecisions?: IResourceDecision[];
	}>;
}

export interface IPolicyDecisionPoint {
	isAvailable(): Promise<boolean>;

	getHealthStatus(): Promise<void>;

	canAccessObject(
		room: AtLeast<IRoom, '_id' | 'abacAttributes'>,
		user: AtLeast<IUser, '_id'>,
	): Promise<{ granted: boolean; userToRemove?: IUser }>;

	checkUsernamesMatchAttributes(usernames: string[], attributes: IAbacAttributeDefinition[], object: IRoom): Promise<void>;

	onRoomAttributesChanged(
		room: AtLeast<IRoom, '_id' | 't' | 'teamMain' | 'abacAttributes'>,
		newAttributes: IAbacAttributeDefinition[],
	): Promise<IUser[]>;

	onSubjectAttributesChanged(user: IUser, next: IAbacAttributeDefinition[]): Promise<IRoom[]>;

	evaluateUserRooms(
		entries: Array<{
			user: Pick<IUser, '_id' | 'emails' | 'username'>;
			rooms: AtLeast<IRoom, '_id' | 'abacAttributes'>[];
		}>,
	): Promise<Array<{ user: Pick<IUser, '_id' | 'emails' | 'username'>; room: IRoom }>>;
}

export interface IVirtruPDPConfig {
	baseUrl: string;
	clientId: string;
	clientSecret: string;
	oidcEndpoint: string;
	defaultEntityKey: 'emailAddress' | 'oidcIdentifier';
	attributeNamespace: string;
}

export interface ITokenCache {
	accessToken: string;
	expiresAt: number;
}
