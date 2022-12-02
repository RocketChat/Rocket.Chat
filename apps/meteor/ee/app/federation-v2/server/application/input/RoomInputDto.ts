export interface IFederationPagination {
	count?: number;
	pageToken?: string;
}

export interface IFederationRoomSearchPublicRoomsInputDto extends IFederationPagination {
	serverName: string;
	roomName?: string;
}

export interface IFederationRoomJoinPublicRoomInputDto {
	externalRoomId: string;
	internalUserId: string;
	normalizedRoomId: string;
	externalRoomHomeServerName: string;
}

export class FederationPagination {
	constructor({ count, pageToken }: IFederationPagination) {
		this.count = count;
		this.pageToken = pageToken;
	}

	count?: number;

	pageToken?: string;
}
export const isAValidExternalRoomIdFormat = (externalRoomId: string): boolean =>
	Boolean(externalRoomId && externalRoomId.charAt(0) === '!' && externalRoomId.includes(':'));

export class FederationSearchPublicRoomsInputDto extends FederationPagination {
	constructor({ serverName, roomName, count, pageToken }: IFederationRoomSearchPublicRoomsInputDto) {
		super({ count, pageToken });
		this.serverName = serverName;
		this.roomName = roomName;
	}

	serverName: string;

	roomName?: string;
}

export class FederationJoinPublicRoomInputDto {
	constructor({ externalRoomId, internalUserId, normalizedRoomId, externalRoomHomeServerName }: IFederationRoomJoinPublicRoomInputDto) {
		this.validateExternalRoomId(externalRoomId);
		this.externalRoomId = externalRoomId;
		this.internalUserId = internalUserId;
		this.normalizedRoomId = normalizedRoomId;
		this.externalRoomHomeServerName = externalRoomHomeServerName;
	}

	externalRoomId: string;

	normalizedRoomId: string;

	externalRoomHomeServerName: string;

	internalUserId: string;

	private validateExternalRoomId(externalRoomId: string): void {
		if (!isAValidExternalRoomIdFormat(externalRoomId)) {
			throw new Error('Invalid external room id format');
		}
	}
}
