export interface IFederationBridge {
	start(): Promise<void>;
	stop(): Promise<void>;
	onFederationAvailabilityChanged(enabled: boolean): Promise<void>;
	getUserProfileInformation(externalUserId: string): Promise<any>;
	joinRoom(externalRoomId: string, externalUserId: string): Promise<void>;
	createDirectMessageRoom(externalCreatorId: string, externalInviteeIds: string[]): Promise<string>;
	inviteToRoom(externalRoomId: string, externalInviterId: string, externalInviteeId: string): Promise<void>;
	sendMessage(externalRoomId: string, externaSenderId: string, text: string): Promise<void>;
	createUser(username: string, name: string, domain: string): Promise<string>;
	isUserIdFromTheSameHomeserver(externalUserId: string, domain: string): boolean;
	isRoomFromTheSameHomeserver(externalRoomId: string, domain: string): boolean;
	leaveRoom(externalRoomId: string, externalUserId: string): Promise<void>;
	kickUserFromRoom(externalRoomId: string, externalUserId: string, externalOwnerId: string): Promise<void>;
}

export enum EVENT_ORIGIN {
	LOCAL = 'LOCAL',
	REMOTE = 'REMOTE',
}
