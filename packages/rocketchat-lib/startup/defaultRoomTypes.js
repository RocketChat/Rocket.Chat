/* globals openRoom */
RocketChat.roomTypes.add(null, 0, {
	header: 'favorite',
	icon: 'icon-star',
	label: 'Favorites'
});

RocketChat.roomTypes.add('c', 10, {
	icon: 'icon-hash',
	label: 'Channels',
	route: {
		name: 'channel',
		path: '/channel/:name',
		action(params) {
			return openRoom('c', params.name);
		}
	},

	findRoom(identifier) {
		const query = {
			t: 'c',
			name: identifier
		};
		return ChatRoom.findOne(query);
	},

	roomName(roomData) {
		if (RocketChat.settings.get('UI_Allow_room_names_with_special_chars')) {
			return roomData.fname || roomData.name;
		}
		return roomData.name;
	},

	condition() {
		return RocketChat.authz.hasAtLeastOnePermission(['view-c-room', 'view-joined-room']) || RocketChat.settings.get('Accounts_AllowAnonymousRead') === true;
	},

	showJoinLink(roomId) {
		return !!ChatRoom.findOne({ _id: roomId, t: 'c' });
	}
});

RocketChat.roomTypes.add('d', 20, {
	icon: 'icon-at',
	label: 'Direct_Messages',
	route: {
		name: 'direct',
		path: '/direct/:username',
		action(params) {
			return openRoom('d', params.username);
		},
		link(sub) {
			return { username: sub.name };
		}
	},

	findRoom(identifier) {
		const query = {
			t: 'd',
			name: identifier
		};

		const subscription = ChatSubscription.findOne(query);
		if (subscription && subscription.rid) {
			return ChatRoom.findOne(subscription.rid);
		}
	},

	roomName(roomData) {
		const subscription = ChatSubscription.findOne({ rid: roomData._id }, { fields: { name: 1, fname: 1 } });
		if (!subscription) {
			return '';
		}
		if (RocketChat.settings.get('UI_Use_Real_Name') && subscription.fname) {
			return subscription.fname;
		}

		return subscription.name;
	},

	secondaryRoomName(roomData) {
		if (RocketChat.settings.get('UI_Use_Real_Name')) {
			const subscription = ChatSubscription.findOne({ rid: roomData._id }, { fields: { name: 1 } });
			return subscription && subscription.name;
		}
	},

	condition() {
		return RocketChat.authz.hasAtLeastOnePermission(['view-d-room', 'view-joined-room']);
	},

	getUserStatus(roomId) {
		const subscription = RocketChat.models.Subscriptions.findOne({rid: roomId});
		if (subscription == null) { return; }

		return Session.get(`user_${ subscription.name }_status`);
	}
});

RocketChat.roomTypes.add('p', 30, {
	icon: 'icon-lock',
	label: 'Private_Groups',
	route: {
		name: 'group',
		path: '/group/:name',
		action(params) {
			return openRoom('p', params.name);
		}
	},

	findRoom(identifier) {
		const query = {
			t: 'p',
			name: identifier
		};
		return ChatRoom.findOne(query);
	},

	roomName(roomData) {
		if (RocketChat.settings.get('UI_Allow_room_names_with_special_chars')) {
			return roomData.fname || roomData.name;
		}
		return roomData.name;
	},

	condition() {
		return RocketChat.authz.hasAllPermission('view-p-room');
	}
});
