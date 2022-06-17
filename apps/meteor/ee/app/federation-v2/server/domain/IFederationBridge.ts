import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

import { IFederationBridge } from '../../../../../app/federation-v2/server/domain/IFederationBridge';

export interface IFederationBridgeEE extends IFederationBridge {
	createRoom(externalCreatorId: string, roomType: RoomType, roomName: string, roomTopic?: string): Promise<string>;
}
