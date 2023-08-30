interface IFederationPagination {
	count?: number;
	pageToken?: string;
}

interface IFederationRoomSearchPublicRoomsInputDto extends IFederationPagination {
	serverName?: string;
	roomName?: string;
}

interface IFederationRoomJoinExternalPublicRoomInputDto {
	externalRoomId: string;
	internalUserId: string;
	normalizedRoomId: string;
	externalRoomHomeServerName: string;
	roomName?: string;
	pageToken?: string;
}

interface IFederationRoomJoinInternalPublicRoomInputDto {
	internalRoomId: string;
	internalUserId: string;
}

class FederationPagination {
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

	serverName?: string;

	roomName?: string;
}

export class FederationJoinExternalPublicRoomInputDto {
	constructor({
		externalRoomId,
		internalUserId,
		normalizedRoomId,
		externalRoomHomeServerName,
		roomName,
		pageToken,
	}: IFederationRoomJoinExternalPublicRoomInputDto) {
		this.validateExternalRoomId(externalRoomId);
		this.externalRoomId = externalRoomId;
		this.internalUserId = internalUserId;
		this.normalizedRoomId = normalizedRoomId;
		this.externalRoomHomeServerName = externalRoomHomeServerName;
		this.roomName = roomName;
		this.pageToken = pageToken;
	}

	externalRoomId: string;

	normalizedRoomId: string;

	externalRoomHomeServerName: string;

	internalUserId: string;

	roomName?: string;

	pageToken?: string;

	private validateExternalRoomId(externalRoomId: string): void {
		if (!isAValidExternalRoomIdFormat(externalRoomId)) {
			throw new Error('Invalid external room id format');
		}
	}
}

export class FederationJoinInternalPublicRoomInputDto {
	constructor({ internalRoomId, internalUserId }: IFederationRoomJoinInternalPublicRoomInputDto) {
		this.internalRoomId = internalRoomId;
		this.internalUserId = internalUserId;
	}

	internalRoomId: string;

	internalUserId: string;
}
