import _ from 'underscore';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { chatMessages, ChatMessages } from '../../../ui';
import { callWithErrorHandling } from '../../../../client/lib/utils/callWithErrorHandling';
import { messageContext } from '../../../ui-utils/client/lib/messageContext';
import { upsertMessageBulk } from '../../../ui-utils/client/lib/RoomHistoryManager';
import { Messages } from '../../../models';
import { fileUpload } from '../../../ui/client/lib/fileUpload';
import { dropzoneEvents, dropzoneHelpers } from '../../../ui/client/views/app/room';
import './thread.html';
import { getUserPreference } from '../../../utils';
import { settings } from '../../../settings/client';
import { callbacks } from '../../../../lib/callbacks';
import './messageBoxFollow';
import { getCommonRoomEvents } from '../../../ui/client/views/app/lib/getCommonRoomEvents';
import { keyCodes } from '../../../../client/lib/utils/keyCodes';

const sort = { ts: 1 };

Template.thread.events({
	...dropzoneEvents,
	...getCommonRoomEvents(),
	'click .js-close'(e) {
		e.preventDefault();
		e.stopPropagation();
		const { close } = this;
		return close && close();
	},
	'scroll .js-scroll-thread': _.throttle(({ currentTarget: e }, i) => {
		i.atBottom = e.scrollTop >= e.scrollHeight - e.clientHeight;
	}, 150),
	'click .toggle-hidden'(e) {
		const id = e.currentTarget.dataset.message;
		document.querySelector(`#thread-${id}`).classList.toggle('message--ignored');
	},
});

Template.thread.helpers({
	...dropzoneHelpers,
	mainMessage() {
		const { Threads, state } = Template.instance();
		const tmid = state.get('tmid');
		return Threads.findOne({ _id: tmid });
	},
	isLoading() {
		return Template.instance().state.get('loading') !== false;
	},
	messages() {
		const { Threads, state } = Template.instance();
		const tmid = state.get('tmid');

		return Threads.find({ tmid, _id: { $ne: tmid } }, { sort });
	},
	messageContext() {
		const result = messageContext.call(this, { rid: this.mainMessage.rid });
		return {
			...result,
			settings: {
				...result.settings,
				showReplyButton: false,
				showreply: false,
			},
		};
	},
	messageBoxData() {
		const instance = Template.instance();
		const {
			mainMessage: { rid, _id: tmid },
			subscription,
		} = Template.currentData();

		const showFormattingTips = settings.get('Message_ShowFormattingTips');
		return {
			showFormattingTips,
			tshow: instance.state.get('sendToChannel'),
			subscription,
			rid,
			tmid,
			onSend: (...args) => {
				instance.sendToBottom();
				instance.state.set('sendToChannel', false);
				return instance.chatMessages && instance.chatMessages.send.apply(instance.chatMessages, args);
			},
			onKeyUp: (...args) => instance.chatMessages && instance.chatMessages.keyup.apply(instance.chatMessages, args),
			onKeyDown: (...args) => {
				const result = instance.chatMessages && instance.chatMessages.keydown.apply(instance.chatMessages, args);
				const [event] = args;

				const { which: keyCode } = event;

				if (keyCode === keyCodes.ESCAPE && !result && !event.target.value.trim()) {
					const {
						route: { name },
						params: { context, tab, ...params },
					} = FlowRouter.current();
					FlowRouter.go(name, params);
				}
			},
		};
	},
	hideUsername() {
		return getUserPreference(Meteor.userId(), 'hideUsernames') ? 'hide-usernames' : undefined;
	},
	checkboxData() {
		const instance = Template.instance();
		const checked = instance.state.get('sendToChannel');
		return {
			id: 'sendAlso',
			checked,
			onChange: () => instance.state.set('sendToChannel', !checked),
		};
	},
});

