import _ from 'underscore';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { ReactiveDict } from 'meteor/reactive-dict';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

import { ChatMessage, RoomRoles, Subscriptions, Rooms } from '../../../../models/client';
import { RoomHistoryManager, RoomManager, readMessage } from '../../../../ui-utils/client';
import { messageContext } from '../../../../ui-utils/client/lib/messageContext';
import { callbacks } from '../../../../../lib/callbacks';
import { ChatMessages } from '../../lib/chatMessages';
import { fileUpload } from '../../lib/fileUpload';
import { getCommonRoomEvents } from './lib/getCommonRoomEvents';
import { RoomManager as NewRoomManager } from '../../../../../client/lib/RoomManager';
import { roomCoordinator } from '../../../../../client/lib/rooms/roomCoordinator';
import { queryClient } from '../../../../../client/lib/queryClient';
import { call } from '../../../../../client/lib/utils/call';
import { dropzoneHelpers, dropzoneEvents } from './lib/dropzone';
import { retentionPolicyHelpers } from './lib/retentionPolicy';
import { chatMessages } from './lib/chatMessages';
import { isAtBottom } from './lib/scrolling';
import { dispatchToastMessage } from '../../../../../client/lib/toast';
import { roomEvents } from './lib/roomEvents';
import { roomHelpers } from './lib/roomHelpers';
import './room.html';

export { chatMessages, dropzoneHelpers, dropzoneEvents };

Template.roomOld.helpers({
	...dropzoneHelpers,
	...roomHelpers,
	...retentionPolicyHelpers,
	messageContext,
});

Template.roomOld.events({
	...getCommonRoomEvents(),
	...dropzoneEvents,
	...roomEvents,
});

