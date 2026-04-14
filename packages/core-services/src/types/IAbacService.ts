import type {
	IAbacAttributeDefinition,
	IAbacAttribute,
	IRoom,
	IUser,
	AbacAccessOperation,
	AbacObjectType,
	ILDAPEntry,
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
	): Promise<{ attributes: IAbacAttribute[]; offset: number; count: number; total: number }>;
	listAbacRooms(
		filters?: {
			offset?: number;
			count?: number;
			filter?: string;
			filterType?: 'all' | 'roomName' | 'attribute' | 'value';
		},
		actor?: AbacActor,
	): Promise<{ rooms: IRoom[]; offset: number; count: number; total: number }>;
	updateAbacAttributeById(_id: string, update: { key?: string; values?: string[] }, actor: AbacActor | undefined): Promise<void>;
	deleteAbacAttributeById(_id: string, actor: AbacActor | undefined): Promise<void>;
	getAbacAttributeById(_id: string, actor: AbacActor | undefined): Promise<{ key: string; values: string[] }>;
	isAbacAttributeInUseByKey(key: string): Promise<boolean>;
	setRoomAbacAttributes(rid: string, attributes: Record<string, string[]>, actor: AbacActor | undefined): Promise<void>;
	removeRoomAbacAttribute(rid: string, key: string, actor: AbacActor | undefined): Promise<void>;
	addRoomAbacAttributeByKey(rid: string, key: string, values: string[], actor: AbacActor | undefined): Promise<void>;
	replaceRoomAbacAttributeByKey(rid: string, key: string, values: string[], actor: AbacActor | undefined): Promise<void>;
	checkUsernamesMatchAttributes(usernames: string[], attributes: IAbacAttributeDefinition[], object: IRoom): Promise<void>;
	canAccessObject(
		room: Pick<IRoom, '_id' | 't' | 'teamId' | 'prid' | 'abacAttributes'>,
		user: Pick<IUser, '_id'>,
		action: AbacAccessOperation,
		objectType: AbacObjectType,
	): Promise<boolean>;
	addSubjectAttributes(user: IUser, ldapUser: ILDAPEntry, map: Record<string, string>, actor: AbacActor | undefined): Promise<void>;
}
