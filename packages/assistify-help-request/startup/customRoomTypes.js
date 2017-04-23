/* globals openRoom */

/**
 * Help requests need two additional room types
 * @see packages/rocketchat-lib/startup/defaultRoomTypes.js
 */

/**
 * A request is a channel which has a dedicated aim: resolve an issue which
 * is asked by the one who started the request (the owner)
 * Expertise shall join the room (automagically) and help to get it resolved
 */
RocketChat.roomTypes.add('r', 6, { //5 is livechat
	template: 'requests',
	icon: 'icon-help',
	route: {
		name: 'request',
		path: '/request/:name',
		action(params) {
			return openRoom('r', params.name);
		}
	},

	findRoom(identifier) {
		const query = {
			t: 'r',
			name: identifier
		};
		return ChatRoom.findOne(query);
	},

	roomName(roomData) {
		return roomData.name;
	},

	condition() {
		return RocketChat.authz.hasAtLeastOnePermission(['view-c-room', 'view-joined-room']); //todo: own permission
	},

	showJoinLink(roomId) {
		return !!ChatRoom.findOne({ _id: roomId, t: 'r' });
	}
});

/**
 *	An expert group is a private group of people who know something
 *	An expert group is being added to a request-channel on creation based on naming conventions
 */
RocketChat.roomTypes.add('e', 15, { //20 = private messages
	template: 'expertise',
	icon: 'icon-lightbulb',
	route: {
		name: 'expertise',
		path: '/expertise/:name',
		action(params) {
			return openRoom('e', params.name);
		}
	},

	findRoom(identifier) {
		const query = {
			t: 'e',
			name: identifier
		};
		return ChatRoom.findOne(query);
	},

	roomName(roomData) {
		return roomData.name;
	},

	condition() {
		return RocketChat.authz.hasAllPermission('view-p-room'); //todo: Own authorization
	}
});
