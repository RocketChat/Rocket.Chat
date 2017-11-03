/* globals openRoom */

import {RoomTypeConfig, RoomTypeRouteConfig, UiTextContext} from 'meteor/rocketchat:lib';

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
			order: 22,
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
		return roomData.fname || roomData.name;
	}

	condition() {
		return RocketChat.authz.hasAtLeastOnePermission(['view-r-room', 'view-joined-room']);
	}

	showJoinLink(roomId) {
		return !!ChatRoom.findOne({_id: roomId, t: 'r'});
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

	enableMembersListProfile() {
		return true;
	}

	getUiText(context) {
		switch (context) {
			case UiTextContext.CLOSE_WARNING:
				return 'Close_request_warning';
			case UiTextContext.HIDE_WARNING:
				return 'Hide_request_warning';
			case UiTextContext.LEAVE_WARNING:
				return 'Leave_request_warning';
			default:
				return '';
		}
	}
}

