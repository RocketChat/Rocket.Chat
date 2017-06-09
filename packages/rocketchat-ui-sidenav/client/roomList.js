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

	shouldAppear(group, rooms) {
		/*
		if is a normal group ('channel' 'private' 'direct')
		or is favorite and has one room
		or is unread and has one room
		*/
		const nonFavorite = group.identifier || group.unread;
		const showNormalRooms = !group.unread || Template.instance().unreadRooms.count();
		return showNormalRooms && nonFavorite || !group.unread && !this.anonymous && rooms.count();
	},
	hasMoreChannelsButton(room) {
		return room.identifier === 'c' || room.anonymous;
	},

	hasMoreGroupsButton(room) {
		return room.identifier === 'p';
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
