/* globals RocketChat */
import { Meteor } from 'meteor/meteor';
import { UiTextContext } from 'meteor/rocketchat:lib';
import { Template } from 'meteor/templating';
import { rooms } from './roomsHelpers';

Template.roomList.helpers({
	rooms,

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
		return RocketChat.roomTypes.roomTypes[instance.data.identifier].getUiText(UiTextContext.NO_ROOMS_SUBSCRIBED) || 'No_channels_yet';
	},

	showRoomCounter() {
		return RocketChat.getUserPreference(Meteor.userId(), 'roomCounterSidebar');
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
	const room = RocketChat.models.Rooms.findOne(subscription.rid) || { _updatedAt: subscription.ts };
	subscription.lastMessage = room.lastMessage;
	subscription.lm = room._updatedAt;
	subscription.streamingOptions = room.streamingOptions;
	return Object.assign(subscription, getLowerCaseNames(subscription));
};

const mergeRoomSub = (room) => {
	const sub = RocketChat.models.Subscriptions.findOne({ rid: room._id });
	if (!sub) {
		return room;
	}

	RocketChat.models.Subscriptions.update({
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

RocketChat.callbacks.add('cachedCollection-received-rooms', mergeRoomSub);
RocketChat.callbacks.add('cachedCollection-sync-rooms', mergeRoomSub);
RocketChat.callbacks.add('cachedCollection-loadFromServer-rooms', mergeRoomSub);

RocketChat.callbacks.add('cachedCollection-received-subscriptions', mergeSubRoom);
RocketChat.callbacks.add('cachedCollection-sync-subscriptions', mergeSubRoom);
RocketChat.callbacks.add('cachedCollection-loadFromServer-subscriptions', mergeSubRoom);
