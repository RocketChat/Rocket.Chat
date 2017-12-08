import { RoomTypesCommon } from '../../lib/RoomTypesCommon';

RocketChat.roomTypes = new class roomTypesServer extends RoomTypesCommon {
	/**
	 * Add a publish for a room type
	 *
	 * @param {string} roomType room type (e.g.: c (for channels), d (for direct channels))
	 * @param {function} callback function that will return the publish's data
	*/
	setPublish(roomType, callback) {
		if (this.roomTypes[roomType] && this.roomTypes[roomType].publish != null) {
			throw new Meteor.Error('route-publish-exists', 'Publish for the given type already exists');
		}
		if (this.roomTypes[roomType] == null) {
			this.roomTypes[roomType] = {};
		}
		return this.roomTypes[roomType].publish = callback;
	}

	setRoomFind(roomType, callback) {
		if (this.roomTypes[roomType] && this.roomTypes[roomType].roomFind != null) {
			throw new Meteor.Error('room-find-exists', 'Room find for the given type already exists');
		}
		if (this.roomTypes[roomType] == null) {
			this.roomTypes[roomType] = {};
		}
		return this.roomTypes[roomType].roomFind = callback;
	}

	getRoomFind(roomType) {
		return this.roomTypes[roomType] && this.roomTypes[roomType].roomFind;
	}


	/**
	 * Run the publish for a room type
	 *
	 * @param scope Meteor publish scope
	 * @param {string} roomType room type (e.g.: c (for channels), d (for direct channels))
	 * @param identifier identifier of the room
	*/
	runPublish(scope, roomType, identifier) {
		return this.roomTypes[roomType] && this.roomTypes[roomType].publish && this.roomTypes[roomType].publish.call(scope, identifier);
	}

};
