import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import type { IEditedMessage, IMessage } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { Template } from 'meteor/templating';

import { ChatMessage } from '../../../../../models/client';
import { RoomHistoryManager, RoomManager, readMessage } from '../../../../../ui-utils/client';
import { callbacks } from '../../../../../../lib/callbacks';
import { ChatMessages, chatMessages } from '../../../lib/ChatMessages';
import { RoomManager as NewRoomManager } from '../../../../../../client/lib/RoomManager';
import { roomCoordinator } from '../../../../../../client/lib/rooms/roomCoordinator';
import { isAtBottom } from './scrolling';
import type { RoomTemplateInstance } from './RoomTemplateInstance';
import { difference, maxDate, minDate, unique } from '../../../../../../lib/utils/comparisons';
import { isTruthy } from '../../../../../../lib/isTruthy';
import { withDebouncing, withThrottling } from '../../../../../../lib/utils/highOrderFunctions';

export function onRoomCreated(this: RoomTemplateInstance) {
	this.selectedMessages = [];
	this.selectedRange = [];
	this.selectablePointer = undefined;
	this.atBottom = !FlowRouter.getQueryParam('msg');

	this.resetSelection = (enabled: boolean) => {
		this.data.setSelectable(enabled);
		this.find('.messages-box')
			?.querySelectorAll('.message.selected')
			.forEach((message) => message.classList.remove('selected'));
		this.selectedMessages = [];
		this.selectedRange = [];
		this.selectablePointer = undefined;
	};

	this.selectMessages = (to) => {
		if (this.selectablePointer === to && this.selectedRange.length > 0) {
			this.selectedRange = [];
		} else {
			const message1 = ChatMessage.findOne(this.selectablePointer);
			const message2 = ChatMessage.findOne(to);

			if (!message1 || !message2) {
				throw new Error('Invalid message selection');
			}

			const minTs = minDate(message1.ts, message2.ts);
			const maxTs = maxDate(message1.ts, message2.ts);

			this.selectedRange = ChatMessage.find({ rid: message1.rid, ts: { $gte: minTs, $lte: maxTs } }).map((message) => message._id);
		}
	};

	this.getSelectedMessages = () => {
		const messages = this.selectedMessages;
		let addMessages = false;
		for (const message of Array.from(this.selectedRange)) {
			if (messages.includes(message)) {
				addMessages = true;
				break;
			}
		}

		if (addMessages) {
			return unique([...this.selectedMessages, ...this.selectedRange]).filter(isTruthy);
		}

		return difference(this.selectedMessages, this.selectedRange).filter(isTruthy);
	};

	this.sendToBottomIfNecessary = () => {
		if (this.atBottom === true) {
			this.sendToBottom();
		}
	};

	this.isAtBottom = (scrollThreshold = 0) => {
		const wrapper = this.find('.wrapper');
		const newMessage = this.find('.new-message');

		if (isAtBottom(wrapper, scrollThreshold)) {
			newMessage.className = 'new-message background-primary-action-color color-content-background-color not';
			return true;
		}
		return false;
	};

	this.sendToBottom = () => {
		const wrapper = this.find('.wrapper');
		const newMessage = this.find('.new-message');

		wrapper.scrollTo(30, wrapper.scrollHeight);
		newMessage.className = 'new-message background-primary-action-color color-content-background-color not';
	};

	this.checkIfScrollIsAtBottom = () => {
		this.atBottom = this.isAtBottom(100);
	};
}

export function onRoomDestroyed(this: RoomTemplateInstance) {
	// @ts-ignore
	readMessage.off(this.data._id);

	this.observer?.disconnect();

	const chatMessage = chatMessages[this.data._id];
	chatMessage.onDestroyed?.(this.data._id);

	callbacks.remove('streamNewMessage', this.data._id);
}

