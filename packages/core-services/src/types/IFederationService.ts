import type { FederationPaginatedResult, IFederationPublicRooms } from '@rocket.chat/rest-typings';

export type FederationConfigurationStatus = {
	appservice: {
		error?: string;
		ok: boolean;
		roundTrip: {
			durationMs: number;
		};
	};

	externalReachability: {
		error?: string;
		ok: boolean;
	};
};

interface IFederationBaseService {
	verifyMatrixIds(matrixIds: string[]): Promise<Map<string, string>>;

	configurationStatus(): Promise<FederationConfigurationStatus>;

	markConfigurationValid(): Promise<void>;

	markConfigurationInvalid(): Promise<void>;
}

export interface IFederationService extends IFederationBaseService {
	createDirectMessageRoomAndInviteUser(internalInviterId: string, internalRoomId: string, externalInviteeId: string): Promise<void>;
}

export interface IFederationJoinExternalPublicRoomInput {
	internalUserId: string;
	externalRoomId: string;
	roomName?: string;
	pageToken?: string;
}

export interface IFederationServiceEE extends IFederationBaseService {
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
