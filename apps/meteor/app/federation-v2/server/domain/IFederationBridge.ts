export interface IExternalUserProfileInformation {
	displayName: string;
}

export enum EVENT_ORIGIN {
	LOCAL = 'LOCAL',
	REMOTE = 'REMOTE',
}

export interface IFederationBridge {
	start(): Promise<void>;
	stop(): Promise<void>;
	onFederationAvailabilityChanged(enabled: boolean): Promise<void>;
	getUserProfileInformation(externalUserId: string): Promise<IExternalUserProfileInformation | undefined>;
	joinRoom(externalRoomId: string, externalUserId: string): Promise<void>;
	createDirectMessageRoom(externalCreatorId: string, externalInviteeIds: string[], extraData?: Record<string, any>): Promise<string>;
	inviteToRoom(externalRoomId: string, externalInviterId: string, externalInviteeId: string): Promise<void>;
	sendMessage(externalRoomId: string, externaSenderId: string, text: string): Promise<void>;
	createUser(username: string, name: string, domain: string): Promise<string>;
	isUserIdFromTheSameHomeserver(externalUserId: string, domain: string): boolean;
	extractHomeserverOrigin(externalUserId: string): string;
	isRoomFromTheSameHomeserver(externalRoomId: string, domain: string): boolean;
	leaveRoom(externalRoomId: string, externalUserId: string): Promise<void>;
	kickUserFromRoom(externalRoomId: string, externalUserId: string, externalOwnerId: string): Promise<void>;
	logFederationStartupInfo(info?: string): void;
}
