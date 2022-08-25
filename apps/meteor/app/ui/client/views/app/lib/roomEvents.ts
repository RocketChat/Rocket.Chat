import _ from 'underscore';
import { Random } from 'meteor/random';
import { Blaze } from 'meteor/blaze';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import type { IRoom, MessageQuoteAttachment } from '@rocket.chat/core-typings';

import { ChatMessage, Subscriptions } from '../../../../../models/client';
import { RoomHistoryManager, RoomManager, readMessage } from '../../../../../ui-utils/client';
import { messageArgs } from '../../../../../../client/lib/utils/messageArgs';
import { chatMessages } from '../../../lib/ChatMessages';
import type { RoomTemplateInstance } from './RoomTemplateInstance';

function handleToggleHiddenButtonClick(e: JQuery.ClickEvent) {
	const id = e.currentTarget.dataset.message;
	document.getElementById(id)?.classList.toggle('message--ignored');
}

function handleMessageClick(e: JQuery.ClickEvent, template: RoomTemplateInstance) {
	if (template.selectable.get()) {
		window.getSelection?.()?.removeAllRanges();
		const data = Blaze.getData(e.currentTarget);
		const {
			msg: { _id },
		} = messageArgs(data);

		if (!template.selectablePointer) {
			template.selectablePointer = _id;
		}

		if (!e.shiftKey) {
			template.selectedMessages = template.getSelectedMessages();
			template.selectedRange = [];
			template.selectablePointer = _id;
		}

		template.selectMessages(_id);

		const selectedMessages = $('.messages-box .message.selected').map((_i, message) => message.id);
		const removeClass = _.difference(selectedMessages, template.getSelectedMessages());
		const addClass = _.difference(template.getSelectedMessages(), selectedMessages);
		removeClass.forEach((message) => $(`.messages-box #${message}`).removeClass('selected'));
		addClass.forEach((message) => $(`.messages-box #${message}`).addClass('selected'));
	}
}

function handleJumpToRecentButtonClick(this: { _id: IRoom['_id'] }, e: JQuery.ClickEvent, template: RoomTemplateInstance) {
	e.preventDefault();
	template.atBottom = true;
	RoomHistoryManager.clear(template?.data?._id);
	RoomHistoryManager.getMoreIfIsEmpty(this._id);
}

function handleGalleryItemLoad(_e: JQuery.TriggeredEvent, template: RoomTemplateInstance) {
	template.sendToBottomIfNecessary();
}

function handleBlockWrapperRendered(_e: JQuery.TriggeredEvent, template: RoomTemplateInstance) {
	template.sendToBottomIfNecessary();
}

function handleNewMessageButtonClick(_event: JQuery.ClickEvent, instance: RoomTemplateInstance) {
	instance.atBottom = true;
	instance.sendToBottomIfNecessary();
	const input = RoomManager.openedRoom ? chatMessages[RoomManager.openedRoom].input : undefined;
	input?.focus();
}

function handleUploadProgressCloseButtonClick(this: { id: string }, e: JQuery.ClickEvent) {
	e.preventDefault();
	Session.set(`uploading-cancel-${this.id}`, true);
}

function handleMarkAsReadButtonClick(_e: JQuery.ClickEvent, t: RoomTemplateInstance) {
	readMessage.readNow(t.data._id);
}

function handleUnreadBarJumpToButtonClick(_e: JQuery.ClickEvent, t: RoomTemplateInstance) {
	const { _id } = t.data;
	const room = RoomHistoryManager.getRoom(_id);
	let message = room?.firstUnread.get();
	if (!message) {
		const subscription = Subscriptions.findOne({ rid: _id });
		message = ChatMessage.find(
			{ rid: _id, ts: { $gt: subscription != null ? subscription.ls : undefined } },
			{ sort: { ts: 1 }, limit: 1 },
		).fetch()[0];
	}
	RoomHistoryManager.getSurroundingMessages(message, 50);
}

const handleWrapperScroll = _.throttle(function (this: { _id: IRoom['_id'] }, e: JQuery.ScrollEvent, t: RoomTemplateInstance) {
	const $roomLeader = $('.room-leader');
	if ($roomLeader.length) {
		if (e.target.scrollTop < t.lastScrollTop) {
			t.hideLeaderHeader.set(false);
		} else if (t.isAtBottom(100) === false && e.target.scrollTop > ($roomLeader.height() ?? 0)) {
			t.hideLeaderHeader.set(true);
		}
	}
	t.lastScrollTop = e.target.scrollTop;
	const height = e.target.clientHeight;
	const isLoading = RoomHistoryManager.isLoading(this._id);
	const hasMore = RoomHistoryManager.hasMore(this._id);
	const hasMoreNext = RoomHistoryManager.hasMoreNext(this._id);

	if ((isLoading === false && hasMore === true) || hasMoreNext === true) {
		if (hasMore === true && t.lastScrollTop <= height / 3) {
			RoomHistoryManager.getMore(this._id);
		} else if (hasMoreNext === true && Math.ceil(t.lastScrollTop) >= e.target.scrollHeight - height) {
			RoomHistoryManager.getMoreNext(this._id);
		}
	}
}, 100);

function handleTimeClick(this: unknown, e: JQuery.ClickEvent) {
	e.preventDefault();
	const { msg } = messageArgs(this);
	const repliedMessageId = (msg.attachments?.[0] as MessageQuoteAttachment).message_link?.split('?msg=')[1];
	FlowRouter.go(FlowRouter.current().context.pathname, undefined, {
		...(repliedMessageId && { msg: repliedMessageId }),
		hash: Random.id(),
	});
}

export const roomEvents = {
	'click .toggle-hidden': handleToggleHiddenButtonClick,
	'click .message': handleMessageClick,
	'click .jump-recent button': handleJumpToRecentButtonClick,
	'load .gallery-item': handleGalleryItemLoad,
	'rendered .js-block-wrapper': handleBlockWrapperRendered,
	'click .new-message': handleNewMessageButtonClick,
	'click .upload-progress-close': handleUploadProgressCloseButtonClick,
	'click .unread-bar > button.mark-read': handleMarkAsReadButtonClick,
	'click .unread-bar > button.jump-to': handleUnreadBarJumpToButtonClick,
	'scroll .wrapper': handleWrapperScroll,
	'click .time a': handleTimeClick,
};
