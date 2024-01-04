import type { FederationPaginatedResult, IFederationPublicRooms } from '@rocket.chat/rest-typings';

export interface IFederationService {
	createDirectMessageRoomAndInviteUser(internalInviterId: string, internalRoomId: string, externalInviteeId: string): Promise<void>;

	verifyMatrixIds(matrixIds: string[]): Promise<Map<string, string>>;
}

export interface IFederationJoinExternalPublicRoomInput {
	internalUserId: string;
	externalRoomId: string;
	roomName?: string;
	pageToken?: string;
}

export interface IFederationServiceEE {
	createDirectMessageRoom(internalUserId: string, invitees: string[]): Promise<void>;

	searchPublicRooms(
		serverName?: string,
		roomName?: string,
		pageToken?: string,
		count?: number,
	): Promise<
		FederationPaginatedResult<{
			rooms: IFederationPublicRooms[];
		}>
	>;

	getSearchedServerNamesByInternalUserId(internalUserId: string): Promise<{ name: string; default: boolean; local: boolean }[]>;

	addSearchedServerNameByInternalUserId(internalUserId: string, serverName: string): Promise<void>;

	removeSearchedServerNameByInternalUserId(internalUserId: string, serverName: string): Promise<void>;

	scheduleJoinExternalPublicRoom(internalUserId: string, externalRoomId: string, roomName?: string, pageToken?: string): Promise<void>;

	joinExternalPublicRoom(input: IFederationJoinExternalPublicRoomInput): Promise<void>;

	verifyMatrixIds(matrixIds: string[]): Promise<Map<string, string>>;
}
