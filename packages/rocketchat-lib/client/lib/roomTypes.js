import _ from 'underscore';

import { RoomTypesCommon } from '../../lib/RoomTypesCommon';

RocketChat.roomTypes = new class RocketChatRoomTypes extends RoomTypesCommon {
	checkCondition(roomType) {
		return roomType.condition == null || roomType.condition();
	}
	getTypes() {
		return _.sortBy(this.roomTypesOrder, 'order').map((type) => this.roomTypes[type.identifier]).filter(type => !type.condition || type.condition());
	}
	getIcon(roomType) {
		return this.roomTypes[roomType] && this.roomTypes[roomType].icon;
	}
	getRoomName(roomType, roomData) {
		return this.roomTypes[roomType] && this.roomTypes[roomType].roomName && this.roomTypes[roomType].roomName(roomData);
	}
	getSecondaryRoomName(roomType, roomData) {
		return this.roomTypes[roomType] && typeof this.roomTypes[roomType].secondaryRoomName === 'function' && this.roomTypes[roomType].secondaryRoomName(roomData);
	}
	getIdentifiers(e) {
		const except = [].concat(e);
		const list = _.reject(this.roomTypesOrder, (t) => except.indexOf(t.identifier) !== -1);
		return _.map(list, (t) => t.identifier);
	}
	getUserStatus(roomType, roomId) {
		return this.roomTypes[roomType] && typeof this.roomTypes[roomType].getUserStatus === 'function' && this.roomTypes[roomType].getUserStatus(roomId);
	}
	getUserStatusText(roomType, roomId) {
		if (this.roomTypes[roomType] && typeof this.roomTypes[roomType].getUserStatusText === 'function') {
			return this.roomTypes[roomType].getUserStatusText(roomId);
		}

		return this.getUserStatus(roomType, roomId);
	}
	findRoom(roomType, identifier, user) {
		return this.roomTypes[roomType] && this.roomTypes[roomType].findRoom(identifier, user);
	}
	canSendMessage(roomId) {
		return ChatSubscription.find({
			rid: roomId
		}).count() > 0;
	}
	readOnly(roomId, user) {
		const fields = {
			ro: 1
		};
		if (user) {
			fields.muted = 1;
		}
		const room = ChatRoom.findOne({
			_id: roomId
		}, {
			fields
		});
		if (!user) {
			return room && room.ro;
		}
		/* globals RoomRoles */
		const userOwner = RoomRoles.findOne({
			rid: roomId,
			'u._id': user._id,
			roles: 'owner'
		}, {
			fields: {
				_id: 1
			}
		});
		return room && (room.ro === true && Array.isArray(room.muted) && room.muted.indexOf(user.username) !== -1 && !userOwner);
	}
	archived(roomId) {
		const fields = {
			archived: 1
		};
		const room = ChatRoom.findOne({
			_id: roomId
		}, {
			fields
		});
		return room && room.archived === true;
	}
	verifyCanSendMessage(roomId) {
		const room = ChatRoom.findOne({	_id: roomId }, { fields: { t: 1 }});

		if (!room || !room.t) {
			return;
		}

		const roomType = room.t;
		if (this.roomTypes[roomType] && this.roomTypes[roomType].canSendMessage) {
			return this.roomTypes[roomType].canSendMessage(roomId);
		}
		return this.canSendMessage(roomId);
	}
	verifyShowJoinLink(roomId) {
		const room = ChatRoom.findOne({
			_id: roomId
		}, {
			fields: {
				t: 1
			}
		});
		if (!room || !room.t) {
			return;
		}
		const roomType = room.t;
		if (this.roomTypes[roomType] && !this.roomTypes[roomType].showJoinLink) {
			return false;
		}
		return this.roomTypes[roomType].showJoinLink(roomId);
	}
	getNotSubscribedTpl(roomId) {
		const room = ChatRoom.findOne({ _id: roomId }, { fields: { t: 1 }});
		if (!room || !room.t) {
			return;
		}
		const roomType = room.t;
		if (this.roomTypes[roomType] && !this.roomTypes[roomType].notSubscribedTpl) {
			return false;
		}
		return this.roomTypes[roomType].notSubscribedTpl;
	}
};
