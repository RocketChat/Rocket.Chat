/* globals RocketChat */
import _ from 'underscore';

import { UiTextContext } from 'meteor/rocketchat:lib';

Template.roomList.helpers({
	rooms() {
		if (this.identifier === 'unread') {
			const query = {
				alert: true,
				open: true,
				hideUnreadStatus: {$ne: true}
			};
			return ChatSubscription.find(query, {sort: {'t': 1, 'name': 1}});
		}

		if (this.anonymous) {
			return RocketChat.models.Rooms.find({t: 'c'}, {sort: {name: 1}});
		}

		const favoritesEnabled = RocketChat.settings.get('Favorite_Rooms');

		const query = {
			open: true
		};
		const sort = { 't': 1 };
		if (this.identifier === 'd' && RocketChat.settings.get('UI_Use_Real_Name')) {
			sort.fname = 1;
		} else {
			sort.name = 1;
		}
		if (this.identifier === 'f') {
			query.f = favoritesEnabled;
		} else {
			let types = [this.identifier];
			const user = Meteor.user();

			if (this.identifier === 'activity') {
				types = ['c', 'p', 'd'];
			}

			if (this.identifier === 'channels' || this.identifier === 'unread' || this.identifier === 'tokens') {
				types = ['c', 'p'];
			}

			if (this.identifier === 'tokens' && user && user.services && user.services.tokenpass) {
				query.tokens = { $exists: true };
			} else if (this.identifier === 'c' || this.identifier === 'p') {
				query.tokens = { $exists: false };
			}

			if (user && user.settings && user.settings.preferences && user.settings.preferences.roomsListExhibitionMode === 'unread') {
				query.$or = [
					{alert: {$ne: true}},
					{hideUnreadStatus: true}
				];
			}
			query.t = {$in: types};
			query.f = {$ne: favoritesEnabled};
		}
		if (this.identifier === 'activity') {
			const list = ChatSubscription.find(query).fetch().map(sub => {
				const lm = RocketChat.models.Rooms.findOne(sub.rid, {fields: {_updatedAt: 1}})._updatedAt;
				return {
					lm: lm && lm.toISOString(),
					...sub
				};
			});
			return _.sortBy(list, 'lm').reverse();
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

		return !['unread', 'f'].includes(group.identifier) || rooms.count();
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
		const user = Meteor.user();
		return user && user.settings && user.settings.preferences && user.settings.preferences.roomCounterSidebar;
	}
});

// Template.roomList.onRendered(function() {
// 	$(this.firstNode.parentElement).perfectScrollbar();
// });

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
