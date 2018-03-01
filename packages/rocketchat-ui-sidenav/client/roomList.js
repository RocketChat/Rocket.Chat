/* globals RocketChat */
import { UiTextContext } from 'meteor/rocketchat:lib';
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
			return RocketChat.models.Rooms.find({t: 'c'}, {sort: {name: 1}});
		}
		const user = Meteor.userId();
		const sortBy = RocketChat.getUserPreference(user, 'sidebarSortby') || 'alphabetical';
		const query = {
			open: true
		};

		const sort = {};

		if (sortBy === 'activity') {
			sort.lm = -1;
		} else { // alphabetical
			sort[this.identifier === 'd' && RocketChat.settings.get('UI_Use_Real_Name') ? 'fname' : 'name'] = /descending/.test(sortBy) ? -1 : 1;
		}

		if (this.identifier === 'unread') {
			query.alert = true;
			query.hideUnreadStatus = {$ne: true};

			return ChatSubscription.find(query, {sort});
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
					{alert: {$ne: true}},
					{hideUnreadStatus: true}
				];
			}
			query.t = {$in: types};
			if (favoritesEnabled) {
				query.f = {$ne: favoritesEnabled};
			}
		}
		return ChatSubscription.find(query, {sort});
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

		return !['unread', 'f'].includes(group.identifier) || (rooms.length || rooms.count && rooms.count());
	},

	roomType(room) {
		if (room.header || room.identifier) {
			return `type-${ room.header || room.identifier }`;
		}
	},

	noSubscriptionText() {
		const instance = Template.instance();
		const roomType = (instance.data.header || instance.data.identifier);
		return RocketChat.roomTypes.roomTypes[roomType].getUiText(UiTextContext.NO_ROOMS_SUBSCRIBED) || 'No_channels_yet';
	},

	showRoomCounter() {
		return RocketChat.getUserPreference(Meteor.userId(), 'roomCounterSidebar');
	}
});

RocketChat.Notifications['onUser']('rooms-changed', (t, room) => {
	const $set = {lastMessage : room.lastMessage, lm: room._updatedAt};
	RocketChat.models.Subscriptions.update({ rid: room._id }, {$set});
});

const mergeSubRoom = (record/*, t*/) => {
	const room = Tracker.nonreactive(() => RocketChat.models.Rooms.findOne({ _id: record.rid }));
	if (!room) {
		return record;
	}
	record.lastMessage = room.lastMessage;
	record.lm = room._updatedAt;
	return record;
};

RocketChat.callbacks.add('cachedCollection-received-subscriptions', mergeSubRoom);
RocketChat.callbacks.add('cachedCollection-sync-subscriptions', mergeSubRoom);
RocketChat.callbacks.add('cachedCollection-loadFromServer-subscriptions', mergeSubRoom);
