import { Migrations } from '../../../app/migrations';
import { Users } from '../../../app/models';

Migrations.add({
	version: 120,
	up() {
		Users.update({
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

		Users.update({
			'settings.preferences.roomsListExhibitionMode': 'unread',
		}, {
			$unset: {
				'settings.preferences.roomsListExhibitionMode': 1,
			},
			$set: {
				'settings.preferences.sidebarSortby': 'alphabetical',
				'settings.preferences.sidebarShowUnread': true,
				'settings.preferences.sidebarShowFavorites': true,
			},
		});

		Users.update({
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
