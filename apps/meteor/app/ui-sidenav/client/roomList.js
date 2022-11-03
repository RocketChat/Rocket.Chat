import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { UiTextContext } from '../../../definition/IRoomTypeConfig';
import { ChatSubscription, Rooms, Users } from '../../models/client';
import { getUserPreference } from '../../utils';
import { settings } from '../../settings';
import { roomCoordinator } from '../../../client/lib/rooms/roomCoordinator';

Template.roomList.helpers({
	rooms() {
		/*
			modes:
				sortby activity/alphabetical
				merge channels into one list
				show favorites
				show unread
		*/
		if (this.anonymous) {
			return Rooms.find({ t: 'c' }, { sort: { name: 1 } });
		}

		const user = Users.findOne(Meteor.userId(), {
			fields: {
				'settings.preferences.sidebarSortby': 1,
				'settings.preferences.sidebarShowFavorites': 1,
				'settings.preferences.sidebarShowUnread': 1,
				'messageViewMode': 1,
			},
		});

		const sortBy = getUserPreference(user, 'sidebarSortby') || 'activity';
		const query = {
			open: true,
		};

		const sort = {};

		if (sortBy === 'activity') {
			sort.lm = -1;
		} else {
			// alphabetical
			sort[this.identifier === 'd' && settings.get('UI_Use_Real_Name') ? 'lowerCaseFName' : 'lowerCaseName'] = /descending/.test(sortBy)
				? -1
				: 1;
		}

		if (this.identifier === 'unread') {
			query.alert = true;
			query.$or = [{ hideUnreadStatus: { $ne: true } }, { unread: { $gt: 0 } }];

			return ChatSubscription.find(query, { sort });
		}

		const favoritesEnabled = !!(settings.get('Favorite_Rooms') && getUserPreference(user, 'sidebarShowFavorites'));

		if (this.identifier === 'f') {
			query.f = favoritesEnabled;
		} else {
			let types = [this.identifier];

			if (this.identifier === 'merged') {
				types = ['c', 'p', 'd'];
			}

			if (this.identifier === 'discussion') {
				types = ['c', 'p', 'd'];
				query.prid = { $exists: true };
			}

			if (this.identifier === 'tokens') {
				types = ['c', 'p'];
			}

			if (getUserPreference(user, 'sidebarShowUnread')) {
				query.$or = [
					{ alert: { $ne: true } },
					{
						$and: [{ hideUnreadStatus: true }, { unread: 0 }],
					},
				];
			}
			query.t = { $in: types };
			if (favoritesEnabled) {
				query.f = { $ne: favoritesEnabled };
			}
		}
		return ChatSubscription.find(query, { sort });
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

		return !['unread', 'f'].includes(group.identifier) || rooms.length || (rooms.count && rooms.count());
	},

	roomType(room) {
		if (room.header || room.identifier) {
			return `type-${room.header || room.identifier}`;
		}
	},

	noSubscriptionText() {
		const instance = Template.instance();
		if (instance.data.anonymous) {
			return 'No_channels_yet';
		}
		return roomCoordinator.getRoomDirectives(instance.data.identifier)?.getUiText(UiTextContext.NO_ROOMS_SUBSCRIBED) || 'No_channels_yet';
	},
});
