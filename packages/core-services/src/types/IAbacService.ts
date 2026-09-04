import type {
	AbacAccessOperation,
	AbacMembershipPreview,
	AbacObjectType,
	AbacUserIdentifiers,
	IAbacAttribute,
	IAbacAttributeDefinition,
	ILDAPEntry,
	IRoom,
	IRoomAbacRedaction,
	IUser,
} from '@rocket.chat/core-typings';

export type AbacActor = Pick<IUser, '_id' | 'username' | 'name'>;

export interface IAbacService {
	addAbacAttribute(attribute: IAbacAttributeDefinition, actor: AbacActor | undefined): Promise<void>;
	listAbacAttributes(
		filters?: {
			key?: string;
			values?: string;
			offset?: number;
			count?: number;
		},
		actor?: AbacActor,
	): Promise<{ attributes: Pick<IAbacAttribute, '_id' | 'key' | 'values'>[]; offset: number; count: number; total: number }>;
	listAbacRooms(
		filters?: {
			offset?: number;
			count?: number;
			filter?: string;
			filterType?: 'all' | 'roomName' | 'attribute' | 'value';
		},
		actor?: AbacActor,
	): Promise<{ rooms: Array<IRoom & IRoomAbacRedaction>; offset: number; count: number; total: number }>;
	scopeRoomsForAdmin<T extends Pick<IRoom, '_id' | 'abacAttributes'>>(rooms: T[], actor: AbacActor): Promise<Array<T & IRoomAbacRedaction>>;
	updateAbacAttributeById(_id: string, update: { key?: string; values?: string[] }, actor: AbacActor | undefined): Promise<void>;
	deleteAbacAttributeById(_id: string, actor: AbacActor | undefined): Promise<void>;
	getAbacAttributeById(_id: string, actor: AbacActor | undefined): Promise<{ key: string; values: string[] }>;
	isAbacAttributeInUseByKey(key: string): Promise<boolean>;
	setRoomAbacAttributes(rid: string, attributes: Record<string, string[]>, actor: AbacActor | undefined): Promise<void>;
	removeRoomAbacAttribute(rid: string, key: string, actor: AbacActor | undefined): Promise<void>;
	addRoomAbacAttributeByKey(rid: string, key: string, values: string[], actor: AbacActor | undefined): Promise<void>;
	replaceRoomAbacAttributeByKey(rid: string, key: string, values: string[], actor: AbacActor | undefined): Promise<void>;
	/**
	 * Dry-run member evaluation (ABAC-P4 §7.2). Commits nothing — `setRoomAbacAttributes` is the
	 * commit path, and committing evicts.
	 */
	/**
	 * PDP creator-authority check (ABAC-P4 M2): may this actor instantiate exactly these
	 * attributes? Creates nothing. Throws with the offending attribute in the error details.
	 */
	assertCanAssignAttributes(attributes: IAbacAttributeDefinition[], actor: AbacActor): Promise<void>;
	/** Records the attributes a room was created with (ABAC-P4 M4). */
	auditRoomAttributesAtCreation(room: Pick<IRoom, '_id' | 'name' | 'abacAttributes'>, actor: AbacActor): Promise<void>;
	previewMembersAgainstAttributes(
		target: { rid: string } | { memberIds: string[] } | { memberUsernames: string[] },
		attributes: IAbacAttributeDefinition[],
		actor: AbacActor,
		page?: { offset?: number; count?: number },
	): Promise<AbacMembershipPreview>;
	checkUsernamesMatchAttributes(usernames: string[], attributes: IAbacAttributeDefinition[], object: IRoom): Promise<void>;
	canAccessObject(
		room: Pick<IRoom, '_id' | 't' | 'teamId' | 'prid' | 'abacAttributes'>,
		user: Pick<IUser, '_id'>,
		action: AbacAccessOperation,
		objectType: AbacObjectType,
	): Promise<boolean>;
	addSubjectAttributes(user: IUser, ldapUser: ILDAPEntry, map: Record<string, string>, actor: AbacActor | undefined): Promise<void>;
	evaluateRoomMembership(): Promise<void>;
	reevaluateUsers(identifiers: AbacUserIdentifiers): Promise<void>;
	getPDPHealth(): Promise<void>;
	isExternalAttributeStore(): Promise<boolean>;
}
