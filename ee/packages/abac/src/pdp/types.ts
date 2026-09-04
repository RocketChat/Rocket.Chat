import type { IAbacAttributeDefinition, IRoom, IUser, AtLeast } from '@rocket.chat/core-typings';

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

/** A subject considered for evaluation against a set of room attributes. */
export type EvaluableSubject = Pick<IUser, '_id' | 'username' | 'emails'>;

/**
 * Partitioned result of evaluating subjects against room attributes (ABAC-P4 §7.2).
 *
 * `inconclusive` exists because an external PDP can answer neither PERMIT nor DENY. For the
 * eviction path that is treated as "do not evict" (unchanged Phase 3 behaviour), but a preview must
 * never fold it into `compliant` — telling an operator nobody is affected when the PDP simply did
 * not answer is the failure mode this partition prevents.
 */
export type MemberEvaluation = {
	compliantUserIds: string[];
	nonCompliantUserIds: string[];
	inconclusiveUserIds: string[];
};

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

	checkUsernamesMatchAttributes(usernames: string[], attributes: IAbacAttributeDefinition[], object: IRoom): Promise<void>;

	/**
	 * The single member-evaluation primitive (ABAC-P4 §7.2). Backs creation Step 4, the end-user
	 * edit preview, the admin edit preview and — via `onRoomAttributesChanged` — the eviction that
	 * follows a committed change, so a preview cannot disagree with what the commit then does.
	 *
	 * One PDP round trip for N subjects, never N round trips. `resourceId` identifies the resource
	 * being decided against; for a room that does not exist yet, any stable synthetic id will do.
	 */
	evaluateSubjectsAgainstAttributes(
		subjects: EvaluableSubject[],
		attributes: IAbacAttributeDefinition[],
		resourceId: string,
	): Promise<MemberEvaluation>;

	onRoomAttributesChanged(
		room: AtLeast<IRoom, '_id' | 't' | 'teamMain' | 'abacAttributes'>,
		newAttributes: IAbacAttributeDefinition[],
	): Promise<IUser[]>;

	onSubjectAttributesChanged(user: IUser, next: IAbacAttributeDefinition[]): Promise<Pick<IRoom, '_id'>[]>;

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
