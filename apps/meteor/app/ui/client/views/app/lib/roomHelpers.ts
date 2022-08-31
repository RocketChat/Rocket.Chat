import type moment from 'moment';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import type { IMessage, IRoom, MessageTypesValues } from '@rocket.chat/core-typings';

import { t, getUserPreference } from '../../../../../utils/client';
import { ChatMessage, RoomRoles, Users, Rooms, Subscriptions } from '../../../../../models/client';
import { readMessage, RoomHistoryManager, RoomManager } from '../../../../../ui-utils/client';
import { settings } from '../../../../../settings/client';
import { hasAllPermission } from '../../../../../authorization/client';
import type { RoomTemplateInstance } from './RoomTemplateInstance';
import type { CommonRoomTemplateInstance } from './CommonRoomTemplateInstance';
import { openUserCard } from '../../../lib/UserCard';

function messagesHistory() {
	const { rid } = (Template.instance() as RoomTemplateInstance).data;
	const room: Pick<IRoom, 'sysMes'> = Rooms.findOne(rid, { fields: { sysMes: 1 } });
	const hideSettings = settings.collection.findOne('Hide_System_Messages') || {};
	const settingValues: MessageTypesValues[] = Array.isArray(room?.sysMes) ? room.sysMes : hideSettings.value || [];
	const hideMessagesOfType = new Set(
		settingValues.reduce(
			(array: MessageTypesValues[], value: MessageTypesValues) => [
				...array,
				...(value === 'mute_unmute' ? (['user-muted', 'user-unmuted'] as const) : ([value] as const)),
			],
			[],
		),
	);
	const query: Mongo.Query<IMessage> = {
		rid,
		_hidden: { $ne: true },
		$or: [{ tmid: { $exists: false } }, { tshow: { $eq: true } }],
		...(hideMessagesOfType.size && { t: { $nin: Array.from(hideMessagesOfType.values()) } }),
	};

	const options = {
		sort: {
			ts: 1,
		},
	};

	return ChatMessage.find(query, options);
}

function hasMore(this: { _id: string }) {
	return RoomHistoryManager.hasMore(this._id);
}

function hasMoreNext(this: { _id: string }) {
	return RoomHistoryManager.hasMoreNext(this._id);
}

function isLoading(this: { _id: string }) {
	return RoomHistoryManager.isLoading(this._id);
}

function uploading() {
	return Session.get('uploading');
}

function roomLeader(this: { _id: string }) {
	const roles = RoomRoles.findOne({
		'rid': this._id,
		'roles': 'leader',
		'u._id': { $ne: Meteor.userId() },
	});
	if (roles) {
		const leader = Users.findOne({ _id: roles.u._id }, { fields: { status: 1, statusText: 1 } }) || {};

		return {
			...roles.u,
			name: settings.get('UI_Use_Real_Name') ? roles.u.name || roles.u.username : roles.u.username,
			status: leader.status || 'offline',
			statusDisplay: leader.statusText || t(leader.status || 'offline'),
		};
	}
}

type UnreadData = { count?: number; since?: moment.MomentInput };

function unreadData(this: { _id: string }) {
	const data: UnreadData = { count: (Template.currentData() as RoomTemplateInstance['data']).count, since: undefined };

	const room = RoomManager.getOpenedRoomByRid(this._id);
	if (room) {
		data.since = room.unreadSince.get();
	}

	return data;
}

function containerBarsShow(unreadData: UnreadData, uploading: unknown[]) {
	const hasUnreadData = Boolean(unreadData?.count && unreadData.since);
	const isUploading = Boolean(uploading?.length);

	if (hasUnreadData || isUploading) {
		return 'show';
	}
}

function messageViewMode() {
	const modes = ['', 'cozy', 'compact'] as const;
	const viewMode = getUserPreference(Meteor.userId(), 'messageViewMode') as keyof typeof modes;
	return modes[viewMode] || modes[0];
}

function hideUsername() {
	return getUserPreference(Meteor.userId(), 'hideUsernames') ? 'hide-usernames' : undefined;
}

function hideAvatar() {
	return getUserPreference(Meteor.userId(), 'displayAvatars') ? undefined : 'hide-avatars';
}

function canPreview() {
	const { room, subscribed } = Template.currentData() as RoomTemplateInstance['data'];

	if (room && room.t !== 'c') {
		return true;
	}

	if (settings.get('Accounts_AllowAnonymousRead') === true) {
		return true;
	}

	if (hasAllPermission('preview-c-room')) {
		return true;
	}

	return subscribed;
}

function hideLeaderHeader() {
	const { hideLeaderHeader } = Template.currentData() as RoomTemplateInstance['data'];
	return hideLeaderHeader ? 'animated-hidden' : '';
}

function hasLeader(this: { _id: string }) {
	if (RoomRoles.findOne({ 'rid': this._id, 'roles': 'leader', 'u._id': { $ne: Meteor.userId() } }, { fields: { _id: 1 } })) {
		return 'has-leader';
	}
}

function handleUnreadBarJumpToButtonClick() {
	const rid = Template.currentData()._id;

	return (event: MouseEvent) => {
		event.preventDefault();

		const room = RoomHistoryManager.getRoom(rid);
		let message = room?.firstUnread.get();
		if (!message) {
			const subscription = Subscriptions.findOne({ rid });
			message = ChatMessage.findOne({ rid, ts: { $gt: subscription?.ls } }, { sort: { ts: 1 }, limit: 1 });
		}
		RoomHistoryManager.getSurroundingMessages(message, 50);
	};
}

function handleMarkAsReadButtonClick() {
	const rid = Template.currentData()._id;

	return (event: MouseEvent) => {
		event.preventDefault();

		readMessage.readNow(rid);
	};
}

function handleUploadProgressCloseButtonClick(id: string) {
	return () =>
		(event: MouseEvent): void => {
			event.preventDefault();
			Session.set(`uploading-cancel-${id}`, true);
		};
}

function handleOpenUserCardButtonClick(this: { username: string }) {
	const instance = Template.instance() as CommonRoomTemplateInstance;
	const { username } = this;

	return (event: MouseEvent): void => {
		event.preventDefault();
		event.stopPropagation();

		openUserCard({
			username,
			rid: instance.data.rid,
			target: event.currentTarget,
			open: (e: MouseEvent) => {
				e.preventDefault();
				instance.data.tabBar.openUserInfo(username);
			},
		});
	};
}

export const roomHelpers = {
	messagesHistory,
	hasMore,
	hasMoreNext,
	isLoading,
	uploading,
	roomLeader,
	unreadData,
	containerBarsShow,
	messageViewMode,
	hideUsername,
	hideAvatar,
	canPreview,
	hideLeaderHeader,
	hasLeader,
	handleUnreadBarJumpToButtonClick,
	handleMarkAsReadButtonClick,
	handleUploadProgressCloseButtonClick,
	handleOpenUserCardButtonClick,
};
