import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

export interface IFederationBridge {
	start(): Promise<void>;
	stop(): Promise<void>;
	onFederationAvailabilityChanged(enabled: boolean): Promise<void>;
	getUserProfileInformation(externalUserId: string): Promise<any>;
	joinRoom(externalRoomId: string, externalUserId: string): Promise<void>;
	createRoom(
		externalCreatorId: string,
		externalInviteeId: string,
		roomType: RoomType,
		roomName: string,
		roomTopic?: string,
	): Promise<string>;
	inviteToRoom(externalRoomId: string, externalInviterId: string, externalInviteeId: string): Promise<void>;
	sendMessage(externalRoomId: string, externaSenderId: string, text: string): Promise<void>;
	createUser(username: string, name: string, domain: string): Promise<string>;
	isUserIdFromTheSameHomeserver(externalUserId: string, domain: string): boolean;
}

export enum EVENT_ORIGIN {
	LOCAL = 'LOCAL',
	REMOTE = 'REMOTE',
}
