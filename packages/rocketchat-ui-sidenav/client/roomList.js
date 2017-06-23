Template.roomList.helpers({
	rooms() {
		if (this.identifier == 'unread') {
			const query = {
				alert: true,
				open: true,
				hideUnreadStatus: { $ne: true }
			};
			return ChatSubscription.find(query, { sort: { 't': 1, 'name': 1 }});
		}

		if (this.anonymous) {
			return RocketChat.models.Rooms.find({t: 'c'}, { sort: { name: 1 } });
		}


		const favoritesEnabled = RocketChat.settings.get('Favorite_Rooms');

		const query = {
			open: true
		};
		let sort = { 't': 1, 'name': 1 };
		if (this.identifier === 'f') {
			query.f = favoritesEnabled;
		} else {
			let types = [this.identifier];
			if (this.identifier === 'activity') {
				types = ['c', 'p', 'd'];
				sort = { _updatedAt : -1};
			}
			if (this.identifier === 'channels' || this.identifier === 'unread') {
				types= [ 'c', 'p'];
			}
			const user = Meteor.user();
			if (user && user.settings && user.settings.preferences && user.settings.preferences.roomsListExhibitionMode === 'unread') {
				query.$or = [
					{ alert: { $ne: true } },
					{ hideUnreadStatus: true }
				];
			}
			query.t = { $in: types };
			query.f = { $ne: favoritesEnabled };
		}



		return ChatSubscription.find(query, { sort });
	},

	roomData(room) {
		return {
			...room,
			icon: RocketChat.roomTypes.getIcon(room.t),
			route: RocketChat.roomTypes.getRouteLink(room.t, room)
		};
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

		return !['unread', 'f'].includes(group.identifier) || rooms.count();
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
