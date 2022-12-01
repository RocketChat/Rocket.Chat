import type { FederationPaginatedResult } from '.';
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
};
