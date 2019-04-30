import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';

import _ from 'underscore';

import { lazyloadtick } from '../../../lazy-load';
import { call } from '../../../ui-utils';
import { Messages, Subscriptions } from '../../../models';
import { messageContext } from '../../../ui-utils/client/lib/messageContext';
import { messageArgs } from '../../../ui-utils/client/lib/messageArgs';
import { getConfig } from '../../../ui-utils/client/config';

import { upsert } from '../upsert';

import './threads.html';

const LIST_SIZE = parseInt(getConfig('threadsListSize')) || 50;

const sort = { tlm: -1 };

Template.threads.events({
	'click .js-open-thread'(e, instance) {
		const { msg } = messageArgs(this);
		instance.state.set('mid', msg._id);
		e.preventDefault();
		e.stopPropagation();
		return false;
	},
	'scroll .js-scroll-threads': _.throttle(({ currentTarget: e }, { incLimit }) => {
		lazyloadtick();
		if (e.offsetHeight + e.scrollTop <= e.scrollHeight - 50) {
			incLimit && incLimit();
		}
	}, 500),
});

Template.threads.helpers({
	doDotLoadThreads() {
		return Template.instance().state.get('close');
	},
	close() {
		const { state, data } = Template.instance();
		const { tabBar } = data;
		return () => (state.get('close') ? tabBar.close() : state.set('mid', null));
	},
	message() {
		return Template.instance().state.get('thread');
	},
	isLoading() {
		return Template.instance().state.get('loading');
	},
	hasNoThreads() {
		return !Template.instance().state.get('loading') && Template.instance().Threads.find({ rid: Template.instance().state.get('rid') }, { sort }).count() === 0;
	},
	threads() {
		return Template.instance().Threads.find({ rid: Template.instance().state.get('rid') }, { sort, limit: Template.instance().state.get('limit') });
	},
	messageContext,
});

Template.threads.onCreated(async function() {
	this.Threads = new Mongo.Collection(null);
	const { rid, mid, msg } = this.data;
	this.state = new ReactiveDict({
		rid,
		close: !!mid,
		loading: true,
		mid,
		thread: msg,
	});


	this.incLimit = () => {
		const { rid, limit } = Tracker.nonreactive(() => this.state.all());

		const count = this.Threads.find({ rid }).count();

		if (limit > count) {
			return;
		}

		this.state.set('limit', this.state.get('limit') + LIST_SIZE);
		this.loadMore();
	};

	this.loadMore = _.debounce(async () => {
		const { rid, limit } = Tracker.nonreactive(() => this.state.all());
		if (this.state.get('loading') === rid) {
			return;
		}


		this.state.set('loading', rid);
		const threads = await call('getThreadsList', { rid, limit: LIST_SIZE, skip: limit - LIST_SIZE });
		upsert(this.Threads, threads);
		// threads.forEach(({ _id, ...msg }) => this.Threads.upsert({ _id }, msg));
		this.state.set('loading', false);
	}, 500);

	Tracker.afterFlush(() => {
		this.autorun(async () => {
			const { rid, mid } = Template.currentData();

			this.state.set({
				close: !!mid,
				mid,
				rid,
			});
		});
	});

	this.autorun(() => {
		const rid = this.state.get('rid');
		this.rid = rid;
		this.state.set({
			limit: LIST_SIZE,
		});
		this.loadMore();
	});

	this.autorun(() => {
		const rid = this.state.get('rid');
		this.threadsObserve && this.threadsObserve.stop();
		this.threadsObserve = Messages.find({ rid, _updatedAt: { $gt: new Date() }, tcount: { $exists: true } }).observe({
			added: ({ _id, ...message }) => {
				this.Threads.upsert({ _id }, message);
			}, // Update message to re-render DOM
			changed: ({ _id, ...message }) => {
				this.Threads.update({ _id }, message);
			}, // Update message to re-render DOM
			removed: ({ _id }) => {
				this.Threads.remove(_id);

				const { _id: mid } = this.mid.get() || {};
				if (_id === mid) {
					this.mid.set(null);
				}
			},
		});

		const alert = 'Unread';
		this.subscriptionObserve && this.subscriptionObserve.stop();
		this.subscriptionObserve = Subscriptions.find({ rid }, { fields: { tunread: 1 } }).observeChanges({
			added: (_id, { tunread }) => {
				tunread && tunread.length && this.Threads.update({ tmid: { $in: tunread } }, { $set: { alert } }, { multi: true });
			},
			changed: (id, { tunread = [] }) => {
				this.Threads.update({ alert, _id: { $nin: tunread } }, { $unset: { alert: 1 } }, { multi: true });
				tunread && tunread.length && this.Threads.update({ _id: { $in: tunread } }, { $set: { alert } }, { multi: true });
			},
		});
	});

	this.autorun(async () => {
		const mid = this.state.get('mid');
		return this.state.set('thread', mid && (Messages.findOne({ _id: mid }, { fields: { tcount: 0, tlm: 0, replies: 0, _updatedAt: 0 } }) || this.Threads.findOne({ _id: mid }, { fields: { tcount: 0, tlm: 0, replies: 0, _updatedAt: 0 } })));
	});
});

Template.threads.onDestroyed(function() {
	const { Threads, threadsObserve, subscriptionObserve } = this;
	Threads.remove({});
	threadsObserve && threadsObserve.stop();
	subscriptionObserve && subscriptionObserve.stop();
});
