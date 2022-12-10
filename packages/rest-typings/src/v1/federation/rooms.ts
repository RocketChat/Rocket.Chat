import type { FederationAddServerProps, FederationPaginatedResult, FederationRemoveServerProps } from '.';
import type { FederationSearchPublicRoomsProps } from './FederationPublicRoomsProps';
import type { FederationJoinPublicRoomProps } from './FederationJoinPublicRoomProps';

export interface IFederationPublicRooms {
	id: string;
	name: string;
	canonicalAlias: string;
	joinedMembers: number;
	canJoin: boolean;
	topic?: string;
}

export type FederationEndpoints = {
	'/v1/federation/searchPublicRooms': {
		GET: (params: FederationSearchPublicRoomsProps) => FederationPaginatedResult<{
			rooms: IFederationPublicRooms[];
		}>;
	};
	'/v1/federation/joinPublicRoom': {
		POST: (params: FederationJoinPublicRoomProps) => void;
	};
	'/v1/federation/listServersByUser': {
		GET: () => { servers: { name: string; default: boolean; local: boolean }[] };
	};
	'/v1/federation/addServerByUser': {
		POST: (params: FederationAddServerProps) => void;
	};
	'/v1/federation/removeServerByUser': {
		POST: (params: FederationRemoveServerProps) => void;
	};
};
