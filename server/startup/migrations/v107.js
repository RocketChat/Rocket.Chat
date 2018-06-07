

RocketChat.Migrations.add({
	version: 107,
	up() {




		RocketChat.models.Users.update({
			'preferences.roomsListExhibitionMode': 'activity'
		}, {
			$unset: {
				'preferences.roomsListExhibitionMode': 1
			},
			$set: {
				'preferences.sidebarSortby': 'activity',
				'preferences.sidebarShowFavorites': true
			}
		});

		RocketChat.models.Users.update({
			'preferences.roomsListExhibitionMode': 'unread'
		}, {
			$unset: {
				'preferences.roomsListExhibitionMode': 1
			},
			$set: {
				'preferences.sidebarSortby': 'alphabetical',
				'preferences.sidebarShowUnread' : true,
				'preferences.sidebarShowFavorites': true
			}
		});

		RocketChat.models.Users.update({
			'preferences.roomsListExhibitionMode': 'category'
		}, {
			$unset: {
				'preferences.roomsListExhibitionMode': 1
			},
			$set: {
				'preferences.sidebarSortby': 'alphabetical',
				'preferences.sidebarShowFavorites': true
			}
		});
	}
});
