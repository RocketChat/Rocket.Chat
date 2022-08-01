import { IRoom, isDirectMessageRoom, IUser, RoomType } from '@rocket.chat/core-typings';

import { DirectMessageFederatedRoom, FederatedRoom } from '../../../../../app/federation-v2/server/domain/FederatedRoom';
import { FederatedUser } from '../../../../../app/federation-v2/server/domain/FederatedUser';
import { FederatedUserEE } from './FederatedUser';



export class FederatedRoomEE extends FederatedRoom {

	public shouldUpdateRoomName(externalRoomName: string): boolean {
		return this.internalReference.name !== externalRoomName && !this.isDirectMessage();
	}

	public shouldUpdateRoomTopic(externalRoomTopic: string): boolean {
		return this.internalReference.topic !== externalRoomTopic && !this.isDirectMessage();
	}

}

export class DirectMessageFederatedRoomEE extends DirectMessageFederatedRoom {
}