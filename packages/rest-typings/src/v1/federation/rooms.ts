import type { FederationAddServerProps, FederationPaginatedResult, FederationRemoveServerProps } from '.';
import type { FederationSearchPublicRoomsProps } from './FederationPublicRoomsProps';
import type { FederationJoinExternalPublicRoomProps } from './FederationJoinExternalPublicRoomProps';
import type { FederationJoinInternalPublicRoomProps } from './FederationJoinInternalPublicRoomProps';

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
	'/v1/federation/joinExternalPublicRoom': {
		POST: (params: FederationJoinExternalPublicRoomProps) => void;
	};
	'/v1/federation/joinInternalPublicRoom': {
		POST: (params: FederationJoinInternalPublicRoomProps) => void;
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
