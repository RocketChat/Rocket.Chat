import { IRoomTypesCommon, RoomTypesCommon } from '../../lib/RoomTypesCommon';

interface IRoomTypesServer extends IRoomTypesCommon {
	getSearchableRoomsTypes(): string[];
}

class RoomTypesServer extends RoomTypesCommon implements IRoomTypesServer {
	public constructor() {
		super();
	}

	getSearchableRoomsTypes(): string[] {
		return Array.from(this.roomTypes.entries())
			.filter((roomType) => roomType[1].includeInRoomSearch())
			.map((roomType) => roomType[0]);
	}
}

export const roomTypes: IRoomTypesServer = new RoomTypesServer();
