import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { callbacks } from '../../../lib/callbacks';
import { UiTextContext } from '../../../definition/IRoomTypeConfig';
import { ChatSubscription, Rooms, Users, Subscriptions } from '../../models';
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
				'services.tokenpass': 1,
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

			if (['c', 'p'].includes(this.identifier)) {
				query.tokens = { $exists: false };
			} else if (this.identifier === 'tokens' && user && user.services && user.services.tokenpass) {
				query.tokens = { $exists: true };
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

const getLowerCaseNames = (room, nameDefault = '', fnameDefault = '') => {
	const name = room.name || nameDefault;
	const fname = room.fname || fnameDefault || name;
	return {
		lowerCaseName: String(name).toLowerCase(),
		lowerCaseFName: String(fname).toLowerCase(),
	};
};

const mergeSubRoom = (subscription) => {
	const options = {
		fields: {
			lm: 1,
			lastMessage: 1,
			uids: 1,
			streamingOptions: 1,
			usernames: 1,
			topic: 1,
			encrypted: 1,
			jitsiTimeout: 1,
			// autoTranslate: 1,
			// autoTranslateLanguage: 1,
			description: 1,
			announcement: 1,
			broadcast: 1,
			archived: 1,
			avatarETag: 1,
			retention: 1,
			teamId: 1,
			teamMain: 1,
			msgs: 1,
			onHold: 1,
			metrics: 1,
			muted: 1,
			servedBy: 1,
			ts: 1,
			waitingResponse: 1,
			v: 1,
			transcriptRequest: 1,
			tags: 1,
			closedAt: 1,
			responseBy: 1,
			priorityId: 1,
			livechatData: 1,
			departmentId: 1,
			source: 1,
			queuedAt: 1,
			bridged: 1,
		},
	};

	const room = Rooms.findOne({ _id: subscription.rid }, options) || {};

	const lastRoomUpdate = room.lm || subscription.ts || subscription._updatedAt;

	const {
		encrypted,
		description,
		cl,
		topic,
		announcement,
		broadcast,
		archived,
		avatarETag,
		retention,
		lastMessage,
		streamingOptions,
		teamId,
		teamMain,
		uids,
		usernames,
		jitsiTimeout,

		v,
		transcriptRequest,
		servedBy,
		onHold,
		tags,
		closedAt,
		metrics,
		muted,
		waitingResponse,
		responseBy,
		priorityId,
		livechatData,
		departmentId,
		ts,
		source,
		queuedAt,
		bridged,
	} = room;

	subscription.lm = subscription.lr ? new Date(Math.max(subscription.lr, lastRoomUpdate)) : lastRoomUpdate;

	return Object.assign(subscription, getLowerCaseNames(subscription), {
		encrypted,
		description,
		cl,
		topic,
		announcement,
		broadcast,
		archived,
		avatarETag,
		retention,
		lastMessage,
		streamingOptions,
		teamId,
		teamMain,
		uids,
		usernames,
		jitsiTimeout,

		v,
		transcriptRequest,
		servedBy,
		onHold,
		tags,
		closedAt,
		metrics,
		muted,
		waitingResponse,
		responseBy,
		priorityId,
		livechatData,
		departmentId,
		ts,
		source,
		queuedAt,
		bridged,
	});
};

const mergeRoomSub = (room) => {
	const sub = Subscriptions.findOne({ rid: room._id });
	if (!sub) {
		return room;
	}

	const {
		encrypted,
		description,
		cl,
		topic,
		announcement,
		broadcast,
		archived,
		avatarETag,
		retention,
		lastMessage,
		streamingOptions,
		teamId,
		teamMain,
		uids,
		usernames,
		jitsiTimeout,

		v,
		transcriptRequest,
		servedBy,
		onHold,
		tags,
		closedAt,
		metrics,
		muted,
		waitingResponse,
		responseBy,
		priorityId,
		livechatData,
		departmentId,
		ts,
		source,
		queuedAt,
		bridged,
	} = room;

	Subscriptions.update(
		{
			rid: room._id,
		},
		{
			$set: {
				encrypted,
				description,
				cl,
				topic,
				announcement,
				broadcast,
				archived,
				avatarETag,
				retention,
				uids,
				usernames,
				lastMessage,
				streamingOptions,
				teamId,
				teamMain,
				v,
				transcriptRequest,
				servedBy,
				onHold,
				tags,
				closedAt,
				metrics,
				muted,
				waitingResponse,
				responseBy,
				priorityId,
				livechatData,
				departmentId,
				jitsiTimeout,
				ts,
				source,
				queuedAt,
				bridged,
				...getLowerCaseNames(room, sub.name, sub.fname),
			},
		},
	);

	Subscriptions.update(
		{
			rid: room._id,
			lm: { $lt: room.lm },
		},
		{
			$set: {
				lm: room.lm,
			},
		},
	);

	return room;
};

callbacks.add('cachedCollection-received-rooms', mergeRoomSub);
callbacks.add('cachedCollection-sync-rooms', mergeRoomSub);
callbacks.add('cachedCollection-loadFromServer-rooms', mergeRoomSub);

callbacks.add('cachedCollection-received-subscriptions', mergeSubRoom);
callbacks.add('cachedCollection-sync-subscriptions', mergeSubRoom);
callbacks.add('cachedCollection-loadFromServer-subscriptions', mergeSubRoom);
