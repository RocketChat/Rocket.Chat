import Clipboard from 'clipboard';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { FlowRouter } from 'meteor/kadira:flow-router';
import type { IMessage } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';

import { popover, MessageAction } from '../../../../../ui-utils/client';
import { addMessageToList } from '../../../../../ui-utils/client/lib/MessageAction';
import { callWithErrorHandling } from '../../../../../../client/lib/utils/callWithErrorHandling';
import { isURL } from '../../../../../../lib/utils/isURL';
import { openUserCard } from '../../../lib/UserCard';
import { messageArgs } from '../../../../../../client/lib/utils/messageArgs';
import { ChatMessage, Rooms, Messages } from '../../../../../models/client';
import { t } from '../../../../../utils/client';
import { chatMessages } from '../../../lib/ChatMessages';
import { EmojiEvents } from '../../../../../reactions/client/init';
import { fireGlobalEvent } from '../../../../../../client/lib/utils/fireGlobalEvent';
import { isLayoutEmbedded } from '../../../../../../client/lib/utils/isLayoutEmbedded';
import { onClientBeforeSendMessage } from '../../../../../../client/lib/onClientBeforeSendMessage';
import { goToRoomById } from '../../../../../../client/lib/utils/goToRoomById';
import { mountPopover } from './mountPopover';
import type { CommonRoomTemplateInstance } from './CommonRoomTemplateInstance';

const createMessageTouchEvents = () => {
	let touchMoved = false;
	let lastTouchX: number | undefined = undefined;
	let lastTouchY: number | undefined = undefined;

	let touchtime: ReturnType<typeof setTimeout> | undefined = undefined;

	return {
		...EmojiEvents,
		'click .message img'(e: JQuery.ClickEvent) {
			clearTimeout(touchtime);
			if (touchMoved === true) {
				e.preventDefault();
				e.stopPropagation();
			}
		},

		'touchstart .message'(e: JQuery.TouchStartEvent, t: CommonRoomTemplateInstance) {
			const touches = e.originalEvent?.touches;
			if (touches?.length) {
				lastTouchX = touches[0].pageX;
				lastTouchY = touches[0].pageY;
			}
			touchMoved = false;
			if (touches?.length !== 1) {
				return;
			}

			if ($(e.currentTarget).hasClass('system')) {
				return;
			}

			if (e.target && e.target.nodeName === 'AUDIO') {
				return;
			}

			if (e.target && e.target.nodeName === 'A' && isURL(e.target.getAttribute('href'))) {
				e.preventDefault();
				e.stopPropagation();
			}

			const doLongTouch = () => {
				mountPopover(e, t, this);
			};

			clearTimeout(touchtime);
			touchtime = setTimeout(doLongTouch, 500);
		},

		'touchend .message'(e: JQuery.TouchEndEvent) {
			clearTimeout(touchtime);
			if (e.target && e.target.nodeName === 'A' && isURL(e.target.getAttribute('href'))) {
				if (touchMoved === true) {
					e.preventDefault();
					e.stopPropagation();
					return;
				}

				window.open(e.target.href);
			}
		},

		'touchmove .message'(e: JQuery.TouchMoveEvent) {
			const touches = e.originalEvent?.touches;
			if (touches?.length && lastTouchX !== undefined && lastTouchY !== undefined) {
				const deltaX = Math.abs(lastTouchX - touches[0].pageX);
				const deltaY = Math.abs(lastTouchY - touches[0].pageY);
				if (deltaX > 5 || deltaY > 5) {
					touchMoved = true;
				}
			}
			clearTimeout(touchtime);
		},

		'touchcancel .message'() {
			clearTimeout(touchtime);
		},
	};
};

function handleMessageActionButtonClick(this: unknown, event: JQuery.ClickEvent, template: CommonRoomTemplateInstance) {
	const button = MessageAction.getButtonById(event.currentTarget.dataset.messageAction);
	// @ ts-ignore
	button?.action.call(this, event, { tabbar: template.tabBar });
}

function handleFollowThreadButtonClick(this: unknown, e: JQuery.ClickEvent) {
	e.preventDefault();
	e.stopPropagation();
	const { msg } = messageArgs(this);
	callWithErrorHandling('followMessage', { mid: msg._id });
}

function handleUnfollowThreadButtonClick(this: unknown, e: JQuery.ClickEvent) {
	e.preventDefault();
	e.stopPropagation();
	const { msg } = messageArgs(this);
	callWithErrorHandling('unfollowMessage', { mid: msg._id });
}

function handleOpenThreadButtonClick(this: unknown, event: JQuery.ClickEvent) {
	event.preventDefault();
	event.stopPropagation();

	const {
		msg: { rid, _id, tmid },
	} = messageArgs(this);
	const room = Rooms.findOne({ _id: rid });

	FlowRouter.go(
		FlowRouter.getRouteName(),
		{
			rid,
			name: room.name,
			tab: 'thread',
			context: tmid || _id,
		},
		tmid && tmid !== _id && _id
			? {
					jump: _id,
			  }
			: {},
	);
}

function handleDownloadImageButtonClick(this: unknown, event: JQuery.ClickEvent) {
	const { msg } = messageArgs(this);
	ChatMessage.update({ '_id': msg._id, 'urls.url': $(event.currentTarget).data('url') }, { $set: { 'urls.$.downloadImages': true } });
	ChatMessage.update(
		{ '_id': msg._id, 'attachments.image_url': $(event.currentTarget).data('url') },
		{ $set: { 'attachments.$.downloadImages': true } },
	);
}

