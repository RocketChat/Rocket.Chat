import type { AbacActor, AbacRoomMembershipPreviewPage } from '@rocket.chat/core-services';
import type { IAbacAttributeDefinition, IAbacRoomMembershipPreview, IRoom, IUser, AtLeast } from '@rocket.chat/core-typings';

export type IEntityIdentifier = { emailAddress: string } | { id: string };

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

export interface IGetDecisionBulkResponse {
	decisionResponses?: Array<{
		resourceDecisions?: IResourceDecision[];
	}>;
}

export type ReevaluationUser = Pick<IUser, '_id' | 'emails' | 'username' | '__rooms'>;

export type EvaluableSubject = Pick<IUser, '_id' | 'username' | 'emails' | 'abacAttributes'>;

export type Evaluation = {
	compliant: string[];
	nonCompliant: string[];
	inconclusive: string[];
};

export type AttributeSetChange = { added: boolean; removed: boolean };

export type RoomMembersPreview = Pick<IAbacRoomMembershipPreview, 'members' | 'checked' | 'total' | 'next'>;

export type NonCompliantPair = {
	user: Pick<IUser, '_id' | 'emails' | 'username'>;
	room: AtLeast<IRoom, '_id' | 'abacAttributes'>;
};

export interface IPolicyDecisionPoint {
	isAvailable(): Promise<boolean>;

	getHealthStatus(): Promise<void>;

	canAccessObject(
		room: AtLeast<IRoom, '_id' | 'abacAttributes'>,
		user: AtLeast<IUser, '_id'>,
	): Promise<{ granted: boolean; userToRemove?: IUser }>;

	checkUsernamesMatchAttributes(usernames: string[], attributes: IAbacAttributeDefinition[], object: Pick<IRoom, '_id'>): Promise<void>;

	assertCreatorMayAssign(attributes: IAbacAttributeDefinition[], actor: AbacActor): Promise<{ creatorAdmitted: boolean }>;

	findUnassignableValues?(
		attributes: IAbacAttributeDefinition[],
		actor: AbacActor,
		alreadyAssigned?: IAbacAttributeDefinition[],
	): Promise<IAbacAttributeDefinition[]>;

	filterAssignableAttributes?(
		definitions: IAbacAttributeDefinition[],
		actor: AbacActor,
		alreadyAssigned?: IAbacAttributeDefinition[],
	): Promise<IAbacAttributeDefinition[]>;

	evaluateSubjectsAgainstAttributes(
		subjects: EvaluableSubject[],
		attributes: IAbacAttributeDefinition[],
		object: Pick<IRoom, '_id'>,
	): Promise<Evaluation>;

	evaluateSubjectAgainstRooms(subject: EvaluableSubject, rooms: AtLeast<IRoom, '_id' | 'abacAttributes'>[]): Promise<Evaluation>;

	onRoomAttributesChanged(
		room: AtLeast<IRoom, '_id' | 't' | 'teamMain' | 'abacAttributes'>,
		newAttributes: IAbacAttributeDefinition[],
	): Promise<IUser[]>;

	needsEvaluation(change: AttributeSetChange): boolean;

	previewRoomMembers(
		room: AtLeast<IRoom, '_id' | 'abacAttributes'>,
		attributes: IAbacAttributeDefinition[],
		page: AbacRoomMembershipPreviewPage,
	): Promise<RoomMembersPreview>;

	onSubjectAttributesChanged(user: IUser, next: IAbacAttributeDefinition[]): Promise<Pick<IRoom, '_id' | 'name'>[]>;

	evaluateUserRooms(
		entries: Array<{
			user: Pick<IUser, '_id' | 'emails' | 'username'>;
			rooms: AtLeast<IRoom, '_id' | 'abacAttributes'>[];
		}>,
	): Promise<NonCompliantPair[]>;

	reevaluateUsers(users: ReevaluationUser[]): Promise<void | NonCompliantPair[]>;

	refreshSubjectAttributes(userIds: string[]): Promise<void>;
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

export interface IGetEntitlementsRequest {
	entityIdentifier: {
		entityChain: {
			entities: IEntityIdentifier[];
		};
	};
	withComprehensiveHierarchy: boolean;
}

export interface IEntityEntitlements {
	ephemeralId?: string;
	actionsPerAttributeValueFqn: Record<string, unknown>;
}

export interface IGetEntitlementsResponse {
	entitlements?: IEntityEntitlements[];
}
