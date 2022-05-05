import Clipboard from 'clipboard';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { popover, MessageAction } from '../../../../../ui-utils/client';
import { addMessageToList } from '../../../../../ui-utils/client/lib/MessageAction';
import { callWithErrorHandling } from '../../../../../../client/lib/utils/callWithErrorHandling';
import { isURL } from '../../../../../utils/lib/isURL';
import { openUserCard } from '../../../lib/UserCard';
import { messageArgs } from '../../../../../ui-utils/client/lib/messageArgs';
import { ChatMessage, Rooms, Messages } from '../../../../../models';
import { t } from '../../../../../utils/client';
import { chatMessages } from '../room';
import { EmojiEvents } from '../../../../../reactions/client/init';
// import { goToRoomById } from '../../../../../../client/lib/goToRoomById';
import { fireGlobalEvent } from '../../../../../../client/lib/utils/fireGlobalEvent';
import { isLayoutEmbedded } from '../../../../../../client/lib/utils/isLayoutEmbedded';
import { onClientBeforeSendMessage } from '../../../../../../client/lib/onClientBeforeSendMessage';
import { goToRoomById } from '../../../../../../client/lib/utils/goToRoomById';

const mountPopover = (e, i, outerContext) => {
	let context = $(e.target).parents('.message').data('context');
	if (!context) {
		context = 'message';
	}

	const messageContext = messageArgs(outerContext);

	let menuItems = MessageAction.getButtons({ ...messageContext, message: messageContext.msg }, context, 'menu').map((item) => ({
		icon: item.icon,
		name: t(item.label),
		type: 'message-action',
		id: item.id,
		modifier: item.color,
	}));

	if (window.matchMedia('(max-width: 500px)').matches) {
		const messageItems = MessageAction.getButtons(messageContext, context, 'message').map((item) => ({
			icon: item.icon,
			name: t(item.label),
			type: 'message-action',
			id: item.id,
			modifier: item.color,
		}));

		menuItems = menuItems.concat(messageItems);
	}

	const [items, deleteItem] = menuItems.reduce(
		(result, value) => {
			result[value.id === 'delete-message' ? 1 : 0].push(value);
			return result;
		},
		[[], []],
	);
	const groups = [{ items }];

	if (deleteItem.length) {
		groups.push({ items: deleteItem });
	}

	const config = {
		columns: [
			{
				groups,
			},
		],
		instance: i,
		currentTarget: e.currentTarget,
		data: outerContext,
		activeElement: $(e.currentTarget).parents('.message')[0],
		onRendered: () => new Clipboard('.rc-popover__item'),
	};

	popover.open(config);
};

