import Clipboard from 'clipboard';
import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { isRoomFederated } from '@rocket.chat/core-typings';

import { popover, MessageAction } from '../../../../../ui-utils/client';
import { callWithErrorHandling } from '../../../../../../client/lib/utils/callWithErrorHandling';
import { isURL } from '../../../../../../lib/utils/isURL';
import { openUserCard } from '../../../lib/UserCard';
import { messageArgs } from '../../../../../../client/lib/utils/messageArgs';
import { ChatMessage, Rooms } from '../../../../../models/client';
import { t } from '../../../../../utils/client';
import { EmojiEvents } from '../../../../../reactions/client/init';
import { fireGlobalEvent } from '../../../../../../client/lib/utils/fireGlobalEvent';
import { isLayoutEmbedded } from '../../../../../../client/lib/utils/isLayoutEmbedded';
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

		'touchstart .message'(event: JQuery.TouchStartEvent, template: CommonRoomTemplateInstance) {
			const touches = event.originalEvent?.touches;
			if (touches?.length) {
				lastTouchX = touches[0].pageX;
				lastTouchY = touches[0].pageY;
			}
			touchMoved = false;
			if (touches?.length !== 1) {
				return;
			}

			if ($(event.currentTarget).hasClass('system')) {
				return;
			}

			if (event.target && event.target.nodeName === 'AUDIO') {
				return;
			}

			if (event.target && event.target.nodeName === 'A' && isURL(event.target.getAttribute('href'))) {
				event.preventDefault();
				event.stopPropagation();
			}

			const doLongTouch = () => {
				const data = Blaze.getData(event.currentTarget);
				mountPopover(event, template, data);
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

function handleMessageActionButtonClick(event: JQuery.ClickEvent, template: CommonRoomTemplateInstance) {
	const { tabBar } = template.data;
	const button = MessageAction.getButtonById(event.currentTarget.dataset.messageAction);
	const messageElement = event.target.closest('.message') as HTMLElement;
	const dataContext = Blaze.getData(messageElement);
	button?.action.call(dataContext, event, { tabbar: tabBar, chat: template.data.chatContext });
}

function handleFollowThreadButtonClick(event: JQuery.ClickEvent) {
	event.preventDefault();
	event.stopPropagation();
	const messageElement = event.target.closest('.message') as HTMLElement;
	const dataContext = Blaze.getData(messageElement);
	const { msg } = messageArgs(dataContext);
	callWithErrorHandling('followMessage', { mid: msg._id });
}

function handleUnfollowThreadButtonClick(event: JQuery.ClickEvent) {
	event.preventDefault();
	event.stopPropagation();
	const messageElement = event.target.closest('.message') as HTMLElement;
	const dataContext = Blaze.getData(messageElement);
	const { msg } = messageArgs(dataContext);
	callWithErrorHandling('unfollowMessage', { mid: msg._id });
}

function handleOpenThreadButtonClick(event: JQuery.ClickEvent) {
	event.preventDefault();
	event.stopPropagation();

	const messageElement = event.target.closest('.message') as HTMLElement;
	const dataContext = Blaze.getData(messageElement);
	const {
		msg: { rid, _id, tmid },
	} = messageArgs(dataContext);
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

function handleDownloadImageButtonClick(event: JQuery.ClickEvent) {
	const messageElement = event.target.closest('.message') as HTMLElement;
	const dataContext = Blaze.getData(messageElement);
	const { msg } = messageArgs(dataContext);
	ChatMessage.update({ '_id': msg._id, 'urls.url': $(event.currentTarget).data('url') }, { $set: { 'urls.$.downloadImages': true } });
	ChatMessage.update(
		{ '_id': msg._id, 'attachments.image_url': $(event.currentTarget).data('url') },
		{ $set: { 'attachments.$.downloadImages': true } },
	);
}

function handleOpenUserCardButtonClick(event: JQuery.ClickEvent, template: CommonRoomTemplateInstance) {
	const { rid, tabBar } = template.data;
	const messageElement = event.target.closest('.message') as HTMLElement;
	const dataContext = Blaze.getData(messageElement);
	const { msg } = messageArgs(dataContext);
	if (!Meteor.userId()) {
		return;
	}

	const { username } = msg.u;

	if (username) {
		openUserCard({
			username,
			rid,
			target: event.currentTarget,
			open: (e: MouseEvent) => {
				e.preventDefault();
				tabBar.openRoomInfo(username);
			},
		});
	}
}

function handleMessageActionMenuClick(event: JQuery.ClickEvent, template: CommonRoomTemplateInstance) {
	const { rid, tabBar } = template.data;
	const messageElement = event.target.closest('.message') as HTMLElement;
	const dataContext = Blaze.getData(messageElement);
	const messageContext = messageArgs(dataContext);
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
		action: () => item.action(event, { tabbar: tabBar, message, room, chat: template.data.chatContext }),
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
		rid,
		data: dataContext,
		type: 'message-action-menu-options',
		currentTarget: event.currentTarget,
		activeElement: messageElement,
		onRendered: () => new Clipboard('.rc-popover__item'),
	};

	popover.open(config);
}

function handleMentionLinkClick(event: JQuery.ClickEvent, template: CommonRoomTemplateInstance) {
	event.stopPropagation();
	event.preventDefault();

	if (!Meteor.userId()) {
		return;
	}

	const {
		currentTarget: {
			dataset: { channel, group, username },
		},
	} = event;

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
		const { rid, tabBar } = template.data;
		openUserCard({
			username,
			rid,
			target: event.currentTarget,
			open: (e: MouseEvent) => {
				e.preventDefault();
				tabBar.openRoomInfo(username);
			},
		});
	}
}

export const getCommonRoomEvents = (useLegacyMessageTemplate = true) => ({
	...createMessageTouchEvents(),
	'click [data-message-action]': handleMessageActionButtonClick,
	'click .js-follow-thread': handleFollowThreadButtonClick,
	'click .js-unfollow-thread': handleUnfollowThreadButtonClick,
	'click .js-open-thread': handleOpenThreadButtonClick,
	'click .image-to-download': handleDownloadImageButtonClick,
	'click .user-card-message': handleOpenUserCardButtonClick,
	'click .message-actions__menu': handleMessageActionMenuClick,
	...(useLegacyMessageTemplate && { 'click .mention-link': handleMentionLinkClick }),
});
