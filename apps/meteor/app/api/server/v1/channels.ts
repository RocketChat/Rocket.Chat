import { Meteor } from 'meteor/meteor';
import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import {
	isChannelsAddAllProps,
	isChannelsArchiveProps,
	isChannelsHistoryProps,
	isChannelsUnarchiveProps,
	isChannelsRolesProps,
	isChannelsJoinProps,
	isChannelsKickProps,
	isChannelsLeaveProps,
	isChannelsMessagesProps,
	isChannelsOpenProps,
	isChannelsSetAnnouncementProps,
	isChannelsGetAllUserMentionsByChannelProps,
	isChannelsModeratorsProps,
	isChannelsConvertToTeamProps,
	isChannelsSetReadOnlyProps,
	isChannelsDeleteProps,
} from '@rocket.chat/rest-typings';

import { Rooms, Subscriptions, Messages } from '../../../models/server';
import { hasPermission, hasAllPermission } from '../../../authorization/server';
import { normalizeMessagesForUser } from '../../../utils/server/lib/normalizeMessagesForUser';
import { API } from '../api';
import { Team } from '../../../../server/sdk';

// Returns the channel IF found otherwise it will return the failure of why it didn't. Check the `statusCode` property
function findChannelByIdOrName({
	params,
	checkedArchived = true,
	userId,
}: {
	params:
		| {
				roomId: string;
		  }
		| {
				roomName: string;
		  };
	userId?: string;
	checkedArchived?: boolean;
}): IRoom {
	const fields = { ...API.v1.defaultFieldsToExclude };

	const room: IRoom = 'roomId' in params ? Rooms.findOneById(params.roomId, { fields }) : Rooms.findOneByName(params.roomName, { fields });

	if (!room || (room.t !== 'c' && room.t !== 'l')) {
		throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any channel');
	}

	if (checkedArchived && room.archived) {
		throw new Meteor.Error('error-room-archived', `The channel, ${room.name}, is archived`);
	}
	if (userId && room.lastMessage) {
		const [lastMessage] = normalizeMessagesForUser([room.lastMessage], userId);
		room.lastMessage = lastMessage;
	}

	return room;
}

API.v1.addRoute(
	'channels.addAll',
	{
		authRequired: true,
		validateParams: isChannelsAddAllProps,
	},
	{
		post() {
			const { activeUsersOnly, ...params } = this.bodyParams;
			const findResult = findChannelByIdOrName({ params, userId: this.userId });

			Meteor.call('addAllUserToRoom', findResult._id, activeUsersOnly);

			return API.v1.success({
				channel: findChannelByIdOrName({ params, userId: this.userId }),
			});
		},
	},
);

