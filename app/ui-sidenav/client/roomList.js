import { callbacks } from '../../callbacks';
import { Template } from 'meteor/templating';
import { ChatSubscription, Rooms, Subscriptions } from '../../models';
import { UiTextContext, roomTypes } from '../../utils';

Template.roomList.helpers({
	rooms() {
		/*
			modes:
				sortby activity/alphabetical
				merge channels into one list
				show favorites
				show unread
		*/

		const { user, settings } = this;
		if (this.anonymous) {
			return Rooms.find({ t: 'c' }, { sort: { name: 1 } });
		}

		const sortBy = settings.sidebarSortby || 'alphabetical';
		const query = {
			open: true,
		};

		const sort = {};

		if (sortBy === 'activity') {
			sort.lm = -1;
		} else { // alphabetical
			sort[this.identifier === 'd' && settings.UI_Use_Real_Name ? 'lowerCaseFName' : 'lowerCaseName'] = /descending/.test(sortBy) ? -1 : 1;
		}

		if (this.identifier === 'unread') {
			query.alert = true;
			query.$or = [
				{ hideUnreadStatus: { $ne: true } },
				{ unread: { $gt: 0 } },
			];

			return ChatSubscription.find(query, { sort });
		}

		const favoritesEnabled = !!(settings.Favorite_Rooms && settings.sidebarShowFavorites);

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

			if (['c', 'p'].includes(this.identifier)) {
				query.tokens = { $exists: false };
			} else if (this.identifier === 'tokens' && user && user.services && user.services.tokenpass) {
				query.tokens = { $exists: true };
			}

			// if we display discussions as a separate group, we should hide them from the other lists
			if (settings.sidebarShowDiscussion) {
				query.prid = { $exists: false };
			}

			if (settings.sidebarShowUnread) {
				query.$or = [
					{ alert: { $ne: true } },
					{
						$and: [
							{ hideUnreadStatus: true },
							{ unread: 0 },
						],
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

		return !['unread', 'f'].includes(group.identifier) || (rooms.length || (rooms.count && rooms.count()));
	},

	roomType(room) {
		if (room.header || room.identifier) {
			return `type-${ room.header || room.identifier }`;
		}
	},

	noSubscriptionText() {
		const instance = Template.instance();
		return roomTypes.roomTypes[instance.data.identifier].getUiText(UiTextContext.NO_ROOMS_SUBSCRIBED) || 'No_channels_yet';
	},

	showRoomCounter() {
		const { settings } = Template.instance().data;
		return settings.roomCounterSidebar;
	},
});

const getLowerCaseNames = (room, nameDefault = '', fnameDefault = '') => {
	const name = room.name || nameDefault;
	const fname = room.fname || fnameDefault || name;
	return {
		lowerCaseName: name.toLowerCase(),
		lowerCaseFName: fname.toLowerCase(),
	};
};

const mergeSubRoom = (subscription) => {
	const room = Rooms.findOne(subscription.rid) || { _updatedAt: subscription.ts };
	subscription.lastMessage = room.lastMessage;
	subscription.lm = room._updatedAt;
	subscription.streamingOptions = room.streamingOptions;
	return Object.assign(subscription, getLowerCaseNames(subscription));
};

const mergeRoomSub = (room) => {
	const sub = Subscriptions.findOne({ rid: room._id });
	if (!sub) {
		return room;
	}

	Subscriptions.update({
		rid: room._id,
	}, {
		$set: {
			lastMessage: room.lastMessage,
			lm: room._updatedAt,
			streamingOptions: room.streamingOptions,
			...getLowerCaseNames(room, sub.name, sub.fname),
		},
	});

	return room;
};

callbacks.add('cachedCollection-received-rooms', mergeRoomSub);
callbacks.add('cachedCollection-sync-rooms', mergeRoomSub);
callbacks.add('cachedCollection-loadFromServer-rooms', mergeRoomSub);

callbacks.add('cachedCollection-received-subscriptions', mergeSubRoom);
callbacks.add('cachedCollection-sync-subscriptions', mergeSubRoom);
callbacks.add('cachedCollection-loadFromServer-subscriptions', mergeSubRoom);
