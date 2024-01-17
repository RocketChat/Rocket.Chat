import type { RoomType } from '@rocket.chat/core-typings';

import type { IFederationBridge } from '../../../../../server/services/federation/domain/IFederationBridge';

interface IFederationPaginationParams {
	limit?: number;
	pageToken?: string;
}

export interface IFederationSearchPublicRoomsParams extends IFederationPaginationParams {
	serverName: string;
	roomName?: string;
}

interface IFederationPaginationResult {
	next_batch?: string;
	prev_batch?: string;
}

interface IFederationPublicRooms {
	canonical_alias: string;
	name: string;
	num_joined_members: number;
	room_id: string;
	topic?: string;
	world_readable: boolean;
	guest_can_join: boolean;
	join_rule: string;
	avatar_url?: string;
}

export interface IFederationPublicRoomsResult extends IFederationPaginationResult {
	chunk: IFederationPublicRooms[];
	total_room_count_estimate: number;
}

export interface IFederationBridgeEE extends IFederationBridge {
	createRoom(externalCreatorId: string, roomType: RoomType, roomName: string, roomTopic?: string): Promise<string>;
	searchPublicRooms(params: IFederationSearchPublicRoomsParams): Promise<IFederationPublicRoomsResult>;
}
