import { Meteor } from 'meteor/meteor';

import { IRoomTypes, RoomTypesCommon } from '../../lib/RoomTypesCommon';
import { IRoomTypeConfig } from '../../lib/RoomTypeConfig';

interface IRoomTypesServer extends IRoomTypes {
	setRoomFind(roomType: string, callback: Function): void;
	getRoomFind(roomType: string): Function | undefined;
	getRoomName(roomType: string, roomData: any): string;
}

interface IRoomTypeConfigServer extends IRoomTypeConfig {
	roomFind?: Function;
}

class RoomTypesServer extends RoomTypesCommon implements IRoomTypesServer {
	roomTypes: { [key: string]: IRoomTypeConfigServer };

	constructor() {
		super();
		this.roomTypes = {};
	}

	setRoomFind(roomType: string, callback: Function): void {
		if (this.roomTypes[roomType] && this.roomTypes[roomType].roomFind != null) {
			throw new Meteor.Error('room-find-exists', 'Room find for the given type already exists');
		}
		if (this.roomTypes[roomType] == null) {
			this.roomTypes[roomType] = {} as IRoomTypeConfig;
		}
		this.roomTypes[roomType].roomFind = callback;
	}

	getRoomFind(roomType: string): Function | undefined {
		return this.roomTypes[roomType] && this.roomTypes[roomType].roomFind;
	}

	getRoomName(roomType: string, roomData: any): string {
		return this.roomTypes[roomType] && this.roomTypes[roomType].roomName && this.roomTypes[roomType].roomName(roomData);
	}
}

export const roomTypes: IRoomTypesServer = new RoomTypesServer();
