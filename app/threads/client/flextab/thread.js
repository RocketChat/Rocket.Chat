import { Mongo } from 'meteor/mongo';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Tracker } from 'meteor/tracker';

import _ from 'underscore';

import { ChatMessages } from '../../../ui';
import { call } from '../../../ui-utils';
import { messageContext } from '../../../ui-utils/client/lib/messageContext';
import { Messages } from '../../../models';
import { lazyloadtick } from '../../../lazy-load';

import { upsert } from '../upsert';

import './thread.html';

const sort = { ts: 1 };

Template.thread.events({
	'click .js-close'(e) {
		e.preventDefault();
		e.stopPropagation();
		const { close } = this;
		return close && close();
	},
	'scroll .js-scroll-thread': _.throttle(({ currentTarget: e }, i) => {
		lazyloadtick();
		i.atBottom = e.scrollTop >= e.scrollHeight - e.clientHeight;
	}, 500),
});

Template.thread.helpers({
	mainMessage() {
		return Template.parentData().mainMessage;
	},
	loading() {
		return Template.instance().state.get('loading');
	},
	messages() {
		const { Threads, state } = Template.instance();
		const tmid = state.get('tmid');
		return Threads.find({ tmid }, { sort });
	},
	messageContext() {
		const result = messageContext.apply(this);
		return {
			...result,
			settings: {
				...result.settings,
				showReplyButton: false,
				showreply:false,
			},
		};
	},
	messageBoxData() {
		const instance = Template.instance();
		const { mainMessage: { rid, _id: tmid } } = this;

		return {
			rid,
			tmid,
			onSend: (...args) => instance.chatMessages && instance.chatMessages.send.apply(instance.chatMessages, args),
			onKeyUp: (...args) => instance.chatMessages && instance.chatMessages.keyup.apply(instance.chatMessages, args),
			onKeyDown: (...args) => instance.chatMessages && instance.chatMessages.keydown.apply(instance.chatMessages, args),
		};
	},
});


Template.thread.onRendered(function() {
	const rid = Tracker.nonreactive(() => this.state.get('rid'));
	const tmid = Tracker.nonreactive(() => this.state.get('tmid'));

	this.chatMessages = new ChatMessages;
	this.chatMessages.initializeWrapper(this.find('.js-scroll-thread'));
	this.chatMessages.initializeInput(this.find('.js-input-message'), { rid, tmid });

	this.chatMessages.wrapper.scrollTop = this.chatMessages.wrapper.scrollHeight - this.chatMessages.wrapper.clientHeight;

	this.sendToBottom = _.throttle(() => {
		this.chatMessages.wrapper.scrollTop = this.chatMessages.wrapper.scrollHeight;
	}, 300);

	this.autorun(() => {
		const tmid = this.state.get('tmid');
		this.state.set({
			tmid,
			loading: false,
		});
		this.loadMore();
	});

	this.autorun(() => {
		const tmid = this.state.get('tmid');
		this.threadsObserve && this.threadsObserve.stop();

		this.threadsObserve = Messages.find({ tmid, _updatedAt: { $gt: new Date() } }).observe({
			added: ({ _id, ...message }) => {
				const { atBottom } = this;
				this.Threads.upsert({ _id }, message);
				atBottom && this.sendToBottom();
			},
			changed: ({ _id, ...message }) => {
				const { atBottom } = this;
				this.Threads.update({ _id }, message);
				atBottom && this.sendToBottom();
			},
			removed: ({ _id }) => this.Threads.remove(_id),
		});
	});

	this.autorun(() => {
		const rid = this.state.get('rid');
		const tmid = this.state.get('tmid');
		this.chatMessages.initializeInput(this.find('.js-input-message'), { rid, tmid });
	});

	Tracker.afterFlush(() => {
		this.autorun(async () => {
			const { mainMessage } = Template.currentData();
			this.state.set({
				tmid: mainMessage._id,
				rid: mainMessage.rid,
			});
		});
	});
});

Template.thread.onCreated(async function() {
	this.Threads = new Mongo.Collection(null);

	this.state = new ReactiveDict();

	this.loadMore = _.debounce(async () => {
		if (this.state.get('loading')) {
			return;
		}

		const { tmid } = Tracker.nonreactive(() => this.state.all());

		this.state.set('loading', true);

		const messages = await call('getThreadMessages', { tmid });

		upsert(this.Threads, messages);

		this.state.set('loading', false);

	}, 500);
});

Template.thread.onDestroyed(function() {
	const { Threads, threadsObserve } = this;
	Threads.remove({});
	threadsObserve && threadsObserve.stop();
});
