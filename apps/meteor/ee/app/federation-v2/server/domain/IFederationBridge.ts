import type { RoomType } from '@rocket.chat/core-typings';

import type { IFederationBridge } from '../../../../../app/federation-v2/server/domain/IFederationBridge';

export interface IFederationPaginationParams {
	limit?: number;
	pageToken?: string;
};

export interface IFederationSearchPublicRoomsParams extends IFederationPaginationParams {
	serverName: string;
	roomName?: string;
}

export interface IFederationPaginationResult {
	next_batch?: string;
	prev_batch?: string;
}

export interface IFederationPublicRooms {
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
	getRoomName(externalRoomId: string, externalUserId: string): Promise<string | undefined>;
	getRoomTopic(externalRoomId: string, externalUserId: string): Promise<string | undefined>;
	setRoomName(externalRoomId: string, externalUserId: string, roomName: string): Promise<void>;
	setRoomTopic(externalRoomId: string, externalUserId: string, roomTopic: string): Promise<void>;
	searchPublicRooms(params: IFederationSearchPublicRoomsParams): Promise<IFederationPublicRoomsResult>;
}
