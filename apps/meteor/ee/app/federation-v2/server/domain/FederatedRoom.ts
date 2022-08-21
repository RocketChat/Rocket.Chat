import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import type { IRoom, IUser } from '@rocket.chat/core-typings';

import { FederatedRoom } from '../../../../../app/federation-v2/server/domain/FederatedRoom';
import type { FederatedUser } from '../../../../../app/federation-v2/server/domain/FederatedUser';
import type { FederatedUserEE } from './FederatedUser';

export class FederatedRoomEE extends FederatedRoom {
	public externalId: string;

	public members?: FederatedUserEE[];

	public internalReference: IRoom;

	public static createInstanceEE(
		externalId: string,
		normalizedExternalId: string,
		creator: FederatedUser,
		type: RoomType,
		name?: string,
		members?: FederatedUser[],
	): FederatedRoomEE {
		const roomName = name || FederatedRoom.generateTemporaryName(normalizedExternalId);
		return Object.assign(new FederatedRoomEE(), {
			externalId,
			...(type === RoomType.DIRECT_MESSAGE ? { members } : {}),
			internalReference: {
				t: type,
				name: roomName,
				fname: roomName,
				u: creator.internalReference,
			},
		});
	}

	public isDirectMessage(): boolean {
		return this.internalReference?.t === RoomType.DIRECT_MESSAGE;
	}

	public getMembers(): IUser[] {
		return this.isDirectMessage() && this.members && this.members.length > 0 ? this.members.map((user) => user.internalReference) : [];
	}

	public static build(): FederatedRoomEE {
		return new FederatedRoomEE();
	}
}
