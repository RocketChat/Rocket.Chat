import type { IMessage } from '@rocket.chat/core-typings';

export interface IExternalUserProfileInformation {
	displayName: string;
	avatarUrl?: string;
}

export enum EVENT_ORIGIN {
	LOCAL = 'LOCAL',
	REMOTE = 'REMOTE',
}

interface IRegistrationFileNamespaceRule {
	exclusive: boolean;
	regex: string;
}

interface IRegistrationFileNamespaces {
	users: IRegistrationFileNamespaceRule[];
	rooms: IRegistrationFileNamespaceRule[];
	aliases: IRegistrationFileNamespaceRule[];
}

export interface IFederationBridgeRegistrationFile {
	id: string;
	homeserverToken: string;
	applicationServiceToken: string;
	bridgeUrl: string;
	botName: string;
	listenTo: IRegistrationFileNamespaces;
	enableEphemeralEvents: boolean;
}

export interface IFederationBridge {
	start(): Promise<void>;
	stop(): Promise<void>;
	getUserProfileInformation(externalUserId: string): Promise<IExternalUserProfileInformation | undefined>;
	joinRoom(externalRoomId: string, externalUserId: string, viaServers?: string[]): Promise<void>;
	createDirectMessageRoom(externalCreatorId: string, inviteesExternalIds: string[], extraData?: Record<string, any>): Promise<string>;
	inviteToRoom(externalRoomId: string, externalInviterId: string, externalInviteeId: string): Promise<void>;
	sendMessage(externalRoomId: string, externalSenderId: string, message: IMessage): Promise<string>;
	createUser(username: string, name: string, domain: string, avatarUrl?: string): Promise<string>;
	isUserIdFromTheSameHomeserver(externalUserId: string, domain: string): boolean;
	extractHomeserverOrigin(externalUserId: string): string;
	isRoomFromTheSameHomeserver(externalRoomId: string, domain: string): boolean;
	leaveRoom(externalRoomId: string, externalUserId: string): Promise<void>;
	kickUserFromRoom(externalRoomId: string, externalUserId: string, externalOwnerId: string): Promise<void>;
	logFederationStartupInfo(info?: string): void;
	setUserAvatar(externalUserId: string, avatarUrl: string): Promise<void>;
	getReadStreamForFileFromUrl(externaUserId: string, fileUrl: string): Promise<ReadableStream>;
	redactEvent(externalRoomId: string, externalUserId: string, externalEventId: string): Promise<void>;
	updateMessage(externalRoomId: string, externalUserId: string, externalEventId: string, newMessageText: string): Promise<void>;
	sendMessageReaction(externalRoomId: string, externalUserId: string, externalEventId: string, reaction: string): Promise<string>;
	sendMessageFileToRoom(
		externalRoomId: string,
		externaSenderId: string,
		content: Buffer,
		fileDetails: { filename: string; fileSize: number; mimeType: string; metadata?: { width?: number; height?: number; format?: string } },
	): Promise<string>;
	uploadContent(externalSenderId: string, content: Buffer, options?: { name?: string; type?: string }): Promise<string | undefined>;
	convertMatrixUrlToHttp(externalUserId: string, matrixUrl: string): string;
	sendReplyToMessage(
		externalRoomId: string,
		externalUserId: string,
		eventToReplyTo: string,
		eventOriginalSender: string,
		message: string,
	): Promise<string>;
	sendReplyMessageFileToRoom(
		externalRoomId: string,
		externaSenderId: string,
		content: Buffer,
		fileDetails: { filename: string; fileSize: number; mimeType: string; metadata?: { width?: number; height?: number; format?: string } },
		eventToReplyTo: string,
	): Promise<string>;
	notifyUserTyping(externalRoomId: string, externalUserId: string, isTyping: boolean): Promise<void>;
	setUserDisplayName(externalUserId: string, displayName: string): Promise<void>;
	setRoomPowerLevels(externalRoomId: string, externalOwnerId: string, externalUserId: string, powerLevels: number): Promise<void>;
	getRoomHistoricalJoinEvents(externalRoomId: string, externalUserId: string, excludingUserIds?: string[]): Promise<any[]>;
	getRoomName(externalRoomId: string, externalUserId: string): Promise<string | undefined>;
	getRoomTopic(externalRoomId: string, externalUserId: string): Promise<string | undefined>;
	setRoomName(externalRoomId: string, externalUserId: string, roomName: string): Promise<void>;
	setRoomTopic(externalRoomId: string, externalUserId: string, roomTopic: string): Promise<void>;
	verifyInviteeIds(matrixIds: string[]): Promise<Map<string, string>>;
	getRoomData(
		externalUserId: string,
		externalRoomId: string,
	): Promise<{ creator: { id: string; username: string }; name: string; joinedMembers: string[] } | undefined>;
}
