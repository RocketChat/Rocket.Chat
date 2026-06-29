import type { AbacActor } from '@rocket.chat/core-services';
import type { AbacPdpType, IAbacAttribute, IAbacAttributeDefinition, IRoom, IRoomAbacRedaction } from '@rocket.chat/core-typings';

export type AttributeEntitlements = Map<string, Set<string>>;

export type ListAttributesOptions = { key?: string; values?: string; offset?: number; count?: number };

export type ListAttributesResult = { attributes: IAbacAttribute[]; offset: number; count: number; total: number };

export interface IAttributeStore {
	list(actor: AbacActor | undefined, opts?: ListAttributesOptions): Promise<ListAttributesResult>;

	validateAssignable(attrs: IAbacAttributeDefinition[], actor: AbacActor): Promise<void>;

	entitlementsOf(actor: AbacActor): Promise<AttributeEntitlements>;

	scopeRoomsPage<T extends Pick<IRoom, '_id' | 'abacAttributes'>>(rooms: T[], actor: AbacActor): Promise<Array<T & IRoomAbacRedaction>>;

	assertCanModifyRoom(room: Pick<IRoom, '_id' | 'abacAttributes'>, actor: AbacActor): Promise<void>;

	onStoreSelected?(): void;
}

export type AttributeStoreSelectionContext = {
	abacEnabled: boolean;
	pdpType?: AbacPdpType;
	licensed: boolean;
};

export type AttributeStoreDescriptor = {
	store: IAttributeStore;
	isEligible: (ctx: AttributeStoreSelectionContext) => boolean;
};
