import Clipboard from 'clipboard';
import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { Blaze } from 'meteor/blaze';
import type { UIEvent } from 'react';
import { Tracker } from 'meteor/tracker';

import { popover, MessageAction } from '../../../../../ui-utils/client';
import { callWithErrorHandling } from '../../../../../../client/lib/utils/callWithErrorHandling';
import { isURL } from '../../../../../../lib/utils/isURL';
import { closeUserCard, openUserCard } from '../../../lib/userCard';
import { messageArgs } from '../../../../../../client/lib/utils/messageArgs';
import { Messages, Rooms, Subscriptions } from '../../../../../models/client';
import { t } from '../../../../../utils/client';
import { fireGlobalEvent } from '../../../../../../client/lib/utils/fireGlobalEvent';
import { isLayoutEmbedded } from '../../../../../../client/lib/utils/isLayoutEmbedded';
import { goToRoomById } from '../../../../../../client/lib/utils/goToRoomById';
import { mountPopover } from './mountPopover';
import type { CommonRoomTemplateInstance } from './CommonRoomTemplateInstance';
import { roomCoordinator } from '../../../../../../client/lib/rooms/roomCoordinator';
import { EmojiPicker } from '../../../../../emoji/client';

const createMessageTouchEvents = () => {
	let moved = false;
	let lastX: number | undefined = undefined;
	let lastY: number | undefined = undefined;
	let timer: ReturnType<typeof setTimeout> | undefined = undefined;

	return {
		'click .message img'(e: JQuery.ClickEvent) {
			clearTimeout(timer);
			if (moved) {
				e.preventDefault();
				e.stopPropagation();
			}
		},
		'touchstart .message'(event: JQuery.TouchStartEvent, template: CommonRoomTemplateInstance) {
			const touches = event.originalEvent?.touches;
			if (touches?.length) {
				lastX = touches[0].pageX;
				lastY = touches[0].pageY;
			}
			moved = false;
			if (touches?.length !== 1) {
				return;
			}

			if ((event.originalEvent?.currentTarget as HTMLElement | null)?.classList.contains('system')) {
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

			clearTimeout(timer);
			timer = setTimeout(doLongTouch, 500);
		},

		'touchend .message'(e: JQuery.TouchEndEvent) {
			clearTimeout(timer);
			if (e.target && e.target.nodeName === 'A' && isURL(e.target.getAttribute('href'))) {
				if (moved === true) {
					e.preventDefault();
					e.stopPropagation();
					return;
				}

				window.open(e.target.href);
			}
		},

		'touchmove .message'(e: JQuery.TouchMoveEvent) {
			const touches = e.originalEvent?.touches;
			if (touches?.length && lastX !== undefined && lastY !== undefined) {
				const deltaX = Math.abs(lastX - touches[0].pageX);
				const deltaY = Math.abs(lastY - touches[0].pageY);
				if (deltaX > 5 || deltaY > 5) {
					moved = true;
				}
			}
			clearTimeout(timer);
		},

		'touchcancel .message'() {
			clearTimeout(timer);
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
	if (!room) {
		throw new Error('Room not found');
	}

	FlowRouter.go(
		FlowRouter.getRouteName(),
		{
			rid,
			name: room.name ?? '',
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
	Messages.update({ '_id': msg._id, 'urls.url': event.currentTarget.dataset.url }, { $set: { 'urls.$.downloadImages': true } });
	Messages.update(
		{ '_id': msg._id, 'attachments.image_url': event.currentTarget.dataset.url },
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
			open: (e: UIEvent) => {
				e.preventDefault();
				tabBar.openRoomInfo(username);
			},
		});

		Tracker.autorun((c) => {
			FlowRouter.watchPathChange();

			if (!c.firstRun) {
				closeUserCard();
				c.stop();
			}
		});
	}
}

async function handleMessageActionMenuClick(event: JQuery.ClickEvent, template: CommonRoomTemplateInstance) {
	const { rid, tabBar } = template.data;
	const messageElement = event.target.closest('.message') as HTMLElement;
	const dataContext = Blaze.getData(messageElement);
	const messageContext = messageArgs(dataContext);
	const { msg: message, u: user, context: ctx } = messageContext;
	const room = Rooms.findOne({ _id: message.rid });
	if (!room) {
		throw new Error('Room not found');
	}
	const federationContext = isRoomFederated(room) ? 'federated' : '';
	// @ts-ignore
	const context = ctx || message.context || message.actionContext || federationContext || 'message';
	const allItems = (
		await MessageAction.getButtons({ ...messageContext, message, user, chat: template.data.chatContext }, context, 'menu')
	).map((item) => ({
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
			open: (e: UIEvent) => {
				e.preventDefault();
				tabBar.openRoomInfo(username);
			},
		});

		Tracker.autorun((c) => {
			FlowRouter.watchPathChange();

			if (!c.firstRun) {
				closeUserCard();
				c.stop();
			}
		});
	}
}

function handleAddReactionButtonClick(event: JQuery.ClickEvent) {
	event.preventDefault();
	event.stopPropagation();
	const data = Blaze.getData(event.currentTarget);
	const {
		msg: { rid, _id: mid, private: isPrivate },
	} = messageArgs(data);
	const user = Meteor.user();
	const room = Rooms.findOne({ _id: rid });

	if (!user || !room) {
		return false;
	}

	if (!Subscriptions.findOne({ rid })) {
		return false;
	}

	if (isPrivate) {
		return false;
	}

	if (roomCoordinator.readOnly(room._id, user) && !room.reactWhenReadOnly) {
		return false;
	}

	EmojiPicker.open(event.currentTarget, (emoji) => {
		callWithErrorHandling('setReaction', `:${emoji}:`, mid);
	});
}

function handleReactionButtonClick(event: JQuery.ClickEvent) {
	event.preventDefault();

	const data = Blaze.getData(event.currentTarget);
	const {
		msg: { _id: mid },
	} = messageArgs(data);
	callWithErrorHandling('setReaction', event.currentTarget.dataset.emoji ?? '', mid);
}

export const getCommonRoomEvents = () => ({
	...createMessageTouchEvents(),
	'click [data-message-action]': handleMessageActionButtonClick,
	'click .js-follow-thread': handleFollowThreadButtonClick,
	'click .js-unfollow-thread': handleUnfollowThreadButtonClick,
	'click .js-open-thread': handleOpenThreadButtonClick,
	'click .image-to-download': handleDownloadImageButtonClick,
	'click .user-card-message': handleOpenUserCardButtonClick,
	'click .message-actions__menu': handleMessageActionMenuClick,
	'click .mention-link': handleMentionLinkClick,
	'click .add-reaction': handleAddReactionButtonClick,
	'click .reactions > li:not(.add-reaction)': handleReactionButtonClick,
});
