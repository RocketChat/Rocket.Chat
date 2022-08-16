import type { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

import type { IFederationBridge } from '../../../../../app/federation-v2/server/domain/IFederationBridge';

export interface IFederationBridgeEE extends IFederationBridge {
	createRoom(externalCreatorId: string, roomType: RoomType, roomName: string, roomTopic?: string): Promise<string>;
	getRoomName(externalRoomId: string, externalUserId: string): Promise<string>;
	getRoomTopic(externalRoomId: string, externalUserId: string): Promise<string>;
	setRoomName(externalRoomId: string, externalUserId: string, roomName: string): Promise<void>;
	setRoomTopic(externalRoomId: string, externalUserId: string, roomTopic: string): Promise<void>;
}
