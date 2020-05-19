import { IRoomTypes, RoomTypesCommon } from '../../lib/RoomTypesCommon';
import { IRoomTypeConfig } from '../../lib/RoomTypeConfig';

interface IRoomTypesServer extends IRoomTypes {
	getSearchableRoomsTypes(): string[];
}

class RoomTypesServer extends RoomTypesCommon implements IRoomTypesServer {
	roomTypes: Map<string, IRoomTypeConfig>;

	constructor() {
		super();
		this.roomTypes = new Map();
	}

	getRoomName(roomType: string, roomData: any): string | undefined {
		return this.roomTypes.get(roomType)?.roomName?.(roomData);
	}

	getSearchableRoomsTypes(): string[] {
		return Array.from(this.roomTypes.entries())
			.filter((roomType) => roomType[1].includeInRoomSearch())
			.map((roomType) => roomType[0]);
	}
}

export const roomTypes: IRoomTypesServer = new RoomTypesServer();
