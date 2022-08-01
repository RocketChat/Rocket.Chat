import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { IRoom, IUser } from '@rocket.chat/core-typings';

import { FederatedUser } from './FederatedUser';

export const isAnInternalIdentifier = (fromOriginName: string, localOriginName: string): boolean => {
	return fromOriginName === localOriginName;
};

export abstract class AbstractFederatedRoom {
	protected externalId: string;

	protected internalReference: IRoom;

	protected constructor({ externalId, internalReference }: { externalId: string; internalReference: IRoom }) {
		this.externalId = externalId;
		this.internalReference = internalReference;
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
		return this.internalReference._id;
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
		return Object.freeze(this.internalReference);
	}

	public getInternalCreator(): Readonly<Pick<IUser, '_id' | 'username' | 'name'>> {
		return Object.freeze(this.internalReference.u);
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

	public shouldUpdateRoomName(newRoomName: string): boolean {
		return this.internalReference?.name !== newRoomName && !this.isDirectMessage();
	}

	public shouldUpdateRoomTopic(newRoomTopic: string): boolean {
		return this.internalReference?.topic !== newRoomTopic && !this.isDirectMessage();
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
