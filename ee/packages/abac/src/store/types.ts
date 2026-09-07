import type { AbacActor } from '@rocket.chat/core-services';
import type { AbacPdpType, IAbacAttribute, IAbacAttributeDefinition, IRoom, IRoomAbacRedaction } from '@rocket.chat/core-typings';

export type AttributeEntitlements = Map<string, Set<string>>;

export type ListAttributesOptions = {
	key?: string;
	values?: string;
	offset?: number;
	count?: number;
	/**
	 * Return only what this actor may actually assign (ABAC-P4/D12). Resolved by the service, which
	 * owns the decision; a store that already answers from the subject's entitlements — the Virtru
	 * one — has nothing extra to do.
	 */
	restrictToOwned?: boolean;
};

export type ListAttributesResult = {
	attributes: Pick<IAbacAttribute, '_id' | 'key' | 'values'>[];
	offset: number;
	count: number;
	total: number;
};

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
