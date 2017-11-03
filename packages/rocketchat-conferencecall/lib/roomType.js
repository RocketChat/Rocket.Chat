/* globals openRoom */

RocketChat.roomTypes.add('v', 5, {
	icon: 'video',
	label: 'Video Calls',
	route: {
		name: 'conference',
		path: '/conference/:code',
		action(params/*, queryParams*/) {
			openRoom('v', params.code);
		},
		link(sub) {
			return {
				code: sub.code
			};
		}
	},

	findRoom(identifier) {
		return ChatRoom.findOne({ code: identifier });
	},

	roomName(roomData) {
		if (!roomData.name) {
			return roomData.label;
		} else {
			return roomData.name;
		}
	},

	condition() {
		return true;
	},

	canSendMessage(roomId) {
		const room = ChatRoom.findOne({ _id: roomId }, { fields: { open: 1 } });
		return room && room.open === true;
	}
});
