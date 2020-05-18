import { Meteor } from 'meteor/meteor';

import { IRoomTypes, RoomTypesCommon } from '../../lib/RoomTypesCommon';
import { IRoomTypeConfig } from '../../lib/RoomTypeConfig';

interface IRoomTypesServer extends IRoomTypes {
	setRoomFind(roomType: string, callback: Function): void;
	getRoomFind(roomType: string): Function | undefined;
	getRoomName(roomType: string, roomData: any): string | undefined;
}

interface IRoomTypeConfigServer extends IRoomTypeConfig {
	roomFind?: Function;
}

class RoomTypesServer extends RoomTypesCommon implements IRoomTypesServer {
	roomTypes: Map<string, IRoomTypeConfigServer>;

	constructor() {
		super();
		this.roomTypes = new Map();
	}

	setRoomFind(roomType: string, callback: Function): void {
		if (this.roomTypes.get(roomType)?.roomFind) {
			throw new Meteor.Error('room-find-exists', 'Room find for the given type already exists');
		}
		if (!this.roomTypes.has(roomType)) {
			this.roomTypes.set(roomType, {} as IRoomTypeConfigServer);
		}
		const type: any = this.roomTypes.get(roomType);
		type.roomFind = callback;
		this.roomTypes.set(roomType, type as IRoomTypeConfigServer);
	}

	getRoomFind(roomType: string): Function | undefined {
		return this.roomTypes.get(roomType)?.roomFind;
	}

	getRoomName(roomType: string, roomData: any): string | undefined {
		return this.roomTypes.get(roomType)?.roomName?.(roomData);
	}
}

export const roomTypes: IRoomTypesServer = new RoomTypesServer();