API.v1.addRoute(
	'channels.archive',
	{
		authRequired: true,
		validateParams: isChannelsArchiveProps,
	},
	{
		post() {
			const findResult = findChannelByIdOrName({ params: this.bodyParams });

			Meteor.call('archiveRoom', findResult._id);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'channels.unarchive',
	{
		authRequired: true,
		validateParams: isChannelsUnarchiveProps,
	},
	{
		post() {
			const findResult = findChannelByIdOrName({
				params: this.bodyParams,
				checkedArchived: false,
			});

			if (!findResult.archived) {
				return API.v1.failure(`The channel, ${findResult.name}, is not archived`);
			}

			Meteor.call('unarchiveRoom', findResult._id);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'channels.history',
	{
		authRequired: true,
		validateParams: isChannelsHistoryProps,
	},
	{
		get() {
			const { roomId, unreads, oldest, latest, showThreadMessages, inclusive } = this.queryParams;
			const findResult = findChannelByIdOrName({
				params: { roomId },
				checkedArchived: false,
			});

			const { count = 20, offset = 0 } = this.getPaginationItems();

			const result = Meteor.call('getChannelHistory', {
				rid: findResult._id,
				latest: latest ? new Date(latest) : new Date(),
				oldest: oldest && new Date(oldest),
				inclusive: inclusive === 'true',
				offset,
				count,
				unreads: unreads === 'true',
				showThreadMessages: showThreadMessages === 'true',
			});

			if (!result) {
				return API.v1.unauthorized();
			}

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'channels.roles',
	{
		authRequired: true,
		validateParams: isChannelsRolesProps,
	},
	{
		get() {
			const findResult = findChannelByIdOrName({ params: this.queryParams });

			const roles = Meteor.call('getRoomRoles', findResult._id);

			return API.v1.success({
				roles,
			});
		},
	},
);

API.v1.addRoute(
	'channels.join',
	{
		authRequired: true,
		validateParams: isChannelsJoinProps,
	},
	{
		post() {
			const { roomId, joinCode } = this.bodyParams;
			const findResult = findChannelByIdOrName({ params: { roomId } });

			Meteor.call('joinRoom', findResult._id, joinCode);

			return API.v1.success({
				channel: findChannelByIdOrName({ params: { roomId }, userId: this.userId }),
			});
		},
	},
);

API.v1.addRoute(
	'channels.kick',
	{
		authRequired: true,
		validateParams: isChannelsKickProps,
	},
	{
		post() {
			const { roomId /* userId */ } = this.bodyParams;
			const findResult = findChannelByIdOrName({ params: { roomId } });

			const user = this.getUserFromParams();

			Meteor.call('removeUserFromRoom', { rid: findResult._id, username: user.username });

			return API.v1.success({
				channel: findChannelByIdOrName({ params: { roomId }, userId: this.userId }),
			});
		},
	},
);

API.v1.addRoute(
	'channels.leave',
	{
		authRequired: true,
		validateParams: isChannelsLeaveProps,
	},
	{
		post() {
			const { roomId } = this.bodyParams;
			const findResult = findChannelByIdOrName({ params: { roomId } });

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('leaveRoom', findResult._id);
			});

			return API.v1.success({
				channel: findChannelByIdOrName({ params: { roomId }, userId: this.userId }),
			});
		},
	},
);

API.v1.addRoute(
	'channels.messages',
	{
		authRequired: true,
		validateParams: isChannelsMessagesProps,
	},
	{
		get() {
			const { roomId } = this.queryParams;
			const findResult = findChannelByIdOrName({
				params: { roomId },
				checkedArchived: false,
			});
			const { offset, count } = this.getPaginationItems();
			const { sort, fields, query } = this.parseJsonQuery();

			const ourQuery = { ...query, rid: findResult._id };

			// Special check for the permissions
			if (
				hasPermission(this.userId, 'view-joined-room') &&
				!Subscriptions.findOneByRoomIdAndUserId(findResult._id, this.userId, { fields: { _id: 1 } })
			) {
				return API.v1.unauthorized();
			}
			if (!hasPermission(this.userId, 'view-c-room')) {
				return API.v1.unauthorized();
			}

			const cursor = Messages.find(ourQuery, {
				sort: sort || { ts: -1 },
				skip: offset,
				limit: count,
				fields,
			});

			const total = cursor.count();
			const messages = cursor.fetch();

			return API.v1.success({
				messages: normalizeMessagesForUser(messages, this.userId),
				count: messages.length,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'channels.open',
	{
		authRequired: true,
		validateParams: isChannelsOpenProps,
	},
	{
		post() {
			const { roomId } = this.bodyParams;

			const findResult = findChannelByIdOrName({
				params: { roomId },
				checkedArchived: false,
			});

			const sub = Subscriptions.findOneByRoomIdAndUserId(findResult._id, this.userId);

			if (!sub) {
				return API.v1.failure(`The user/callee is not in the channel "${findResult.name}".`);
			}

			if (sub.open) {
				return API.v1.failure(`The channel, ${findResult.name}, is already open to the sender`);
			}

			Meteor.call('openRoom', findResult._id);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'channels.setReadOnly',
	{
		authRequired: true,
		validateParams: isChannelsSetReadOnlyProps,
	},
	{
		post() {
			const { roomId } = this.bodyParams;

			const findResult = findChannelByIdOrName({ params: { roomId } });

			if (findResult.ro === this.bodyParams.readOnly) {
				return API.v1.failure('The channel read only setting is the same as what it would be changed to.');
			}

			Meteor.call('saveRoomSettings', findResult._id, 'readOnly', this.bodyParams.readOnly);

			return API.v1.success({
				channel: findChannelByIdOrName({ params: { roomId }, userId: this.userId }),
			});
		},
	},
);

API.v1.addRoute(
	'channels.setAnnouncement',
	{
		authRequired: true,
		validateParams: isChannelsSetAnnouncementProps,
	},
	{
		post() {
			const { roomId, announcement } = this.bodyParams;

			const findResult = findChannelByIdOrName({ params: { roomId } });

			Meteor.call('saveRoomSettings', findResult._id, 'roomAnnouncement', announcement);

			return API.v1.success({
				announcement: this.bodyParams.announcement,
			});
		},
	},
);

API.v1.addRoute(
	'channels.getAllUserMentionsByChannel',
	{
		authRequired: true,
		validateParams: isChannelsGetAllUserMentionsByChannelProps,
	},
	{
		get() {
			const { roomId } = this.queryParams;
			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();

			const mentions = Meteor.runAsUser(this.userId, () =>
				Meteor.call('getUserMentionsByChannel', {
					roomId,
					options: {
						sort: sort || { ts: 1 },
						skip: offset,
						limit: count,
					},
				}),
			);

			const allMentions = Meteor.runAsUser(this.userId, () =>
				Meteor.call('getUserMentionsByChannel', {
					roomId,
					options: {},
				}),
			);

			return API.v1.success({
				mentions,
				count: mentions.length,
				offset,
				total: allMentions.length,
			});
		},
	},
);

API.v1.addRoute(
	'channels.moderators',
	{
		authRequired: true,
		validateParams: isChannelsModeratorsProps,
	},
	{
		get() {
			const { roomId } = this.queryParams;

			const findResult = findChannelByIdOrName({ params: { roomId } });

			const moderators = Subscriptions.findByRoomIdAndRoles(findResult._id, ['moderator'], {
				fields: { u: 1 },
			})
				.fetch()
				.map((sub: ISubscription) => sub.u);

			return API.v1.success({
				moderators,
			});
		},
	},
);

API.v1.addRoute(
	'channels.delete',
	{
		authRequired: true,
		validateParams: isChannelsDeleteProps,
	},
	{
		post() {
			const room = findChannelByIdOrName({
				params: this.bodyParams,
				checkedArchived: false,
			});

			Meteor.call('eraseRoom', room._id);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'channels.convertToTeam',
	{
		authRequired: true,
		validateParams: isChannelsConvertToTeamProps,
	},
	{
		async post() {
			if (!hasAllPermission(this.userId, ['create-team', 'edit-room'])) {
				return API.v1.unauthorized();
			}

			const { channelId, channelName } = this.bodyParams;

			if (!channelId && !channelName) {
				return API.v1.failure('The parameter "channelId" or "channelName" is required');
			}

			const room = findChannelByIdOrName({
				params: {
					roomId: channelId,
					roomName: channelName,
				},
				userId: this.userId,
			});

			if (!room) {
				return API.v1.failure('Channel not found');
			}

			const subscriptions = Subscriptions.findByRoomId(room._id, {
				fields: { 'u._id': 1 },
			});

			const members = subscriptions.fetch().map((s: ISubscription) => s.u && s.u._id);

			const teamData = {
				team: {
					name: room.name ?? '',
					type: room.t === 'c' ? 0 : 1,
				},
				members,
				room: {
					name: room.name,
					id: room._id,
				},
			};

			const team = await Team.create(this.userId, teamData);

			return API.v1.success({ team });
		},
	},
);
