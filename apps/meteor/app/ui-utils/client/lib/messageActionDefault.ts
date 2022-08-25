import { FlowRouter } from 'meteor/kadira:flow-router';
import moment from 'moment';
import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { Session } from 'meteor/session';
import type { IMessage } from '@rocket.chat/core-typings';

import { messageArgs } from '../../../../client/lib/utils/messageArgs';
import { roomCoordinator } from '../../../../client/lib/rooms/roomCoordinator';
import { Rooms, Subscriptions } from '../../../models/client';
import { hasAtLeastOnePermission, hasPermission } from '../../../authorization/client';
import { MessageAction } from './MessageAction';
import { imperativeModal } from '../../../../client/lib/imperativeModal';
import ReactionList from '../../../../client/views/room/modals/ReactionListModal';
import ReportMessageModal from '../../../../client/views/room/modals/ReportMessageModal';
import CreateDiscussion from '../../../../client/components/CreateDiscussion/CreateDiscussion';
import { canDeleteMessage } from '../../../../client/lib/utils/canDeleteMessage';
import { dispatchToastMessage } from '../../../../client/lib/toast';
import type { ChatMessages } from '../../../ui/client';

export const addMessageToList = (messagesList: IMessage[], message: IMessage): IMessage[] => {
	// checks if the message is not already on the list
	if (!messagesList.find(({ _id }) => _id === message._id)) {
		messagesList.push(message);
	}

	return messagesList;
};

