import _ from 'underscore';
import { Mongo } from 'meteor/mongo';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Tracker } from 'meteor/tracker';

import { ChatMessages } from '../../../ui';
import { normalizeThreadMessage, call } from '../../../ui-utils/client';
import { messageContext } from '../../../ui-utils/client/lib/messageContext';
import { Messages } from '../../../models';
import { lazyloadtick } from '../../../lazy-load';
import { fileUpload } from '../../../ui/client/lib/fileUpload';
import { dropzoneEvents } from '../../../ui/client/views/app/room';
import { upsert } from '../upsert';
import './thread.html';

const sort = { ts: 1 };

Template.thread.events({
	...dropzoneEvents,
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
	'load img'() {
		const { atBottom } = this;
		atBottom && this.sendToBottom();
	},
});

Template.thread.helpers({
	threadTitle() {
		return normalizeThreadMessage(Template.currentData().mainMessage);
	},
	mainMessage() {
		return Template.parentData().mainMessage;
	},
	isLoading() {
		return Template.instance().state.get('loading') !== false;
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
				showreply: false,
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

	this.onFile = (filesToUpload) => {
		fileUpload(filesToUpload, this.chatMessages.input, { rid: this.state.get('rid'), tmid: this.state.get('tmid') });
	};

	this.sendToBottom = _.throttle(() => {
		this.chatMessages.wrapper.scrollTop = this.chatMessages.wrapper.scrollHeight;
	}, 300);

	this.autorun(() => {
		const tmid = this.state.get('tmid');
		this.state.set({
			tmid,
		});
		this.loadMore();
	});

	this.autorun(() => {
		const tmid = this.state.get('tmid');
		this.threadsObserve && this.threadsObserve.stop();

		this.threadsObserve = Messages.find({ tmid, _updatedAt: { $gt: new Date() } }, {
			fields: {
				collapsed: 0,
				threadMsg: 0,
				repliesCount: 0,
			},
		}).observe({
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

	this.state = new ReactiveDict({
	});

	this.loadMore = _.debounce(async () => {
		if (this.state.get('loading') === true) {
			return;
		}

		const { tmid } = Tracker.nonreactive(() => this.state.all());

		this.state.set('loading', true);

		const messages = await call('getThreadMessages', { tmid });

		upsert(this.Threads, messages);

		Tracker.afterFlush(() => {
			this.state.set('loading', false);
		});
	}, 500);
});

Template.thread.onDestroyed(function() {
	const { Threads, threadsObserve } = this;
	Threads.remove({});
	threadsObserve && threadsObserve.stop();
});
