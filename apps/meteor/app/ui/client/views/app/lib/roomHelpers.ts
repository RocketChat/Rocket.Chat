import moment from 'moment';
import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import type { IMessage, IRoom, MessageTypesValues } from '@rocket.chat/core-typings';

import { t, getUserPreference } from '../../../../../utils/client';
import { ChatMessage, RoomRoles, Users, Rooms } from '../../../../../models/client';
import { RoomHistoryManager, RoomManager } from '../../../../../ui-utils/client';
import { settings } from '../../../../../settings/client';
import { callbacks } from '../../../../../../lib/callbacks';
import { hasAllPermission, hasRole } from '../../../../../authorization/client';
import { isLayoutEmbedded } from '../../../../../../client/lib/utils/isLayoutEmbedded';
import { roomCoordinator } from '../../../../../../client/lib/rooms/roomCoordinator';
import { chatMessages } from '../../../lib/ChatMessages';
import type { RoomTemplateInstance } from './RoomTemplateInstance';

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

function chatNowLink(this: { username: string }) {
	return roomCoordinator.getRouteLink('d', { name: this.username });
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

function messageboxData(this: { _id: string }) {
	const { sendToBottomIfNecessary, subscription } = Template.instance() as RoomTemplateInstance;
	const { _id: rid } = this;
	const isEmbedded = isLayoutEmbedded();
	const showFormattingTips = settings.get('Message_ShowFormattingTips');

	return {
		rid,
		subscription: subscription.get(),
		isEmbedded,
		showFormattingTips: showFormattingTips && !isEmbedded,
		onInputChanged: (input: HTMLTextAreaElement) => {
			if (!chatMessages[rid]) {
				return;
			}

			chatMessages[rid].initializeInput(input, { rid });
		},
		onResize: () => sendToBottomIfNecessary?.(),
		onKeyUp: (
			event: KeyboardEvent,
			{
				rid,
				tmid,
			}: {
				rid: string;
				tmid?: string | undefined;
			},
		) => chatMessages[rid]?.keyup(event, { rid, tmid }),
		onKeyDown: (event: KeyboardEvent) => chatMessages[rid]?.keydown(event),
		onSend: (
			event: Event,
			params: {
				rid: string;
				tmid?: string;
				value: string;
				tshow?: boolean;
			},
			done?: () => void,
		) => chatMessages[rid]?.send(event, params, done),
	};
}

function getAnnouncementStyle() {
	const { room } = Template.instance() as RoomTemplateInstance;
	return room?.announcementDetails?.style ?? '';
}

function maxMessageLength() {
	return settings.get('Message_MaxAllowedSize');
}

function subscriptionReady(this: { _id: string }) {
	return RoomManager.getOpenedRoomByRid(this._id)?.streamActive ?? false;
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

function formatUnreadSince(this: UnreadData) {
	if (!this.since) {
		return;
	}

	return moment(this.since).calendar(null, { sameDay: 'LT' });
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
	chatNowLink,
	announcement,
	announcementDetails,
	messageboxData,
	getAnnouncementStyle,
	maxMessageLength,
	subscriptionReady,
	unreadData,
	containerBarsShow,
	formatUnreadSince,
	adminClass,
	messageViewMode,
	selectable,
	hideUsername,
	hideAvatar,
	canPreview,
	hideLeaderHeader,
	hasLeader,
	openedThread,
};
