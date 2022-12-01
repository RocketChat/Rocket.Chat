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
    externalRoomName: string;
    normalizedRoomId: string;
}

export class FederationPagination {
	constructor({ count, pageToken }: IFederationPagination) {
		this.count = count;
		this.pageToken = pageToken;
	}

	count?: number;

	pageToken?: string;
}

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
	constructor({ externalRoomId, internalUserId, externalRoomName, normalizedRoomId }: IFederationRoomJoinPublicRoomInputDto) {
		this.externalRoomId = externalRoomId;
		this.internalUserId = internalUserId;
		this.externalRoomName = externalRoomName;
		this.normalizedRoomId = normalizedRoomId;
	}

	externalRoomId: string;

	internalUserId: string;

	externalRoomName: string;

	normalizedRoomId: string;
}