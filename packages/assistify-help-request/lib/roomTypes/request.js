/* globals openRoom */

import {RoomTypeConfig, RoomTypeRouteConfig} from 'meteor/rocketchat:lib';

class RequestRoomRoute extends RoomTypeRouteConfig {
	constructor() {
		super({
			name: 'request',
			path: '/request/:name'
		});
	}

	action(params) {
		return openRoom('r', params.name);
	}
}

export class RequestRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 'r',
			order: 6,
			template: 'requests',
			icon: 'question',
			label: 'Requests',
			route: new RequestRoomRoute()
		});

		this.creationLabel = 'New_request';
		this.creationTemplate = 'AssistifyCreateRequest';
	}

	findRoom(identifier) {
		const query = {
			t: 'r',
			name: identifier
		};
		return ChatRoom.findOne(query);
	}

	roomName(roomData) {
		return roomData.name;
	}

	condition() {
		return RocketChat.authz.hasAtLeastOnePermission(['view-c-room', 'view-joined-room']); //todo: own permission
	}

	showJoinLink(roomId) {
		return !!ChatRoom.findOne({_id: roomId, t: 'r'});
	}

	canBeDeleted(room) {
		return RocketChat.authz.hasPermission(Meteor.userId(), 'delete-c', room._id);
	}

	includeInRoomSearch() {
		return true;
	}

	isGroupChat() {
		return true;
	}

	canAddUser() {
		return true;
	}

	userDetailShowAll() {
		return true;
	}

	userDetailShowAdmin() {
		return true;
	}
}