function handleOpenUserCardButtonClick(this: unknown, e: JQuery.ClickEvent, instance: CommonRoomTemplateInstance) {
	const { msg } = messageArgs(this);
	if (!Meteor.userId()) {
		return;
	}

	const { username } = msg.u;

	if (username) {
		openUserCard({
			username,
			rid: instance.data.rid,
			target: e.currentTarget,
			open: (e: MouseEvent) => {
				e.preventDefault();
				instance.data.tabBar.openUserInfo(username);
			},
		});
	}
}

function handleRespondWithMessageActionButtonClick(event: JQuery.ClickEvent, instance: CommonRoomTemplateInstance) {
	const { rid } = instance.data;
	const msg = event.currentTarget.value;
	if (!msg) {
		return;
	}

	const { input } = chatMessages[rid];
	if (input) {
		input.value = msg;
		input.focus();
	}
}

function handleRespondWithQuotedMessageActionButtonClick(event: JQuery.ClickEvent, instance: CommonRoomTemplateInstance) {
	const { rid } = instance.data;
	const { id: msgId } = event.currentTarget;
	const { $input } = chatMessages[rid];

	if (!msgId) {
		return;
	}

	const message = Messages.findOne({ _id: msgId });

	let messages = $input?.data('reply') || [];
	messages = addMessageToList(messages, message);

	$input?.focus().data('mention-user', false).data('reply', messages).trigger('dataChange');
}

async function handleSendMessageActionButtonClick(event: JQuery.ClickEvent, instance: CommonRoomTemplateInstance) {
	const { rid } = instance.data;
	const msg = event.currentTarget.value;
	let msgObject = { _id: Random.id(), rid, msg } as IMessage;
	if (!msg) {
		return;
	}

	msgObject = (await onClientBeforeSendMessage(msgObject)) as IMessage;

	const _chatMessages = chatMessages[rid];
	if (_chatMessages && (await _chatMessages.processSlashCommand(msgObject))) {
		return;
	}

	await callWithErrorHandling('sendMessage', msgObject);
}

function handleMessageActionMenuClick(this: unknown, e: JQuery.ClickEvent, template: CommonRoomTemplateInstance) {
	const messageContext = messageArgs(this);
	const { msg: message, u: user, context: ctx } = messageContext;
	const room = Rooms.findOne({ _id: message.rid });
	const federationContext = isRoomFederated(room) ? 'federated' : '';
	// @ts-ignore
	const context = ctx || message.context || message.actionContext || federationContext || 'message';
	const allItems = MessageAction.getButtons({ ...messageContext, message, user }, context, 'menu').map((item) => ({
		icon: item.icon,
		name: t(item.label),
		type: 'message-action',
		id: item.id,
		modifier: item.color,
		action: () => item.action(e, { tabbar: template.tabBar, message, room }),
	}));

	const itemsBelowDivider = ['delete-message', 'report-message'];
	const [items, alertsItem] = allItems.reduce(
		(result, value) => {
			result[itemsBelowDivider.includes(value.id) ? 1 : 0].push(value);
			return result;
		},
		[[], []] as [typeof allItems, typeof allItems],
	);
	const groups = [{ items }];

	if (alertsItem.length) {
		groups.push({ items: alertsItem });
	}
	const config = {
		columns: [
			{
				groups,
			},
		],
		instance: template,
		rid: template.data.rid,
		data: this,
		type: 'message-action-menu-options',
		currentTarget: e.currentTarget,
		activeElement: $(e.currentTarget).parents('.message')[0],
		onRendered: () => new Clipboard('.rc-popover__item'),
	};

	popover.open(config);
}

function handleMentionLinkClick(e: JQuery.ClickEvent, instance: CommonRoomTemplateInstance) {
	e.stopPropagation();
	e.preventDefault();

	if (!Meteor.userId()) {
		return;
	}

	const {
		currentTarget: {
			dataset: { channel, group, username },
		},
	} = e;

	if (channel) {
		if (isLayoutEmbedded()) {
			fireGlobalEvent('click-mention-link', {
				path: FlowRouter.path('channel', { name: channel }),
				channel,
			});
		}
		goToRoomById(channel);
		return;
	}

	if (group) {
		return;
	}

	if (username) {
		openUserCard({
			username,
			rid: instance.data.rid,
			target: e.currentTarget,
			open: (e: MouseEvent) => {
				e.preventDefault();
				instance.data.tabBar.openUserInfo(username);
			},
		});
	}
}

export const getCommonRoomEvents = () => ({
	...createMessageTouchEvents(),
	'click [data-message-action]': handleMessageActionButtonClick,
	'click .js-follow-thread': handleFollowThreadButtonClick,
	'click .js-unfollow-thread': handleUnfollowThreadButtonClick,
	'click .js-open-thread': handleOpenThreadButtonClick,
	'click .image-to-download': handleDownloadImageButtonClick,
	'click .user-card-message': handleOpenUserCardButtonClick,
	'click .js-actionButton-respondWithMessage': handleRespondWithMessageActionButtonClick,
	'click .js-actionButton-respondWithQuotedMessage': handleRespondWithQuotedMessageActionButtonClick,
	'click .js-actionButton-sendMessage': handleSendMessageActionButtonClick,
	'click .message-actions__menu': handleMessageActionMenuClick,
	'click .mention-link': handleMentionLinkClick,
});