Template.thread.onRendered(function () {
	const rid = Tracker.nonreactive(() => this.state.get('rid'));
	const tmid = Tracker.nonreactive(() => this.state.get('tmid'));
	this.atBottom = true;

	this.chatMessages = new ChatMessages(this.Threads);
	this.chatMessages.initializeWrapper(this.find('.js-scroll-thread'));
	this.chatMessages.initializeInput(this.find('.js-input-message'), { rid, tmid });

	this.sendToBottom = _.throttle(() => {
		this.atBottom = true;
		this.chatMessages.wrapper.scrollTop = this.chatMessages.wrapper.scrollHeight;
	}, 300);

	this.sendToBottomIfNecessary = () => {
		this.atBottom && this.sendToBottom();
	};

	const observer = new ResizeObserver(this.sendToBottomIfNecessary);
	observer.observe(this.firstNode.querySelector('.js-scroll-thread ul'));

	this.onFile = (filesToUpload) => {
		fileUpload(filesToUpload, this.chatMessages.input, {
			rid: this.state.get('rid'),
			tmid: this.state.get('tmid'),
		});
	};

	this.autorun(() => {
		const rid = this.state.get('rid');
		const tmid = this.state.get('tmid');
		if (!rid) {
			return;
		}
		this.callbackRemove && this.callbackRemove();

		this.callbackRemove = () => callbacks.remove('streamNewMessage', `thread-${rid}`);

		callbacks.add(
			'streamNewMessage',
			_.debounce((msg) => {
				if (Session.get('openedRoom') !== msg.rid || rid !== msg.rid || msg.editedAt || msg.tmid !== tmid) {
					return;
				}
				Meteor.call('readThreads', tmid);
			}, 1000),
			callbacks.priority.MEDIUM,
			`thread-${rid}`,
		);
	});

	this.autorun(() => {
		const tmid = this.state.get('tmid');
		this.threadsObserve && this.threadsObserve.stop();

		this.threadsObserve = Messages.find(
			{ $or: [{ tmid }, { _id: tmid }], _hidden: { $ne: true } },
			{
				fields: {
					collapsed: 0,
					threadMsg: 0,
					repliesCount: 0,
				},
			},
		).observe({
			added: ({ _id, ...message }) => {
				this.Threads.upsert({ _id }, message);
			},
			changed: ({ _id, ...message }) => {
				this.Threads.update({ _id }, message);
			},
			removed: ({ _id }) => this.Threads.remove(_id),
		});

		this.loadMore();
	});

	this.autorun(() => {
		const rid = this.state.get('rid');
		const tmid = this.state.get('tmid');
		this.chatMessages.initializeInput(this.find('.js-input-message'), { rid, tmid });
		if (rid && tmid) {
			chatMessages[`${rid}-${tmid}`] = this.chatMessages;
		}
	});

	this.autorun(() => {
		FlowRouter.watchPathChange();
		const jump = FlowRouter.getQueryParam('jump');
		const { mainMessage } = Template.currentData();
		this.state.set({
			tmid: mainMessage._id,
			rid: mainMessage.rid,
			jump,
		});
	});

	this.autorun(() => {
		const jump = this.state.get('jump');
		const loading = this.state.get('loading');

		if (jump && this.lastJump !== jump && loading === false) {
			this.lastJump = jump;
			this.find('.js-scroll-thread').style.scrollBehavior = 'smooth';
			this.state.set('jump', null);
			Tracker.afterFlush(() => {
				const message = this.find(`#thread-${jump}`);
				message.classList.add('highlight');
				const removeClass = () => {
					message.classList.remove('highlight');
					message.removeEventListener('animationend', removeClass);
				};
				message.addEventListener('animationend', removeClass);
				setTimeout(() => {
					message.scrollIntoView();
				}, 300);
			});
		}
	});
});

Template.thread.onCreated(async function () {
	this.Threads = new Mongo.Collection(null);

	this.state = new ReactiveDict({
		sendToChannel: !this.data.mainMessage.tcount,
	});

	this.loadMore = async () => {
		const { tmid } = Tracker.nonreactive(() => this.state.all());
		if (!tmid) {
			return;
		}

		this.state.set('loading', true);

		const messages = await callWithErrorHandling('getThreadMessages', { tmid });

		upsertMessageBulk({ msgs: messages }, this.Threads);

		Tracker.afterFlush(() => {
			this.state.set('loading', false);
		});
	};
});

Template.thread.onDestroyed(function () {
	const { Threads, threadsObserve, callbackRemove, state, chatMessages } = this;
	Threads.remove({});
	threadsObserve && threadsObserve.stop();

	callbackRemove && callbackRemove();

	const tmid = state.get('tmid');
	const rid = state.get('rid');
	if (rid && tmid) {
		chatMessages.onDestroyed && chatMessages.onDestroyed(rid, tmid);
		delete chatMessages[`${rid}-${tmid}`];
	}
});
