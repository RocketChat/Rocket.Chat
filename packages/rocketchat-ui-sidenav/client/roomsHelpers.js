import { Meteor } from 'meteor/meteor';

function roomType() {
	return RocketChat.roomTypes.getTypes().map((roomType) => ({
		template: roomType.customTemplate || 'roomList',
		data: {
			header: roomType.header,
			identifier: roomType.identifier,
			isCombined: roomType.isCombined,
			label: roomType.label,
		},
	}));
}

function rooms() {
	/*
		modes:
			sortby activity/alphabetical
			merge channels into one list
			show favorites
			show unread
	*/
	if (this.anonymous) {
		return RocketChat.models.Rooms.find({ t: 'c' }, { sort: { name: 1 } });
	}

	const user = RocketChat.models.Users.findOne(Meteor.userId(), {
		fields: {
			'settings.preferences.sidebarSortby': 1,
			'settings.preferences.sidebarShowFavorites': 1,
			'settings.preferences.sidebarShowUnread': 1,
			'services.tokenpass': 1,
		},
	});

	const sortBy = RocketChat.getUserPreference(user, 'sidebarSortby') || 'alphabetical';
	const query = {
		open: true,
	};

	const sort = {};

	if (sortBy === 'activity') {
		sort.lm = -1;
	} else { // alphabetical
		sort[this.identifier === 'd' && RocketChat.settings.get('UI_Use_Real_Name') ? 'lowerCaseFName' : 'lowerCaseName'] = /descending/.test(sortBy) ? -1 : 1;
	}

	if (this.identifier === 'unread') {
		query.alert = true;
		query.hideUnreadStatus = { $ne: true };

		return ChatSubscription.find(query, { sort });
	}

	const favoritesEnabled = !!(RocketChat.settings.get('Favorite_Rooms') && RocketChat.getUserPreference(user, 'sidebarShowFavorites'));

	if (this.identifier === 'f') {
		query.f = favoritesEnabled;
	} else {
		let types = [this.identifier];

		if (this.identifier === 'merged') {
			types = ['c', 'p', 'd'];
		}

		if (this.identifier === 'unread' || this.identifier === 'tokens') {
			types = ['c', 'p'];
		}

		if (['c', 'p'].includes(this.identifier)) {
			query.tokens = { $exists: false };
		} else if (this.identifier === 'tokens' && user && user.services && user.services.tokenpass) {
			query.tokens = { $exists: true };
		}

		if (RocketChat.getUserPreference(user, 'sidebarShowUnread')) {
			query.$or = [
				{ alert: { $ne: true } },
				{ hideUnreadStatus: true },
			];
		}
		query.t = { $in: types };
		if (favoritesEnabled) {
			query.f = { $ne: favoritesEnabled };
		}
	}
	return ChatSubscription.find(query, { sort });
}

export {
	rooms,
	roomType,
};
