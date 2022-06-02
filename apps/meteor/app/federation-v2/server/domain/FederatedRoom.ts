import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { IRoom, IUser } from '@rocket.chat/core-typings';

import { FederatedUser } from './FederatedUser';

export class FederatedRoom {
	public externalId: string;

	public members?: FederatedUser[];

	public internalReference: IRoom;

	// eslint-disable-next-line
	private constructor() {} 

	private static generateTemporaryName(normalizedExternalId: string): string {
		return `Federation-${normalizedExternalId}`;
	}

	public static createInstance(
		externalId: string,
		normalizedExternalId: string,
		creator: FederatedUser,
		type: RoomType,
		name?: string,
		members?: IUser[],
	): FederatedRoom {
		const roomName = name || FederatedRoom.generateTemporaryName(normalizedExternalId);
		return Object.assign(new FederatedRoom(), {
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

	public static build(): FederatedRoom {
		return new FederatedRoom();
	}

	public isDirectMessage(): boolean {
		return this.internalReference?.t === RoomType.DIRECT_MESSAGE;
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
		this.internalReference.description = topic;
	}

	public getMembers(): IUser[] {
		return this.isDirectMessage() && this.members && this.members.length > 0 ? this.members.map((user) => user.internalReference) : [];
	}

	public isFederated(): boolean {
		return this.internalReference?.federated === true;
	}
}