Meteor.startup(async function () {
	const { chatMessages } = await import('../../../ui');

	const getChatMessagesFrom = (msg: IMessage): ChatMessages => {
		const { rid = Session.get('openedRoom'), tmid = msg._id } = msg;

		return chatMessages[`${rid}-${tmid}`] || chatMessages[rid];
	};

	MessageAction.addButton({
		id: 'reply-directly',
		icon: 'reply-directly',
		label: 'Reply_in_direct_message',
		context: ['message', 'message-mobile', 'threads', 'federated'],
		action(_, props) {
			const { message = messageArgs(this).msg } = props;
			roomCoordinator.openRouteLink(
				'd',
				{ name: message.u.username },
				{
					...FlowRouter.current().queryParams,
					reply: message._id,
				},
			);
		},
		condition({ subscription, room, message, user }) {
			if (subscription == null) {
				return false;
			}
			if (room.t === 'd' || room.t === 'l') {
				return false;
			}

			// Check if we already have a DM started with the message user (not ourselves) or we can start one
			if (user._id !== message.u._id && !hasPermission('create-d')) {
				const dmRoom = Rooms.findOne({ _id: [user._id, message.u._id].sort().join('') });
				if (!dmRoom || !Subscriptions.findOne({ 'rid': dmRoom._id, 'u._id': user._id })) {
					return false;
				}
			}

			return true;
		},
		order: 0,
		group: 'menu',
	});

	MessageAction.addButton({
		id: 'quote-message',
		icon: 'quote',
		label: 'Quote',
		context: ['message', 'message-mobile', 'threads'],
		action(_, props) {
			const { message = messageArgs(this).msg } = props;
			const { input } = getChatMessagesFrom(message);
			if (!input) {
				return;
			}

			const $input = $(input);

			let messages = $input.data('reply') || [];

			messages = addMessageToList(messages, message);

			$input.focus().data('mention-user', false).data('reply', messages).trigger('dataChange');
		},
		condition({ subscription, room }) {
			if (subscription == null) {
				return false;
			}
			const isLivechatRoom = roomCoordinator.isLivechatRoom(room.t);
			if (isLivechatRoom) {
				return false;
			}

			return true;
		},
		order: -3,
		group: ['message', 'menu'],
	});

	MessageAction.addButton({
		id: 'permalink',
		icon: 'permalink',
		label: 'Get_link',
		// classes: 'clipboard',
		context: ['message', 'message-mobile', 'threads', 'federated'],
		async action(_, props) {
			const { message = messageArgs(this).msg } = props;
			const permalink = await MessageAction.getPermaLink(message._id);
			navigator.clipboard.writeText(permalink);
			dispatchToastMessage({ type: 'success', message: TAPi18n.__('Copied') });
		},
		condition({ subscription }) {
			return !!subscription;
		},
		order: 4,
		group: 'menu',
	});

	MessageAction.addButton({
		id: 'copy',
		icon: 'copy',
		label: 'Copy',
		// classes: 'clipboard',
		context: ['message', 'message-mobile', 'threads', 'federated'],
		action(_, props) {
			const { message = messageArgs(this).msg } = props;
			navigator.clipboard.writeText(message.msg);
			dispatchToastMessage({ type: 'success', message: TAPi18n.__('Copied') });
		},
		condition({ subscription }) {
			return !!subscription;
		},
		order: 5,
		group: 'menu',
	});

	MessageAction.addButton({
		id: 'edit-message',
		icon: 'edit',
		label: 'Edit',
		context: ['message', 'message-mobile', 'threads'],
		action(_, props) {
			const { message = messageArgs(this).msg } = props;
			const element = document.getElementById(message.tmid ? `thread-${message._id}` : message._id);
			if (!element) {
				throw new Error('Message not found');
			}
			getChatMessagesFrom(message).edit(element);
		},
		condition({ message, subscription, settings }) {
			if (subscription == null) {
				return false;
			}
			const hasPermission = hasAtLeastOnePermission('edit-message', message.rid);
			const isEditAllowed = settings.Message_AllowEditing;
			const editOwn = message.u && message.u._id === Meteor.userId();
			if (!(hasPermission || (isEditAllowed && editOwn))) {
				return false;
			}
			const blockEditInMinutes = settings.Message_AllowEditing_BlockEditInMinutes;
			if (blockEditInMinutes) {
				let msgTs;
				if (message.ts != null) {
					msgTs = moment(message.ts);
				}
				let currentTsDiff;
				if (msgTs != null) {
					currentTsDiff = moment().diff(msgTs, 'minutes');
				}
				return (!!currentTsDiff || currentTsDiff === 0) && currentTsDiff < blockEditInMinutes;
			}
			return true;
		},
		order: 6,
		group: 'menu',
	});

	MessageAction.addButton({
		id: 'delete-message',
		icon: 'trash',
		label: 'Delete',
		context: ['message', 'message-mobile', 'threads'],
		color: 'alert',
		action(_, props) {
			const { message = messageArgs(this).msg } = props;
			getChatMessagesFrom(message).confirmDeleteMsg(message);
		},
		condition({ message, subscription, room }) {
			if (!subscription) {
				return false;
			}
			const isLivechatRoom = roomCoordinator.isLivechatRoom(room.t);
			if (isLivechatRoom) {
				return false;
			}

			return canDeleteMessage({
				rid: message.rid,
				ts: message.ts,
				uid: message.u._id,
			});
		},
		order: 18,
		group: 'menu',
	});

	MessageAction.addButton({
		id: 'report-message',
		icon: 'report',
		label: 'Report',
		context: ['message', 'message-mobile', 'threads', 'federated'],
		color: 'alert',
		action(_, props) {
			const { message = messageArgs(this).msg } = props;
			imperativeModal.open({
				component: ReportMessageModal,
				props: {
					messageText: message.msg || message.attachments?.[0]?.description || message.file?.name,
					messageId: message._id,
					onClose: imperativeModal.close,
				},
			});
		},
		condition({ subscription, room }) {
			const isLivechatRoom = roomCoordinator.isLivechatRoom(room.t);
			if (isLivechatRoom) {
				return false;
			}
			return Boolean(subscription);
		},
		order: 17,
		group: 'menu',
	});

	MessageAction.addButton({
		id: 'reaction-list',
		icon: 'emoji',
		label: 'Reactions',
		context: ['message', 'message-mobile', 'threads'],
		action(_, { tabbar, ...props }) {
			const { message: { reactions = {}, rid } = messageArgs(this).msg } = props;

			imperativeModal.open({
				component: ReactionList,
				props: { reactions, rid, tabBar: tabbar, onClose: imperativeModal.close },
			});
		},
		condition({ message: { reactions } }) {
			return !!reactions;
		},
		order: 18,
		group: 'menu',
	});

	MessageAction.addButton({
		id: 'start-discussion',
		icon: 'discussion',
		label: 'Discussion_start',
		context: ['message', 'message-mobile'],
		async action(_, props) {
			const { message = messageArgs(this).msg, room } = props;

			imperativeModal.open({
				component: CreateDiscussion,
				props: {
					defaultParentRoom: room?.prid || room?._id,
					onClose: imperativeModal.close,
					parentMessageId: message._id,
					nameSuggestion: message?.msg?.substr(0, 140),
				},
			});
		},
		condition({
			message: {
				u: { _id: uid },
				drid,
				dcount,
			},
			room,
			subscription,
			user,
		}) {
			if (drid || (!Number.isNaN(dcount) && dcount !== undefined)) {
				return false;
			}
			if (!subscription) {
				return false;
			}
			const isLivechatRoom = roomCoordinator.isLivechatRoom(room.t);
			if (isLivechatRoom) {
				return false;
			}

			return uid !== user._id ? hasPermission('start-discussion-other-user') : hasPermission('start-discussion');
		},
		order: 1,
		group: 'menu',
	});
});
