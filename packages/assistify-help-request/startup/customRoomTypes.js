/**
 * Help requests need two additional room types
 * @see packages/rocketchat-lib/startup/defaultRoomTypes.js
 */

/**
 * A request is a channel which has a dedicated aim: resolve an issue which
 * is asked by the one who started the request (the owner)
 * Experts shall join the room (automagically) and help to get it resolved
 */
RocketChat.roomTypes.add('r', 0, {
	template: 'requests',
	icon: 'icon-question-circle-o',
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

// /**
//  *
//  */
// RocketChat.roomTypes.add('e', 30, {
// 	template: 'privateGroups',
// 	icon: 'icon-lightbulb',
// 	route: {
// 		name: 'experts',
// 		path: '/experts/:name',
// 		action(params) {
// 			return openRoom('p', params.name);
// 		}
// 	},
//
// 	findRoom(identifier) {
// 		const query = {
// 			t: 'e',
// 			name: identifier
// 		};
// 		return ChatRoom.findOne(query);
// 	},
//
// 	roomName(roomData) {
// 		return roomData.name;
// 	},
//
// 	condition() {
// 		return RocketChat.authz.hasAllPermission('view-p-room'); //todo: Own authorization
// 	}
// });
