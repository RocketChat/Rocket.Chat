import type { IRoom, IUser, RoomMemberActions, ValueOf } from '@rocket.chat/core-typings';
import type { FederationPaginatedResult, IFederationPublicRooms } from '@rocket.chat/rest-typings';

export interface IFederationJoinExternalPublicRoomInput {
	internalUserId: string;
	externalRoomId: string;
	roomName?: string;
	pageToken?: string;
}

export interface IFederationStatistics {
	enabled: boolean;
	maximumSizeOfPublicRoomsUsers: number;
	biggestRoom: {
		_id: string;
		name: string;
		usersCount: number;
	} | null;
	smallestRoom: {
		_id: string;
		name: string;
		usersCount: number;
	} | null;
	amountOfExternalUsers: number;
	amountOfFederatedRooms: number;
	externalConnectedServers: { quantity: number; servers: string[] };
}

export interface IFederationService {
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

	runFederationChecksBeforeAddUserToRoom(
		params: { user: Pick<IUser, '_id' | 'username'> | string; inviter?: Pick<IUser, '_id' | 'username'> },
		room: IRoom,
	): Promise<void>;

	runFederationChecksBeforeCreateDirectMessageRoom(members: (string | IUser)[]): Promise<void>;

	createDirectMessageRoomAndInviteUser(internalInviterId: string, internalRoomId: string, externalInviteeId: string): Promise<void>;

	actionAllowed(room: IRoom, action: ValueOf<typeof RoomMemberActions>, userId?: IUser['_id']): Promise<boolean>;

	verifyMatrixIds(matrixIds: string[]): Promise<Map<string, string>>;
}
