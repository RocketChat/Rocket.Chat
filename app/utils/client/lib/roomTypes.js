import { FlowRouter } from 'meteor/kadira:flow-router';
import { RoomTypesCommon } from '../../lib/RoomTypesCommon';
import { ChatRoom, ChatSubscription, RoomRoles } from '/app/models';
import { hasAtLeastOnePermission } from '/app/authorization';
import _ from 'underscore';

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
	getUserStatus(roomType, roomId) {
		return this.roomTypes[roomType] && typeof this.roomTypes[roomType].getUserStatus === 'function' && this.roomTypes[roomType].getUserStatus(roomId);
	}
	findRoom(roomType, identifier, user) {
		return this.roomTypes[roomType] && this.roomTypes[roomType].findRoom(identifier, user);
	}
	canSendMessage(roomId) {
		return ChatSubscription.find({
			rid: roomId,
		}).count() > 0;
	}
	readOnly(roomId, user) {
		const fields = {
			ro: 1,
		};
		if (user) {
			fields.muted = 1;
		}
		const room = ChatRoom.findOne({
			_id: roomId,
		}, {
			fields,
		});
		if (!user) {
			return room && room.ro;
		}
		const userOwner = RoomRoles.findOne({
			rid: roomId,
			'u._id': user._id,
			roles: 'owner',
		}, {
			fields: {
				_id: 1,
			},
		});

		if (userOwner) {
			return false;
		}

		if (room) {
			if (Array.isArray(room.muted) && room.muted.indexOf(user.username) !== -1) {
				return true;
			}

			return (room.ro === true && !hasAtLeastOnePermission('post-readonly'));
		} else {
			return false;
		}
	}
	archived(roomId) {
		const fields = {
			archived: 1,
		};
		const room = ChatRoom.findOne({
			_id: roomId,
		}, {
			fields,
		});
		return room && room.archived === true;
	}
	verifyCanSendMessage(roomId) {
		const room = ChatRoom.findOne({	_id: roomId }, { fields: { t: 1 } });

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
			_id: roomId,
		}, {
			fields: {
				t: 1,
			},
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
		const room = ChatRoom.findOne({ _id: roomId }, { fields: { t: 1 } });
		if (!room || !room.t) {
			return;
		}
		const roomType = room.t;
		if (this.roomTypes[roomType] && !this.roomTypes[roomType].notSubscribedTpl) {
			return false;
		}
		return this.roomTypes[roomType].notSubscribedTpl;
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
};
