import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { ObjectId } from 'mongodb'; // This should not be in the domain layer, but its a known "problem"

import type { FederatedUser } from './FederatedUser';

export const isAnInternalIdentifier = (fromOriginName: string, localOriginName: string): boolean => {
	return fromOriginName === localOriginName;
};

export abstract class AbstractFederatedRoom {
	protected externalId: string;

	protected internalId: string;

	protected internalReference: Partial<IRoom>;

	protected constructor({ externalId, internalReference }: { externalId: string; internalReference: Partial<IRoom> }) {
		this.externalId = externalId;
		this.internalReference = internalReference;
		this.internalId = internalReference._id || new ObjectId().toHexString();
	}

	protected static generateTemporaryName(normalizedExternalId: string): string {
		return `Federation-${normalizedExternalId}`;
	}

	public abstract isDirectMessage(): boolean;

	public getExternalId(): string {
		return this.externalId;
	}

	public getRoomType(): RoomType {
		return this.internalReference.t as RoomType;
	}

	public getInternalId(): string {
		return this.internalId;
	}

	public getName(): string | undefined {
		return this.internalReference.fname || this.internalReference.name;
	}

	public getTopic(): string | undefined {
		return this.internalReference.topic;
	}

	public static isOriginalFromTheProxyServer(fromOriginName: string, proxyServerOriginName: string): boolean {
		return isAnInternalIdentifier(fromOriginName, proxyServerOriginName);
	}

	public getInternalReference(): Readonly<Partial<IRoom>> {
		return Object.freeze({
			...this.internalReference,
			_id: this.internalId,
		});
	}

	public getCreatorUsername(): string | undefined {
		return this.internalReference.u?.username;
	}

	public getCreatorId(): string | undefined {
		return this.internalReference.u?._id;
	}

	public changeRoomType(type: RoomType): void {
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

	public static shouldUpdateMessage(newMessageText: string, originalMessage: IMessage): boolean {
		return originalMessage.msg !== newMessageText;
	}
}

export class FederatedRoom extends AbstractFederatedRoom {
	protected constructor({ externalId, internalReference }: { externalId: string; internalReference: Partial<IRoom> }) {
		super({ externalId, internalReference });
	}

	public static createInstance(
		externalId: string,
		normalizedExternalId: string,
		creator: FederatedUser,
		type: RoomType,
		name?: string,
	): FederatedRoom {
		if (type === RoomType.DIRECT_MESSAGE) {
			throw new Error('For DMs please use the specific class');
		}
		const roomName = name || FederatedRoom.generateTemporaryName(normalizedExternalId);
		return new FederatedRoom({
			externalId,
			internalReference: {
				t: type,
				name: roomName,
				fname: roomName,
				u: creator.getInternalReference(),
			},
		});
	}

	public static createWithInternalReference(externalId: string, internalReference: IRoom): FederatedRoom {
		if (internalReference.t === RoomType.DIRECT_MESSAGE) {
			throw new Error('For DMs please use the specific class');
		}
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
		internalReference: Partial<IRoom>;
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
			},
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

	public getMembersUsernames(): string[] {
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
