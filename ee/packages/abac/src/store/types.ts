import type { AbacActor } from '@rocket.chat/core-services';
import type { IAbacAttributeDefinition, IRoom } from '@rocket.chat/core-typings';

export type AttributeEntitlements = Map<string, Set<string>>;

export interface IAttributeStore {
	list(
		actor: AbacActor,
		opts?: { filter?: string; offset?: number; count?: number },
	): Promise<{ attributes: IAbacAttributeDefinition[]; total: number }>;

	validateAssignable(attrs: IAbacAttributeDefinition[], actor: AbacActor): Promise<void>;

	entitlementsOf(actor: AbacActor): Promise<AttributeEntitlements>;

	scopeRoomsPage<T extends Pick<IRoom, '_id' | 'abacAttributes'>>(
		rooms: T[],
		actor: AbacActor,
	): Promise<Array<T & { abacAttributesRedacted?: boolean }>>;

	assertCanModifyRoom(room: Pick<IRoom, '_id' | 'abacAttributes'>, actor: AbacActor): Promise<void>;
}
