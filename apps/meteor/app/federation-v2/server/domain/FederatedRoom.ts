import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { IRoom, IUser } from '@rocket.chat/core-typings';

import { FederatedUser } from './FederatedUser';

export class FederatedRoom {
	public externalId: string;

	public members?: FederatedUser[];

	public internalReference: IRoom;

	// eslint-disable-next-line
	protected constructor() {} 

	protected static generateTemporaryName(normalizedExternalId: string): string {
		return `Federation-${normalizedExternalId}`;
	}

	public static createInstance(
		externalId: string,
		normalizedExternalId: string,
		creator: FederatedUser,
		type: RoomType,
		name?: string,
		members?: FederatedUser[],
	): FederatedRoom {
		const roomName = name || FederatedRoom.generateTemporaryName(normalizedExternalId);
		return Object.assign(new FederatedRoom(), {
			externalId,
			members,
			internalReference: {
				t: type,
				name: roomName,
				fname: roomName,
				u: creator.internalReference,
			},
		});
	}

	public static build(): FederatedRoom {
		return new FederatedRoom();
	}

	public getMembers(): IUser[] {
		return this.members && this.members.length > 0 ? this.members.map((user) => user.internalReference) : [];
	}

	public isFederated(): boolean {
		return this.internalReference?.federated === true;
	}

	public isDirectMessage(): boolean {
		return this.internalReference?.t === RoomType.DIRECT_MESSAGE;
	}

	public static buildRoomIdForDirectMessages(inviter: FederatedUser, invitee: FederatedUser): string {
		if (!inviter.internalReference || !invitee.internalReference) {
			throw new Error('Cannot create room Id without the user ids');
		}
		return [inviter.internalReference, invitee.internalReference]
			.map(({ _id }) => _id)
			.sort()
			.join('');
	}

	public setRoomType(type: RoomType): void {
		if (this.isDirectMessage()) {
			throw new Error('Its not possible to change a direct message type');
		}
		this.internalReference.t = type;
	}

	public changeRoomName(name: string): void {
		if (this.isDirectMessage()) {
			throw new Error('Its not possible to change a direct message name');
		}
		this.internalReference.name = name;
		this.internalReference.fname = name;
	}

	public changeRoomTopic(topic: string): void {
		if (this.isDirectMessage()) {
			throw new Error('Its not possible to change a direct message topic');
		}
		this.internalReference.topic = topic;
	}
}
