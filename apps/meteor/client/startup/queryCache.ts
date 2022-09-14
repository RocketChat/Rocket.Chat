import { IOmnichannelRoom, IRoom, IRoomWithRetentionPolicy, ISubscription, IUser } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import { Rooms, Subscriptions, Users } from '../../app/models/client';
import { callbacks } from '../../lib/callbacks';
import { SubscriptionWithRoom } from '../definitions/SubscriptionWithRoom';
import { queryClient } from '../lib/queryClient';

const getLowerCaseNames = (
	room: Pick<IRoom, 'name' | 'fname' | 'prid'>,
	nameDefault = '',
	fnameDefault = '',
): {
	lowerCaseName: string;
	lowerCaseFName: string;
} => {
	const name = room.name || nameDefault;
	const fname = room.fname || fnameDefault || name;
	return {
		lowerCaseName: String(!room.prid ? name : fname).toLowerCase(),
		lowerCaseFName: String(fname).toLowerCase(),
	};
};

const mergeSubRoom = (subscription: ISubscription): SubscriptionWithRoom => {
	const options = {
		fields: {
			lm: 1,
			lastMessage: 1,
			uids: 1,
			streamingOptions: 1,
			usernames: 1,
			usersCount: 1,
			topic: 1,
			encrypted: 1,
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
			federated: 1,
		},
	};

	const room = (Rooms as Mongo.Collection<IRoom>).findOne({ _id: subscription.rid }, options);

	const lastRoomUpdate = room?.lm || subscription.ts || subscription._updatedAt;

	return {
		...subscription,
		...getLowerCaseNames(subscription),
		encrypted: room?.encrypted,
		description: room?.description,
		cl: room?.cl,
		topic: room?.topic,
		announcement: room?.announcement,
		broadcast: room?.broadcast,
		archived: room?.archived,
		avatarETag: room?.avatarETag,
		retention: (room as IRoomWithRetentionPolicy | undefined)?.retention,
		lastMessage: room?.lastMessage,
		streamingOptions: room?.streamingOptions,
		teamId: room?.teamId,
		teamMain: room?.teamMain,
		uids: room?.uids,
		usernames: room?.usernames,
		usersCount: room?.usersCount ?? 0,
		v: (room as IOmnichannelRoom | undefined)?.v,
		transcriptRequest: (room as IOmnichannelRoom | undefined)?.transcriptRequest,
		servedBy: (room as IOmnichannelRoom | undefined)?.servedBy,
		onHold: (room as IOmnichannelRoom | undefined)?.onHold,
		tags: (room as IOmnichannelRoom | undefined)?.tags,
		closedAt: (room as IOmnichannelRoom | undefined)?.closedAt,
		metrics: (room as IOmnichannelRoom | undefined)?.metrics,
		muted: room?.muted,
		waitingResponse: (room as IOmnichannelRoom | undefined)?.waitingResponse,
		responseBy: (room as IOmnichannelRoom | undefined)?.responseBy,
		priorityId: (room as IOmnichannelRoom | undefined)?.priorityId,
		livechatData: (room as IOmnichannelRoom | undefined)?.livechatData,
		departmentId: (room as IOmnichannelRoom | undefined)?.departmentId,
		ts: room?.ts ?? subscription.ts,
		source: (room as IOmnichannelRoom).source, // TODO: unsafe access
		queuedAt: (room as IOmnichannelRoom | undefined)?.queuedAt,
		federated: room?.federated,
		lm: subscription.lr ? new Date(Math.max(subscription.lr.getTime(), lastRoomUpdate.getTime())) : lastRoomUpdate,
	};
};

const mergeRoomSub = (room: IRoom): IRoom => {
	const sub = (Subscriptions as Mongo.Collection<ISubscription>).findOne({ rid: room._id });
	if (!sub) {
		return room;
	}

	(Subscriptions as Mongo.Collection<ISubscription>).update(
		{
			rid: room._id,
		},
		{
			$set: {
				encrypted: room.encrypted,
				description: room.description,
				cl: room.cl,
				topic: room.topic,
				announcement: room.announcement,
				broadcast: room.broadcast,
				archived: room.archived,
				avatarETag: room.avatarETag,
				retention: (room as IRoomWithRetentionPolicy | undefined)?.retention,
				uids: room.uids,
				usernames: room.usernames,
				usersCount: room.usersCount,
				lastMessage: room.lastMessage,
				streamingOptions: room.streamingOptions,
				teamId: room.teamId,
				teamMain: room.teamMain,
				v: (room as IOmnichannelRoom | undefined)?.v,
				transcriptRequest: (room as IOmnichannelRoom | undefined)?.transcriptRequest,
				servedBy: (room as IOmnichannelRoom | undefined)?.servedBy,
				onHold: (room as IOmnichannelRoom | undefined)?.onHold,
				tags: (room as IOmnichannelRoom | undefined)?.tags,
				closedAt: (room as IOmnichannelRoom | undefined)?.closedAt,
				metrics: (room as IOmnichannelRoom | undefined)?.metrics,
				muted: room.muted,
				waitingResponse: (room as IOmnichannelRoom | undefined)?.waitingResponse,
				responseBy: (room as IOmnichannelRoom | undefined)?.responseBy,
				priorityId: (room as IOmnichannelRoom | undefined)?.priorityId,
				livechatData: (room as IOmnichannelRoom | undefined)?.livechatData,
				departmentId: (room as IOmnichannelRoom | undefined)?.departmentId,
				ts: room.ts,
				source: (room as IOmnichannelRoom).source, // TODO: unsafe access
				queuedAt: (room as IOmnichannelRoom | undefined)?.queuedAt,
				federated: room.federated,
				...getLowerCaseNames(room, sub.name, sub.fname),
			},
		},
	);

	(Subscriptions as Mongo.Collection<ISubscription>).update(
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

const updateQueryCache = (_uid: IUser['_id'] | null): void => {
	Tracker.autorun(() => {
		queryClient.removeQueries(['users']);

		const users = (Users as Mongo.Collection<IUser>).find().fetch();

		queryClient.setQueryData(['users'], users);
		for (const user of users) {
			queryClient.setQueryData(['users', user._id], user);
		}
	});

	Tracker.autorun(() => {
		queryClient.removeQueries(['rooms']);

		const rooms = (Rooms as Mongo.Collection<IRoom>).find().fetch();

		queryClient.setQueryData(['rooms'], rooms);
		for (const room of rooms) {
			queryClient.setQueryData(['rooms', room._id], room);
		}
	});

	Tracker.autorun(() => {
		queryClient.removeQueries(['subscriptions']);

		const subscriptions = (Subscriptions as Mongo.Collection<ISubscription>).find().fetch();

		queryClient.setQueryData(['subscriptions'], subscriptions);
		for (const subscription of subscriptions) {
			queryClient.setQueryData(['subscriptions', subscription._id], subscription);
			if (subscription.rid) queryClient.setQueryData(['subscriptions', { rid: subscription.rid }], subscription);
		}
	});
};

Meteor.startup(() => {
	Tracker.autorun(() => {
		const uid = Meteor.userId();
		updateQueryCache(uid);
	});
});