export function onRoomRendered(this: RoomTemplateInstance) {
	const { _id: rid } = this.data;

	if (!chatMessages[rid]) {
		chatMessages[rid] = new ChatMessages();
	}

	const wrapper = this.find('.wrapper');

	const store = NewRoomManager.getStore(rid);

	const afterMessageGroup = () => {
		if (store?.scroll && !store.atBottom) {
			wrapper.scrollTop = store.scroll;
		} else {
			this.sendToBottom();
		}
		wrapper.removeEventListener('MessageGroup', afterMessageGroup);

		const handleWrapperScroll = withThrottling({ wait: 30 })(() => {
			store?.update({ scroll: wrapper.scrollTop, atBottom: isAtBottom(wrapper, 50) });
		});

		wrapper.addEventListener('scroll', handleWrapperScroll);
	};

	wrapper.addEventListener('MessageGroup', afterMessageGroup);

	chatMessages[rid].initializeWrapper(this.find('.wrapper'));
	chatMessages[rid].initializeInput(this.find('.js-input-message') as HTMLTextAreaElement, { rid });

	const wrapperUl = this.find('.wrapper > ul');

	this.observer = new ResizeObserver(() => this.sendToBottomIfNecessary());

	this.observer.observe(wrapperUl);

	const handleWheel = withThrottling({ wait: 100 })(() => {
		this.checkIfScrollIsAtBottom();
	});

	wrapper.addEventListener('mousewheel', handleWheel);

	wrapper.addEventListener('wheel', handleWheel);

	wrapper.addEventListener('touchstart', () => {
		this.atBottom = false;
	});

	wrapper.addEventListener('touchend', () => {
		this.checkIfScrollIsAtBottom();
		setTimeout(() => this.checkIfScrollIsAtBottom(), 1000);
		setTimeout(() => this.checkIfScrollIsAtBottom(), 2000);
	});

	Tracker.afterFlush(() => {
		wrapper.addEventListener('scroll', handleWheel);
	});

	this.lastScrollTop = $(wrapper).scrollTop() ?? 0;

	const getElementFromPoint = (topOffset = 0) => {
		const messageBox = this.find('.messages-box');
		const messageBoxOffset = $(messageBox).offset();
		const messageBoxWidth = $(messageBox).width();

		if (messageBoxOffset === undefined || messageBoxWidth === undefined) {
			return undefined;
		}

		let element;
		if (document.dir === 'rtl') {
			element = document.elementFromPoint(messageBoxOffset.left + messageBoxWidth - 1, messageBoxOffset.top + topOffset + 1);
		} else {
			element = document.elementFromPoint(messageBoxOffset.left + 1, messageBoxOffset.top + topOffset + 1);
		}

		if (element?.classList.contains('message')) {
			return element;
		}
	};

	const updateUnreadCount = withThrottling({ wait: 300 })(() => {
		Tracker.afterFlush(() => {
			const lastInvisibleMessageOnScreen = getElementFromPoint(0) || getElementFromPoint(20) || getElementFromPoint(40);

			if (!lastInvisibleMessageOnScreen || !lastInvisibleMessageOnScreen.id) {
				return this.data.setUnreadCount(0);
			}

			const lastMessage = ChatMessage.findOne(lastInvisibleMessageOnScreen.id);
			if (!lastMessage) {
				return this.data.setUnreadCount(0);
			}

			this.data.setLastMessage(lastMessage.ts);
		});
	});

	this.autorun(() => {
		const { room } = Template.currentData() as RoomTemplateInstance['data'];

		Tracker.afterFlush(() => {
			if (rid !== Session.get('openedRoom')) {
				return;
			}

			if (room && isOmnichannelRoom(room)) {
				roomCoordinator.getRoomDirectives(room.t)?.openCustomProfileTab(this, room, room.v.username);
			}
		});
	});

	const debouncedReadMessageRead = withDebouncing({ wait: 500 })(() => {
		if (rid !== Session.get('openedRoom')) {
			return;
		}
		readMessage.read(rid);
	});

	this.autorun(() => {
		if (!roomCoordinator.isRouteNameKnown(FlowRouter.getRouteName())) {
			return;
		}

		if (rid !== Session.get('openedRoom')) {
			return;
		}

		const { subscription } = Template.currentData() as RoomTemplateInstance['data'];
		debouncedReadMessageRead();
		return subscription && (subscription.alert || subscription.unread) && readMessage.refreshUnreadMark(rid);
	});

	this.autorun(() => {
		const { lastMessage, setUnreadCount, subscription } = Template.currentData() as RoomTemplateInstance['data'];

		if (!subscription) {
			setUnreadCount(0);
			return;
		}

		const count = ChatMessage.find({
			rid,
			ts: { $lte: lastMessage, $gt: subscription?.ls },
		}).count();

		setUnreadCount(count);
	});

	this.autorun(() => {
		const { setCount, unreadCount } = Template.currentData() as RoomTemplateInstance['data'];
		const count = RoomHistoryManager.getRoom(rid).unreadNotLoaded.get() + unreadCount;
		setCount(count);
	});

	this.autorun(() => {
		const { count } = Template.currentData() as RoomTemplateInstance['data'];

		if (count === 0) {
			return debouncedReadMessageRead();
		}
		readMessage.refreshUnreadMark(rid);
	});

	readMessage.on(this.data._id, () => this.data.setUnreadCount(0));

	wrapper.addEventListener('scroll', updateUnreadCount);

	callbacks.add(
		'streamNewMessage',
		(msg: IMessage) => {
			if (rid !== msg.rid || (msg as IEditedMessage).editedAt || msg.tmid) {
				return;
			}

			if (msg.u._id === Meteor.userId()) {
				return this.sendToBottom();
			}

			if (!this.isAtBottom()) {
				const newMessage = this.find('.new-message');
				newMessage.classList.remove('not');
			}
		},
		callbacks.priority.MEDIUM,
		rid,
	);

	this.autorun(() => {
		if (this.data._id !== RoomManager.openedRoom) {
			return;
		}

		const { room } = Template.currentData() as RoomTemplateInstance['data'];

		if (!room) {
			return FlowRouter.go('home');
		}
	});
}
