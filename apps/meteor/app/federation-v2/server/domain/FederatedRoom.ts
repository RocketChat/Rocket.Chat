import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { IRoom, IUser } from '@rocket.chat/core-typings';

import { FederatedUser } from './FederatedUser';

export abstract class AbstractFederatedRoom {
	public externalId: string;

	public internalReference: IRoom;

	// eslint-disable-next-line
	protected constructor() { }

	protected static generateTemporaryName(normalizedExternalId: string): string {
		return `Federation-${ normalizedExternalId }`;
	}

	// public static build(): FederatedRoom {
	// 	return new FederatedRoom();
	// }

	// public getMembers(): IUser[] {
	// 	return this.members && this.members.length > 0 ? this.members.map((user) => user.internalReference) : [];
	// }

	public abstract isDirectMessage(): boolean;

	public getMembersUsernames(): string[] {
		return this.internalReference?.usernames || [];
	}

	public isUserPartOfTheRoom(federatedUser: FederatedUser): boolean {
		if (!federatedUser.internalReference?.username) {
			return false;
		}
		if (!this.internalReference?.usernames) {
			return false;
		}
		return this.internalReference.usernames.includes(federatedUser.internalReference.username);
	}

	// public static buildRoomIdForDirectMessages(inviter: FederatedUser, invitee: FederatedUser): string {
	// 	if (!inviter.internalReference || !invitee.internalReference) {
	// 		throw new Error('Cannot create room Id without the user ids');
	// 	}
	// 	return [inviter.internalReference, invitee.internalReference]
	// 		.map(({ _id }) => _id)
	// 		.sort()
	// 		.join('');
	// }

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

	public shouldUpdateRoomName(newRoomName: string): boolean {
		return this.internalReference?.name !== newRoomName && !this.isDirectMessage();
	}

	public shouldUpdateRoomTopic(newRoomTopic: string): boolean {
		return this.internalReference?.topic !== newRoomTopic && !this.isDirectMessage();
	}

	public static isAnInternalRoom(fromOriginName: string, localOriginName: string): boolean {
		return fromOriginName === localOriginName;
	}
}

export class FederatedRoom extends AbstractFederatedRoom {

	// eslint-disable-next-line
	protected constructor() {
		super();
	}

	public static createInstance(
		externalId: string,
		normalizedExternalId: string,
		creator: FederatedUser,
		type: RoomType,
		name?: string,
		// members?: FederatedUser[],
	): FederatedRoom {
		const roomName = name || FederatedRoom.generateTemporaryName(normalizedExternalId);
		return Object.assign(new FederatedRoom(), {
			externalId,
			// members,
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

	public isDirectMessage(): boolean {
		return false;
	}

}

export class DirectMessageFederatedRoom extends AbstractFederatedRoom {

	public members: FederatedUser[];
	
	protected constructor() {
		super();
	}

	public static createInstance(
		externalId: string,
		normalizedExternalId: string,
		creator: FederatedUser,
		type: RoomType,
		name?: string,
		members?: FederatedUser[],
	): DirectMessageFederatedRoom {
		const roomName = name || FederatedRoom.generateTemporaryName(normalizedExternalId);
		return Object.assign(new DirectMessageFederatedRoom(), {
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
		return new DirectMessageFederatedRoom();
	}

	public getInternalMembers(): IUser[] {
		return this.members && this.members.length > 0 ? this.members.map((user) => user.internalReference) : [];
	}

	public getMembers(): FederatedUser[] {
		return this.members;
	}

	public isDirectMessage(): boolean {
		return true;
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
}
