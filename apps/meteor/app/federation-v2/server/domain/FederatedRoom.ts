import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { IRoom } from '@rocket.chat/core-typings';
import { ObjectId } from 'mongodb'; // This should not be in the domain layer, but its a known "problem"

import { FederatedUser } from './FederatedUser';

export const isAnInternalIdentifier = (fromOriginName: string, localOriginName: string): boolean => {
	return fromOriginName === localOriginName;
};

export abstract class AbstractFederatedRoom {
	protected externalId: string;

	protected internalId: string;

	protected internalReference: IRoom;

	protected constructor({ externalId, internalReference }: { externalId: string; internalReference: IRoom }) {
		this.externalId = externalId;
		this.internalReference = internalReference;
		this.internalId = internalReference._id || new ObjectId().toHexString();
	}

	protected static generateTemporaryName(normalizedExternalId: string): string {
		return `Federation-${normalizedExternalId}`;
	}

	public abstract isDirectMessage(): boolean;

	public getMembersUsernames(): string[] {
		return this.internalReference?.usernames || [];
	}

	public getExternalId(): string {
		return this.externalId;
	}

	public getRoomType(): RoomType {
		return this.internalReference.t as RoomType;
	}

	public getInternalId(): string {
		return this.internalId;
	}

	public getInternalName(): string | undefined {
		return this.internalReference.name;
	}

	public getInternalTopic(): string | undefined {
		return this.internalReference.topic;
	}

	public static isAnInternalRoom(fromOriginName: string, localOriginName: string): boolean {
		return isAnInternalIdentifier(fromOriginName, localOriginName);
	}

	public getInternalReference(): Readonly<IRoom> {
		return Object.freeze({
			...this.internalReference,
			_id: this.internalId,
		});
	}

	public getCreatorInternalUsername(): string | undefined {
		return this.internalReference.u.username;
	}

	public getCreatorInternalId(): string {
		return this.internalReference.u._id;
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

	public shouldUpdateRoomName(aRoomName: string): boolean {
		return this.internalReference?.name !== aRoomName && !this.isDirectMessage();
	}

	public shouldUpdateRoomTopic(aRoomTopic: string): boolean {
		return this.internalReference?.topic !== aRoomTopic && !this.isDirectMessage();
	}
}

export class FederatedRoom extends AbstractFederatedRoom {
	protected constructor({ externalId, internalReference }: { externalId: string; internalReference: IRoom }) {
		super({ externalId, internalReference });
	}

	public static createInstance(
		externalId: string,
		normalizedExternalId: string,
		creator: FederatedUser,
		type: RoomType,
		name?: string,
	): FederatedRoom {
		const roomName = name || FederatedRoom.generateTemporaryName(normalizedExternalId);
		return new FederatedRoom({
			externalId,
			internalReference: {
				t: type,
				name: roomName,
				fname: roomName,
				u: creator.getInternalReference(),
			} as unknown as IRoom,
		});
	}

	public static createWithInternalReference(externalId: string, internalReference: IRoom): FederatedRoom {
		return new FederatedRoom({
			externalId,
			internalReference,
		});
	}

	public isDirectMessage(): boolean {
		return false;
	}
}

export class DirectMessageFederatedRoom extends AbstractFederatedRoom {
	public members: FederatedUser[];

	protected constructor({
		externalId,
		internalReference,
		members,
	}: {
		externalId: string;
		internalReference: IRoom;
		members: FederatedUser[];
	}) {
		super({ externalId, internalReference });
		this.members = members;
	}

	public static createInstance(externalId: string, creator: FederatedUser, members: FederatedUser[]): DirectMessageFederatedRoom {
		return new DirectMessageFederatedRoom({
			externalId,
			members,
			internalReference: {
				t: RoomType.DIRECT_MESSAGE,
				u: creator.getInternalReference(),
			} as unknown as IRoom,
		});
	}

	public static createWithInternalReference(
		externalId: string,
		internalReference: IRoom,
		members: FederatedUser[],
	): DirectMessageFederatedRoom {
		return new DirectMessageFederatedRoom({
			externalId,
			internalReference,
			members,
		});
	}

	public getInternalMembersUsernames(): string[] {
		return this.members.map((user) => user.getUsername() || '').filter(Boolean);
	}

	public getMembers(): FederatedUser[] {
		return this.members;
	}

	public addMember(member: FederatedUser): void {
		this.members.push(member);
	}

	public isDirectMessage(): boolean {
		return true;
	}

	public isUserPartOfTheRoom(federatedUser: FederatedUser): boolean {
		if (!federatedUser.getUsername()) {
			return false;
		}
		if (!this.internalReference?.usernames) {
			return false;
		}
		return this.internalReference.usernames.includes(federatedUser.getUsername() as string);
	}
}
