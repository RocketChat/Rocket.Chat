import type { AbacRoomMembershipPreviewPage } from '@rocket.chat/core-services';
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

export type EvaluableSubject = Pick<IUser, '_id' | 'username' | 'emails'>;

export type SubjectEvaluation = {
	compliant: string[];
	nonCompliant: string[];
	inconclusive: string[];
};

export type RoomEvaluation = SubjectEvaluation;

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

	evaluateSubjectsAgainstAttributes(
		subjects: EvaluableSubject[],
		attributes: IAbacAttributeDefinition[],
		object: Pick<IRoom, '_id'>,
	): Promise<SubjectEvaluation>;

	evaluateSubjectAgainstRooms(subject: EvaluableSubject, rooms: AtLeast<IRoom, '_id' | 'abacAttributes'>[]): Promise<RoomEvaluation>;

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
