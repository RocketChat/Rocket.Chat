import { FlowRouter } from 'meteor/kadira:flow-router';
import _ from 'underscore';

import { RoomTypesCommon } from '../../lib/RoomTypesCommon';
import { ChatRoom, ChatSubscription, RoomRoles } from '../../../models';

export const roomTypes = new class RocketChatRoomTypes extends RoomTypesCommon {
	checkCondition(roomType) {
		return roomType.condition == null || roomType.condition();
	}

	getTypes() {
		return _.sortBy(this.roomTypesOrder, 'order').map((type) => this.roomTypes[type.identifier]).filter((type) => !type.condition || type.condition());
	}

	getIcon(roomData) {
		if (!roomData || !roomData.t || !this.roomTypes[roomData.t]) {
			return;
		}
		return (this.roomTypes[roomData.t].getIcon && this.roomTypes[roomData.t].getIcon(roomData)) || this.roomTypes[roomData.t].icon;
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

	getUserStatus(roomType, rid) {
		return this.roomTypes[roomType] && typeof this.roomTypes[roomType].getUserStatus === 'function' && this.roomTypes[roomType].getUserStatus(rid);
	}

	getRoomType(roomId) {
		const fields = {
			t: 1,
		};
		const room = ChatRoom.findOne({
			_id: roomId,
		}, {
			fields,
		});
		return room && room.t;
	}

	getUserStatusText(roomType, rid) {
		return this.roomTypes[roomType] && typeof this.roomTypes[roomType].getUserStatusText === 'function' && this.roomTypes[roomType].getUserStatusText(rid);
	}

	findRoom(roomType, identifier, user) {
		return this.roomTypes[roomType] && this.roomTypes[roomType].findRoom(identifier, user);
	}

	canSendMessage(rid) {
		return ChatSubscription.find({ rid }).count() > 0;
	}

	readOnly(rid, user) {
		const fields = {
			ro: 1,
			t: 1,
		};
		if (user) {
			fields.muted = 1;
		}
		const room = ChatRoom.findOne({
			_id: rid,
		}, {
			fields,
		});

		const roomType = room && room.t;
		if (roomType && this.roomTypes[roomType] && this.roomTypes[roomType].readOnly) {
			return this.roomTypes[roomType].readOnly(rid, user);
		}

		if (!user) {
			return room && room.ro;
		}
		const userOwner = RoomRoles.findOne({
			rid,
			'u._id': user._id,
			roles: 'owner',
		}, {
			fields: {
				_id: 1,
			},
		});
		return room && (room.ro === true && Array.isArray(room.muted) && room.muted.indexOf(user.username) !== -1 && !userOwner);
	}

	archived(rid) {
		const room = ChatRoom.findOne({ _id: rid }, { fields: { archived: 1 } });
		return room && room.archived === true;
	}

	verifyCanSendMessage(rid) {
		const room = ChatRoom.findOne({	_id: rid }, { fields: { t: 1 } });

		if (!room || !room.t) {
			return;
		}

		const roomType = room.t;
		if (this.roomTypes[roomType] && this.roomTypes[roomType].canSendMessage) {
			return this.roomTypes[roomType].canSendMessage(rid);
		}
		return this.canSendMessage(rid);
	}

	verifyShowJoinLink(rid) {
		const room = ChatRoom.findOne({ _id: rid, t: { $exists: true, $ne: null } }, { fields: { t: 1 } });
		if (!room || !room.t) {
			return;
		}
		const roomType = room.t;
		if (this.roomTypes[roomType] && !this.roomTypes[roomType].showJoinLink) {
			return false;
		}
		return this.roomTypes[roomType].showJoinLink(rid);
	}

	getNotSubscribedTpl(rid) {
		const room = ChatRoom.findOne({ _id: rid, t: { $exists: true, $ne: null } }, { fields: { t: 1 } });
		if (!room || !room.t) {
			return;
		}
		const roomType = room.t;
		if (this.roomTypes[roomType] && !this.roomTypes[roomType].notSubscribedTpl) {
			return false;
		}
		return this.roomTypes[roomType].notSubscribedTpl;
	}

	getReadOnlyTpl(rid) {
		const room = ChatRoom.findOne({ _id: rid, t: { $exists: true, $ne: null } }, { fields: { t: 1 } });
		if (!room || !room.t) {
			return;
		}
		const roomType = room.t;
		return this.roomTypes[roomType] && this.roomTypes[roomType].readOnlyTpl;
	}

	openRouteLink(roomType, subData, queryParams) {
		if (!this.roomTypes[roomType]) {
			return false;
		}

		let routeData = {};
		if (this.roomTypes[roomType] && this.roomTypes[roomType].route && this.roomTypes[roomType].route.link) {
			routeData = this.roomTypes[roomType].route.link(subData);
		} else if (subData && subData.name) {
			routeData = {
				name: subData.name,
			};
		}

		return FlowRouter.go(this.roomTypes[roomType].route.name, routeData, queryParams);
	}
}();
