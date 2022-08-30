import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import type { IMessage, IRoom, IUser, MessageTypesValues } from '@rocket.chat/core-typings';
import type { ComponentProps, UIEvent } from 'react';

import { t, getUserPreference } from '../../../../../utils/client';
import { ChatMessage, RoomRoles, Users, Rooms, Subscriptions } from '../../../../../models/client';
import { readMessage, RoomHistoryManager, RoomManager } from '../../../../../ui-utils/client';
import { settings } from '../../../../../settings/client';
import { hasAllPermission } from '../../../../../authorization/client';
import type { RoomTemplateInstance } from './RoomTemplateInstance';
import { openUserCard } from '../../../lib/UserCard';
import type UnreadMessagesIndicator from '../../../../../../client/views/room/components/body/UnreadMessagesIndicator';
import type UploadProgressIndicator from '../../../../../../client/views/room/components/body/UploadProgressIndicator';
import type LeaderBar from '../../../../../../client/views/room/components/body/LeaderBar';

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

function uploads() {
	return Session.get('uploading');
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

function containerBarsClassName(): string {
	const { state, rid } = Template.instance() as RoomTemplateInstance;
	const unreadCount = state.get('count');
	const unreadSince = RoomManager.getOpenedRoomByRid(rid)?.unreadSince.get();
	const uploading = Session.get('uploading') as unknown[];

	const hasUnreadData = Boolean(unreadCount) && Boolean(unreadSince);
	const isUploading = Boolean(uploading?.length);

	return [(hasUnreadData || isUploading) && 'show'].filter(Boolean).join(' ');
}

function messagesBoxClassName(): string {
	const { rid, state } = Template.instance() as RoomTemplateInstance;

	const uid = Meteor.userId();
	const modes = ['', 'cozy', 'compact'] as const;
	const viewMode = getUserPreference(uid, 'messageViewMode') as keyof typeof modes;
	const leader = RoomRoles.findOne({ rid, 'roles': 'leader', 'u._id': { $ne: uid } }, { fields: { _id: 1 } });

	return [state.get('selectable') && 'selectable', modes[viewMode] || modes[0], leader && 'has-leader'].filter(Boolean).join(' ');
}

function newMessageClassName(): string {
	const { state } = Template.instance() as RoomTemplateInstance;

	return [!state.get('newMessage') && 'not'].filter(Boolean).join(' ');
}

function jumpRecentClassName(): string {
	const { rid } = Template.instance() as RoomTemplateInstance;

	return [!RoomHistoryManager.hasMoreNext(rid) && 'not'].filter(Boolean).join(' ');
}

function wrapperClassName(): string {
	const { rid } = Template.instance() as RoomTemplateInstance;

	const uid = Meteor.userId();
	const hideUsernames = getUserPreference(uid, 'hideUsernames');
	const displayAvatars = getUserPreference(uid, 'displayAvatars');

	return [RoomHistoryManager.hasMoreNext(rid) && 'has-more-next', hideUsernames && 'hide-usernames', !displayAvatars && 'hide-avatars']
		.filter(Boolean)
		.join(' ');
}

function hasUnreadData(): boolean {
	const { state, rid } = Template.instance() as RoomTemplateInstance;

	const unreadCount = state.get('count') ?? 0;
	const unreadSince = RoomManager.getOpenedRoomByRid(rid)?.unreadSince.get();
	return Boolean(unreadCount) && Boolean(unreadSince);
}

function unreadMessagesIndicatorProps(): ComponentProps<typeof UnreadMessagesIndicator> {
	const { state, rid } = Template.instance() as RoomTemplateInstance;

	const unreadCount = state.get('count') ?? 0;
	const unreadSince = RoomManager.getOpenedRoomByRid(rid)?.unreadSince.get();

	const handleJumpButtonClick = (event: UIEvent) => {
		event.preventDefault();

		const room = RoomHistoryManager.getRoom(rid);
		let message = room?.firstUnread.get();
		if (!message) {
			const subscription = Subscriptions.findOne({ rid });
			message = ChatMessage.findOne({ rid, ts: { $gt: subscription?.ls } }, { sort: { ts: 1 }, limit: 1 });
		}
		RoomHistoryManager.getSurroundingMessages(message, 50);
	};

	const handleMarkAsReadButtonClick = (event: UIEvent) => {
		event.preventDefault();

		readMessage.readNow(rid);
	};

	return {
		count: unreadCount,
		since: unreadSince,
		onJumpButtonClick: handleJumpButtonClick,
		onMarkAsReadButtonClick: handleMarkAsReadButtonClick,
	};
}

function uploadProgressIndicatorProps({
	id,
	name,
	percentage,
	error,
}: {
	id: string;
	name: string;
	percentage: number;
	error: string;
}): ComponentProps<typeof UploadProgressIndicator> {
	const handleClose = (event: UIEvent): void => {
		event.preventDefault();
		Session.set(`uploading-cancel-${id}`, true);
	};

	return {
		name,
		percentage,
		error,
		onClose: handleClose,
	};
}

function leaderBarProps(): ComponentProps<typeof LeaderBar> {
	const {
		rid,
		state,
		data: { tabBar },
	} = Template.instance() as RoomTemplateInstance;

	const useRealName = settings.get('UI_Use_Real_Name');
	const uid = Meteor.userId();
	const leaderRoomRole = RoomRoles.findOne({
		rid,
		'roles': 'leader',
		'u._id': { $ne: uid },
	}) as { u: Pick<IUser, '_id' | 'username' | 'name'> };
	if (leaderRoomRole) {
		const leader = Users.findOne({ _id: leaderRoomRole.u._id }, { fields: { status: 1, statusText: 1 } }) || {};
		const { username = '' } = leaderRoomRole.u;

		const handleOpenUserCardButtonClick = (event: UIEvent): void => {
			event.preventDefault();
			event.stopPropagation();

			openUserCard({
				username,
				rid,
				target: event.currentTarget,
				open: (event: MouseEvent) => {
					event.preventDefault();
					tabBar.openUserInfo(username);
				},
			});
		};

		return {
			name: useRealName ? leaderRoomRole.u.name || username : username,
			username,
			status: leader.status || 'offline',
			statusDisplay: leader.statusText || t(leader.status || 'offline'),
			hideLeaderHeader: state.get('hideLeaderHeader') ?? false,
			onAvatarClick: handleOpenUserCardButtonClick,
		};
	}

	return {
		name: '',
		username: '',
		status: 'offline',
		statusDisplay: t('offline'),
		hideLeaderHeader: state.get('hideLeaderHeader') ?? false,
	};
}

export const roomHelpers = {
	containerBarsClassName,
	messagesBoxClassName,
	newMessageClassName,
	jumpRecentClassName,
	wrapperClassName,
	hasUnreadData,
	unreadMessagesIndicatorProps,
	uploads,
	uploadProgressIndicatorProps,
	leaderBarProps,
	messagesHistory,
	hasMore,
	hasMoreNext,
	isLoading,
	canPreview,
};
