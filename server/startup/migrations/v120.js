RocketChat.Migrations.add({
	version: 120,
	up() {
		RocketChat.models.Users.update({
			'settings.preferences.roomsListExhibitionMode': 'activity',
		}, {
			$unset: {
				'settings.preferences.roomsListExhibitionMode': 1,
			},
			$set: {
				'settings.preferences.sidebarSortby': 'activity',
				'settings.preferences.sidebarShowFavorites': true,
			},
		});

		RocketChat.models.Users.update({
			'settings.preferences.roomsListExhibitionMode': 'unread',
		}, {
			$unset: {
				'settings.preferences.roomsListExhibitionMode': 1,
			},
			$set: {
				'settings.preferences.sidebarSortby': 'alphabetical',
				'settings.preferences.sidebarShowUnread' : true,
				'settings.preferences.sidebarShowFavorites': true,
			},
		});

		RocketChat.models.Users.update({
			'settings.preferences.roomsListExhibitionMode': 'category',
		}, {
			$unset: {
				'settings.preferences.roomsListExhibitionMode': 1,
			},
			$set: {
				'settings.preferences.sidebarSortby': 'alphabetical',
				'settings.preferences.sidebarShowFavorites': true,
			},
		});
	},
});