Meteor.startup(() => {
	Template.roomOld.onCreated(function () {
		// this.scrollOnBottom = true
		// this.typing = new msgTyping this.data._id
		const rid = this.data._id;
		this.tabBar = this.data.tabBar;

		this.onFile = (filesToUpload) => {
			fileUpload(filesToUpload, chatMessages[rid].input, { rid });
		};

		this.rid = rid;

		this.subscription = new ReactiveVar();
		this.state = new ReactiveDict();
		this.userDetail = new ReactiveVar('');
		const user = Meteor.user();
		this.autorun((c) => {
			const room = Rooms.findOne(
				{ _id: rid },
				{
					fields: {
						t: 1,
						usernames: 1,
						uids: 1,
					},
				},
			);

			if (room.t !== 'd') {
				return c.stop();
			}

			if (roomCoordinator.getRoomDirectives(room.t)?.isGroupChat(room)) {
				return;
			}
			const usernames = Array.from(new Set(room.usernames));
			this.userDetail.set(
				this.userDetail.get() || (usernames.length === 1 ? usernames[0] : usernames.filter((username) => username !== user.username)[0]),
			);
		});

		this.autorun(() => {
			const rid = Template.currentData()._id;
			const room = Rooms.findOne({ _id: rid }, { fields: { announcement: 1 } });
			this.state.set('announcement', room.announcement);
		});

		this.autorun(() => {
			const subscription = Subscriptions.findOne({ rid });
			this.subscription.set(subscription);
			this.state.set({
				subscribed: !!subscription,
				autoTranslate: subscription && subscription.autoTranslate,
				autoTranslateLanguage: subscription && subscription.autoTranslateLanguage,
			});
		});

		this.showUsersOffline = new ReactiveVar(false);
		this.atBottom = !FlowRouter.getQueryParam('msg');
		this.unreadCount = new ReactiveVar(0);

		this.selectable = new ReactiveVar(false);
		this.selectedMessages = [];
		this.selectedRange = [];
		this.selectablePointer = null;

		this.flexTemplate = new ReactiveVar();

		this.groupDetail = new ReactiveVar();

		this.hideLeaderHeader = new ReactiveVar(false);

		this.resetSelection = (enabled) => {
			this.selectable.set(enabled);
			$('.messages-box .message.selected').removeClass('selected');
			this.selectedMessages = [];
			this.selectedRange = [];
			this.selectablePointer = null;
		};

		this.selectMessages = (to) => {
			if (this.selectablePointer === to && this.selectedRange.length > 0) {
				this.selectedRange = [];
			} else {
				const message1 = ChatMessage.findOne(this.selectablePointer);
				const message2 = ChatMessage.findOne(to);

				const minTs = _.min([message1.ts, message2.ts]);
				const maxTs = _.max([message1.ts, message2.ts]);

				this.selectedRange = _.pluck(ChatMessage.find({ rid: message1.rid, ts: { $gte: minTs, $lte: maxTs } }).fetch(), '_id');
			}
		};

		this.getSelectedMessages = () => {
			let previewMessages;
			const messages = this.selectedMessages;
			let addMessages = false;
			for (const message of Array.from(this.selectedRange)) {
				if (messages.indexOf(message) === -1) {
					addMessages = true;
					break;
				}
			}

			if (addMessages) {
				previewMessages = _.compact(_.uniq(this.selectedMessages.concat(this.selectedRange)));
			} else {
				previewMessages = _.compact(_.difference(this.selectedMessages, this.selectedRange));
			}

			return previewMessages;
		};

		this.clearUserDetail = () => {
			this.userDetail.set(null);
			this.tabBar.setData({});
			this.tabBar.close();
		};

		queryClient
			.fetchQuery({
				queryKey: ['room', this.data._id, 'roles'],
				queryFn: () => call('getRoomRoles', this.data._id),
				staleTime: 15_000,
			})
			.then((results) => {
				Array.from(results).forEach(({ _id, ...data }) => {
					const {
						rid,
						u: { _id: uid },
					} = data;
					RoomRoles.upsert({ rid, 'u._id': uid }, data);
				});
			})
			.catch((error) => {
				dispatchToastMessage({ type: 'error', message: error });
			});

		this.rolesObserve = RoomRoles.find({ rid: this.data._id }).observe({
			added: (role) => {
				if (!role.u || !role.u._id) {
					return;
				}
				ChatMessage.update({ 'rid': this.data._id, 'u._id': role.u._id }, { $addToSet: { roles: role._id } }, { multi: true });
			}, // Update message to re-render DOM
			changed: (role) => {
				if (!role.u || !role.u._id) {
					return;
				}
				ChatMessage.update({ 'rid': this.data._id, 'u._id': role.u._id }, { $inc: { rerender: 1 } }, { multi: true });
			}, // Update message to re-render DOM
			removed: (role) => {
				if (!role.u || !role.u._id) {
					return;
				}
				ChatMessage.update({ 'rid': this.data._id, 'u._id': role.u._id }, { $pull: { roles: role._id } }, { multi: true });
			},
		});

		this.sendToBottomIfNecessary = () => {
			if (this.atBottom === true) {
				this.sendToBottom();
			}
		};
	}); // Update message to re-render DOM

	Template.roomOld.onDestroyed(function () {
		if (this.rolesObserve) {
			this.rolesObserve.stop();
		}

		readMessage.off(this.data._id);

		window.removeEventListener('resize', this.onWindowResize);

		this.observer && this.observer.disconnect();

		const chatMessage = chatMessages[this.data._id];
		chatMessage.onDestroyed && chatMessage.onDestroyed(this.data._id);

		callbacks.remove('streamNewMessage', this.data._id);
	});

	Template.roomOld.onRendered(function () {
		const { _id: rid } = this.data;

		if (!chatMessages[rid]) {
			chatMessages[rid] = new ChatMessages();
		}

		const wrapper = this.find('.wrapper');

		const store = NewRoomManager.getStore(rid);

		const afterMessageGroup = () => {
			if (store.scroll && !store.atBottom) {
				wrapper.scrollTop = store.scroll;
			} else {
				this.sendToBottom();
			}
			wrapper.removeEventListener('MessageGroup', afterMessageGroup);

			wrapper.addEventListener(
				'scroll',
				_.throttle(() => {
					store.update({ scroll: wrapper.scrollTop, atBottom: isAtBottom(wrapper, 50) });
				}, 30),
			);
		};

		wrapper.addEventListener('MessageGroup', afterMessageGroup);

		chatMessages[rid].initializeWrapper(this.find('.wrapper'));
		chatMessages[rid].initializeInput(this.find('.js-input-message'), { rid });

		const wrapperUl = this.find('.wrapper > ul');
		const newMessage = this.find('.new-message');

		const template = this;

		const messageBox = $('.messages-box');

		template.isAtBottom = function (scrollThreshold = 0) {
			if (isAtBottom(wrapper, scrollThreshold)) {
				newMessage.className = 'new-message background-primary-action-color color-content-background-color not';
				return true;
			}
			return false;
		};

		template.sendToBottom = function () {
			wrapper.scrollTo(30, wrapper.scrollHeight);
			newMessage.className = 'new-message background-primary-action-color color-content-background-color not';
		};

		template.checkIfScrollIsAtBottom = function () {
			template.atBottom = template.isAtBottom(100);
		};

		template.observer = new ResizeObserver(() => template.sendToBottomIfNecessary());

		template.observer.observe(wrapperUl);

		const wheelHandler = _.throttle(function () {
			template.checkIfScrollIsAtBottom();
		}, 100);

		wrapper.addEventListener('mousewheel', wheelHandler);

		wrapper.addEventListener('wheel', wheelHandler);

		wrapper.addEventListener('touchstart', () => {
			template.atBottom = false;
		});

		wrapper.addEventListener('touchend', function () {
			template.checkIfScrollIsAtBottom();
			setTimeout(() => template.checkIfScrollIsAtBottom(), 1000);
			setTimeout(() => template.checkIfScrollIsAtBottom(), 2000);
		});

		Tracker.afterFlush(() => {
			wrapper.addEventListener('scroll', wheelHandler);
		});

		this.lastScrollTop = $('.messages-box .wrapper').scrollTop();

		const rtl = $('html').hasClass('rtl');

		const getElementFromPoint = function (topOffset = 0) {
			const messageBoxOffset = messageBox.offset();

			let element;
			if (rtl) {
				element = document.elementFromPoint(messageBoxOffset.left + messageBox.width() - 1, messageBoxOffset.top + topOffset + 1);
			} else {
				element = document.elementFromPoint(messageBoxOffset.left + 1, messageBoxOffset.top + topOffset + 1);
			}

			if (element && element.classList.contains('message')) {
				return element;
			}
		};

		const updateUnreadCount = _.throttle(() => {
			Tracker.afterFlush(() => {
				const lastInvisibleMessageOnScreen = getElementFromPoint(0) || getElementFromPoint(20) || getElementFromPoint(40);

				if (!lastInvisibleMessageOnScreen || !lastInvisibleMessageOnScreen.id) {
					return this.unreadCount.set(0);
				}

				const lastMessage = ChatMessage.findOne(lastInvisibleMessageOnScreen.id);
				if (!lastMessage) {
					return this.unreadCount.set(0);
				}

				this.state.set('lastMessage', lastMessage.ts);
			});
		}, 300);

		const read = _.debounce(function () {
			if (rid !== Session.get('openedRoom')) {
				return;
			}
			readMessage.read(rid);
		}, 500);

		this.autorun(() => {
			Tracker.afterFlush(() => {
				if (rid !== Session.get('openedRoom')) {
					return;
				}

				let room = Rooms.findOne({ _id: rid }, { fields: { t: 1 } });

				if (room?.t === 'l') {
					room = Tracker.nonreactive(() => Rooms.findOne({ _id: rid }));
					roomCoordinator.getRoomDirectives(room.t)?.openCustomProfileTab(this, room, room.v.username);
				}
			});
		});

		this.autorun(() => {
			if (!roomCoordinator.isRouteNameKnown(FlowRouter.getRouteName())) {
				return;
			}

			if (rid !== Session.get('openedRoom')) {
				return;
			}

			const subscription = Subscriptions.findOne({ rid }, { fields: { alert: 1, unread: 1 } });
			read();
			return subscription && (subscription.alert || subscription.unread) && readMessage.refreshUnreadMark(rid);
		});

		this.autorun(() => {
			const lastMessage = this.state.get('lastMessage');

			const subscription = Subscriptions.findOne({ rid }, { fields: { ls: 1 } });
			if (!subscription) {
				this.unreadCount.set(0);
				return;
			}

			const count = ChatMessage.find({
				rid,
				ts: { $lte: lastMessage, $gt: subscription && subscription.ls },
			}).count();

			this.unreadCount.set(count);
		});

		this.autorun(() => {
			const count = RoomHistoryManager.getRoom(rid).unreadNotLoaded.get() + this.unreadCount.get();
			this.state.set('count', count);
		});

		this.autorun(() => {
			Rooms.findOne(rid);
			const count = this.state.get('count');
			if (count === 0) {
				return read();
			}
			readMessage.refreshUnreadMark(rid);
		});

		readMessage.on(template.data._id, () => this.unreadCount.set(0));

		wrapper.addEventListener('scroll', updateUnreadCount);
		// save the render's date to display new messages alerts
		$.data(this.firstNode, 'renderedAt', new Date());

		callbacks.add(
			'streamNewMessage',
			(msg) => {
				if (rid !== msg.rid || msg.editedAt || msg.tmid) {
					return;
				}

				if (msg.u._id === Meteor.userId()) {
					return template.sendToBottom();
				}

				if (!template.isAtBottom()) {
					newMessage.classList.remove('not');
				}
			},
			callbacks.priority.MEDIUM,
			rid,
		);

		this.autorun(function () {
			if (template.data._id !== RoomManager.openedRoom) {
				return;
			}

			const room = Rooms.findOne({ _id: template.data._id });
			if (!room) {
				return FlowRouter.go('home');
			}
		});
	});
});
