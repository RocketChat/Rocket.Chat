/* globals openRoom */
RocketChat.roomTypes.add('unread', 10, {
	unread: true,
	condition() {
		const user = Meteor.user();
		const preferences = (user && user.settings && user.settings.preferences && user.settings.preferences) || {};
		return preferences.roomsListExhibitionMode === 'unread';
	},
	label: 'Unread'
});

RocketChat.roomTypes.add('f', 20, {
	header: 'favorite',
	icon: 'star',
	label: 'Favorites'
});

// activity
RocketChat.roomTypes.add('activity', 30, {
	condition() {
		const user = Meteor.user();
		const preferences = (user && user.settings && user.settings.preferences && user.settings.preferences) || {};
		return preferences.roomsListExhibitionMode === 'activity';
	},
	label: 'Conversations'
});

RocketChat.roomTypes.add('channels', 30, {
	label: 'Channels',
	condition() {
		const user = Meteor.user();
		const preferences = (user && user.settings && user.settings.preferences && user.settings.preferences) || {};
		return ['unread', 'category'].includes(preferences.roomsListExhibitionMode) && preferences.mergeChannels;
	}
});
// public
RocketChat.roomTypes.add('c', 30, {
	icon: 'hashtag',
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
		const user = Meteor.user();
		const preferences = (user && user.settings && user.settings.preferences && user.settings.preferences) || {};
		return !preferences.roomsListExhibitionMode || ['unread', 'category'].includes(preferences.roomsListExhibitionMode) && !preferences.mergeChannels && (RocketChat.authz.hasAtLeastOnePermission(['view-c-room', 'view-joined-room']) || RocketChat.settings.get('Accounts_AllowAnonymousRead') === true);
	},

	showJoinLink(roomId) {
		return !!ChatRoom.findOne({ _id: roomId, t: 'c' });
	}
});

// private
RocketChat.roomTypes.add('p', 40, {
	icon: 'lock',
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
		const user = Meteor.user();
		const preferences = (user && user.settings && user.settings.preferences && user.settings.preferences) || {};
		return !preferences.roomsListExhibitionMode || ['unread', 'category'].includes(preferences.roomsListExhibitionMode) && !preferences.mergeChannels && RocketChat.authz.hasAllPermission('view-p-room');
	}
});


// direct
RocketChat.roomTypes.add('d', 50, {
	icon: false,
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
		const user = Meteor.user();
		const preferences = (user && user.settings && user.settings.preferences && user.settings.preferences) || {};
		return !preferences.roomsListExhibitionMode || ['unread', 'category'].includes(preferences.roomsListExhibitionMode) && RocketChat.authz.hasAtLeastOnePermission(['view-d-room', 'view-joined-room']);
	},

	getUserStatus(roomId) {
		const subscription = RocketChat.models.Subscriptions.findOne({rid: roomId});
		if (subscription == null) { return; }

		return Session.get(`user_${ subscription.name }_status`);
	}
});