export const getCommonRoomEvents = () => ({
	...(() => {
		let touchMoved = false;
		let lastTouchX = null;
		let lastTouchY = null;

		let touchtime = null;
		return {
			...EmojiEvents,
			'click .message img'(e) {
				clearTimeout(touchtime);
				if (touchMoved === true) {
					e.preventDefault();
					e.stopPropagation();
				}
			},

			'touchstart .message'(e) {
				const { touches } = e.originalEvent;
				if (touches && touches.length) {
					lastTouchX = touches[0].pageX;
					lastTouchY = touches[0].pagey;
				}
				touchMoved = false;
				if (e.originalEvent.touches.length !== 1) {
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

			'touchend .message'(e) {
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

			'touchmove .message'(e) {
				const { touches } = e.originalEvent;
				if (touches && touches.length) {
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
	})(),
	'click [data-message-action]'(event, template) {
		const button = MessageAction.getButtonById(event.currentTarget.dataset.messageAction);
		if ((button != null ? button.action : undefined) != null) {
			button.action.call(this, event, { tabBar: template.tabBar, rid: template.data.rid });
		}
	},
	'click .js-follow-thread'(e) {
		e.preventDefault();
		e.stopPropagation();
		const { msg } = messageArgs(this);
		callWithErrorHandling('followMessage', { mid: msg._id });
	},
	'click .js-unfollow-thread'(e) {
		e.preventDefault();
		e.stopPropagation();
		const { msg } = messageArgs(this);
		callWithErrorHandling('unfollowMessage', { mid: msg._id });
	},
	'click .js-open-thread'(event) {
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
			{
				jump: tmid && tmid !== _id && _id && _id,
			},
		);
	},

	'click .image-to-download'(event) {
		const { msg } = messageArgs(this);
		ChatMessage.update({ '_id': msg._id, 'urls.url': $(event.currentTarget).data('url') }, { $set: { 'urls.$.downloadImages': true } });
		ChatMessage.update(
			{ '_id': msg._id, 'attachments.image_url': $(event.currentTarget).data('url') },
			{ $set: { 'attachments.$.downloadImages': true } },
		);
	},
	'click .user-card-message'(e, instance) {
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
				open: (e) => {
					e.preventDefault();
					instance.data.tabBar.openUserInfo(username);
				},
			});
		}
	},
	// 'click .js-follow-thread'(e) {
	// 	e.preventDefault();
	// 	e.stopPropagation();
	// 	const { msg } = messageArgs(this);
	// 	call('followMessage', { mid: msg._id });
	// },
	// 'click .js-unfollow-thread'(e) {
	// 	e.preventDefault();
	// 	e.stopPropagation();
	// 	const { msg } = messageArgs(this);
	// 	call('unfollowMessage', { mid: msg._id });
	// },
	// 'click .js-open-thread'(event) {
	// 	event.preventDefault();
	// 	event.stopPropagation();

	// 	const { msg: { rid, _id, tmid } } = messageArgs(this);
	// 	const room = Rooms.findOne({ _id: rid });

	// 	FlowRouter.go(FlowRouter.getRouteName(), {
	// 		rid,
	// 		name: room.name,
	// 		tab: 'thread',
	// 		context: tmid || _id,
	// 	}, {
	// 		jump: tmid && tmid !== _id && _id && _id,
	// 	});
	// },

	// 'click .user-card-message'(e, instance) {
	// 	const { msg } = messageArgs(this);
	// 	if (!Meteor.userId()) {
	// 		return;
	// 	}

	// 	const { username } = msg.u;

	// 	if (username) {
	// 		openUserCard({
	// 			username,
	// 			rid: instance.data.rid,
	// 			target: e.currentTarget,
	// 			open: (e) => {
	// 				e.preventDefault();
	// 				instance.data.tabBar.openUserInfo(username);
	// 			},
	// 		});
	// 	}
	// },
	'click .js-actionButton-respondWithMessage'(event, instance) {
		const { rid } = instance.data;
		const msg = event.currentTarget.value;
		if (!msg) {
			return;
		}

		const { input } = chatMessages[rid];
		input.value = msg;
		input.focus();
	},
	async 'click .js-actionButton-respondWithQuotedMessage'(event, instance) {
		const { rid } = instance.data;
		const { id: msgId } = event.currentTarget;
		const { $input } = chatMessages[rid];

		if (!msgId) {
			return;
		}

		const message = Messages.findOne({ _id: msgId });

		let messages = $input.data('reply') || [];
		messages = addMessageToList(messages, message);

		$input.focus().data('mention-user', false).data('reply', messages).trigger('dataChange');
	},
	async 'click .js-actionButton-sendMessage'(event, instance) {
		const { rid } = instance.data;
		const msg = event.currentTarget.value;
		let msgObject = { _id: Random.id(), rid, msg };
		if (!msg) {
			return;
		}

		msgObject = await onClientBeforeSendMessage(msgObject);

		const _chatMessages = chatMessages[rid];
		if (_chatMessages && (await _chatMessages.processSlashCommand(msgObject))) {
			return;
		}

		await callWithErrorHandling('sendMessage', msgObject);
	},
	'click .message-actions__menu'(e, template) {
		const messageContext = messageArgs(this);
		const { msg: message, u: user, context: ctx } = messageContext;
		const context = ctx || message.context || message.actionContext || 'message';
		const room = Rooms.findOne({ _id: template.data.rid });

		const allItems = MessageAction.getButtons({ ...messageContext, message, user }, context, 'menu').map((item) => ({
			icon: item.icon,
			name: t(item.label),
			type: 'message-action',
			id: item.id,
			modifier: item.color,
			action: () => item.action(e, { tabbar: template.tabbar, message, room }),
		}));

		const itemsBelowDivider = ['delete-message', 'report-message'];
		const [items, alertsItem] = allItems.reduce(
			(result, value) => {
				result[itemsBelowDivider.includes(value.id) ? 1 : 0].push(value);
				return result;
			},
			[[], []],
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
	},
	'click .mention-link'(e, instance) {
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
				open: (e) => {
					e.preventDefault();
					instance.data.tabBar.openUserInfo(username);
				},
			});
		}
	},
});
