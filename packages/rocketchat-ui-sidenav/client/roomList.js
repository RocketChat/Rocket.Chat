Template.roomList.helpers({
	rooms() {
		if (this.unread) {
			return Template.instance().unreadRooms;
		}

		if (this.anonymous) {
			return RocketChat.models.Rooms.find({t: 'c'}, { sort: { name: 1 } });
		}

		const user = Meteor.user();
		const favoritesEnabled = RocketChat.settings.get('Favorite_Rooms');

		const query = {
			open: true
		};

		if (this.identifier) {
			if (this.isCombined) {
				query.t = { $in: ['c', 'p']};
			} else {
				query.t = { $in: [this.identifier] };
			}

			query.f = { $ne: favoritesEnabled };
		} else {
			query.f = favoritesEnabled;
		}

		if (user && user.settings && user.settings.preferences && user.settings.preferences.unreadRoomsMode) {
			query.$or = [
				{ alert: { $ne: true } },
				{ hideUnreadStatus: true }
			];
		}

		return ChatSubscription.find(query, { sort: { 't': 1, 'name': 1 }});
	},

	isActiveFavorite() {
		if (!this.identifier && !this.unread && !this.anonymous) {
			return ChatSubscription.find({ f: true }).count();
		}

		return true;
	},

	isLivechat() {
		return this.identifier === 'l';
	},

	unreadClass(room) {
		let classes = '';

		if (room.unread) {
			const user = Meteor.user();
			classes += 'unread-rooms-mode';

			if ((user && user.settings && user.settings.preferences && user.settings.preferences.unreadRoomsMode) && (Template.instance().unreadRooms.count())) {
				classes += ' has-unread';
			}
		}

		return classes;
	},

	hasMoreChannelsButton(room) {
		return room.identifier === 'c' || room.anonymous;
	},

	hasMoreGroupsButton(room) {
		return room.identifier === 'p';
	},

	roomType(room) {
		if (room.header || room.identifier) {
			return `type-${ room.header || room.identifier }`;
		}
	}
});

Template.roomList.events({
	'click .more'(e, t) {
		if (t.data.identifier === 'p') {
			SideNav.setFlex('listPrivateGroupsFlex');
		} else if (t.data.isCombined) {
			SideNav.setFlex('listCombinedFlex');
		} else {
			SideNav.setFlex('listChannelsFlex');
		}

		return SideNav.openFlex();
	}
});

Template.roomList.onCreated(function() {
	this.autorun(() => {
		const query = {
			alert: true,
			open: true,
			hideUnreadStatus: { $ne: true }
		};

		return this.unreadRooms = ChatSubscription.find(query, { sort: { 't': 1, 'name': 1 }});
	});
});
