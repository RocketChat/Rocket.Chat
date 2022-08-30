import type moment from 'moment';
import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import type { IMessage, IRoom, MessageTypesValues } from '@rocket.chat/core-typings';

import { t, getUserPreference } from '../../../../../utils/client';
import { ChatMessage, RoomRoles, Users, Rooms, Subscriptions } from '../../../../../models/client';
import { readMessage, RoomHistoryManager, RoomManager } from '../../../../../ui-utils/client';
import { settings } from '../../../../../settings/client';
import { callbacks } from '../../../../../../lib/callbacks';
import { hasAllPermission, hasRole } from '../../../../../authorization/client';
import type { RoomTemplateInstance } from './RoomTemplateInstance';
import type { CommonRoomTemplateInstance } from './CommonRoomTemplateInstance';
import { openUserCard } from '../../../lib/UserCard';

function tabBar() {
	return (Template.instance() as RoomTemplateInstance).tabBar;
}

function subscribed() {
	const { state } = Template.instance() as RoomTemplateInstance;
	return state.get('subscribed');
}

function messagesHistory() {
	const { rid } = Template.instance() as RoomTemplateInstance;
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

function windowId(this: { _id: string }) {
	return `chat-window-${this._id}`;
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

function announcement() {
	return (Template.instance() as RoomTemplateInstance).state.get('announcement');
}

function announcementDetails(this: { _id: string }) {
	const roomData = Session.get(`roomData${this._id}`);
	if (roomData?.announcementDetails?.callback) {
		return () => callbacks.run(roomData.announcementDetails.callback, this._id);
	}
}

function getAnnouncementStyle() {
	const { room } = Template.instance() as RoomTemplateInstance;
	return room?.announcementDetails?.style ?? '';
}

function maxMessageLength() {
	return settings.get('Message_MaxAllowedSize');
}

type UnreadData = { count?: number; since?: moment.MomentInput };

function unreadData(this: { _id: string }) {
	const data: UnreadData = { count: (Template.instance() as RoomTemplateInstance).state.get('count'), since: undefined };

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

function adminClass() {
	const uid = Meteor.userId();
	if (uid && hasRole(uid, 'admin')) {
		return 'admin';
	}
}

function messageViewMode() {
	const modes = ['', 'cozy', 'compact'] as const;
	const viewMode = getUserPreference(Meteor.userId(), 'messageViewMode') as keyof typeof modes;
	return modes[viewMode] || modes[0];
}

function selectable() {
	return (Template.instance() as RoomTemplateInstance).selectable.get();
}

function hideUsername() {
	return getUserPreference(Meteor.userId(), 'hideUsernames') ? 'hide-usernames' : undefined;
}

function hideAvatar() {
	return getUserPreference(Meteor.userId(), 'displayAvatars') ? undefined : 'hide-avatars';
}

function canPreview() {
	const { room, state } = Template.instance() as RoomTemplateInstance;

	if (room && room.t !== 'c') {
		return true;
	}

	if (settings.get('Accounts_AllowAnonymousRead') === true) {
		return true;
	}

	if (hasAllPermission('preview-c-room')) {
		return true;
	}

	return state.get('subscribed');
}

function hideLeaderHeader() {
	return (Template.instance() as RoomTemplateInstance).hideLeaderHeader.get() ? 'animated-hidden' : '';
}

function hasLeader(this: { _id: string }) {
	if (RoomRoles.findOne({ 'rid': this._id, 'roles': 'leader', 'u._id': { $ne: Meteor.userId() } }, { fields: { _id: 1 } })) {
		return 'has-leader';
	}
}

function openedThread() {
	FlowRouter.watchPathChange();
	const tab = FlowRouter.getParam('tab');
	const mid = FlowRouter.getParam('context');
	const rid = Template.currentData()._id;
	const jump = FlowRouter.getQueryParam('jump');
	const subscription = (Template.instance() as RoomTemplateInstance).subscription.get();

	if (tab !== 'thread' || !mid || rid !== Session.get('openedRoom')) {
		return;
	}

	const room = Rooms.findOne(
		{ _id: rid },
		{
			fields: {
				t: 1,
				usernames: 1,
				uids: 1,
				name: 1,
			},
		},
	);

	return {
		rid,
		mid,
		room,
		jump,
		subscription,
	};
}

function handleUnreadBarJumpToButtonClick() {
	const rid = Template.parentData()._id;

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
	const rid = Template.parentData()._id;

	return (event: MouseEvent) => {
		event.preventDefault();

		readMessage.readNow(rid);
	};
}

function handleUploadProgressCloseButtonClick(id: string) {
	return () => {
		return (event: MouseEvent): void => {
			event.preventDefault();
			Session.set(`uploading-cancel-${id}`, true);
		};
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
	tabBar,
	subscribed,
	messagesHistory,
	hasMore,
	hasMoreNext,
	isLoading,
	windowId,
	uploading,
	roomLeader,
	announcement,
	announcementDetails,
	getAnnouncementStyle,
	maxMessageLength,
	unreadData,
	containerBarsShow,
	adminClass,
	messageViewMode,
	selectable,
	hideUsername,
	hideAvatar,
	canPreview,
	hideLeaderHeader,
	hasLeader,
	openedThread,
	handleUnreadBarJumpToButtonClick,
	handleMarkAsReadButtonClick,
	handleUploadProgressCloseButtonClick,
	handleOpenUserCardButtonClick,
};
