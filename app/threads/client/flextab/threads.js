import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';

import _ from 'underscore';

import { call } from '../../../ui-utils';
import { Messages } from '../../../models';
import { messageContext } from '../../../ui-utils/client/lib/messageContext';
import { messageArgs } from '../../../ui-utils/client/lib/messageArgs';

import './threads.html';

const LIST_SIZE = 50;
const sort = { ts: -1 };

Template.threads.events({
	'click .js-open-thread'(e, instance) {
		const { msg } = messageArgs(this);
		instance.state.set('mid', msg._id);
		e.preventDefault();
		e.stopPropagation();
		return false;
	},
	'scroll .js-scroll-threads': _.throttle(({ currentTarget: e }, i) => {
		if (e.offsetHeight + e.scrollTop === e.scrollHeight - 50) {
			i.loadMore && i.incLimit();
		}
	}, 500),
});

Template.threads.helpers({
	close() {
		const instance = Template.instance();
		const { tabBar } = instance.data;
		return () => (instance.close ? tabBar.close() : instance.state.set('mid', null));
	},
	message() {
		return Template.instance().state.get('thread');
	},
	isLoading() {
		return Template.instance().state.get('loading');
	},
	hasThreads() {
		return Template.instance().Threads.find({ rid: Template.instance().state.get('rid') }, { sort }).count();
	},
	threads() {
		return Template.instance().Threads.find({ rid: Template.instance().state.get('rid') }, { sort, limit: Template.instance().state.get('limit') });
	},
	messageContext,
});

Template.threads.onCreated(async function() {
	this.state = new ReactiveDict({
		rid: this.data.rid,
	});
	this.Threads = new Mongo.Collection(null);

	this.incLimit = () => {
		if (this.state.get('loading')) {
			return;
		}
		const { rid, limit } = Tracker.nonreactive(() => this.state.all());

		const count = this.Threads.find({ rid }).count();

		if (limit > count) {
			return;
		}

		this.state.set('limit', this.state.get('limit') + LIST_SIZE);
		this.loadMore();
	};

	this.loadMore = _.debounce(async () => {
		if (this.state.get('loading')) {
			return;
		}

		const { rid, limit } = Tracker.nonreactive(() => this.state.all());

		this.state.set('loading', true);
		const threads = await call('getThreadsList', { rid, limit: LIST_SIZE, skip: limit - LIST_SIZE });
		threads.forEach(({ _id, ...msg }) => this.Threads.upsert({ _id }, msg));
		this.state.set('loading', false);

	}, 500);

	this.autorun(() => {
		const rid = this.state.get('rid');
		this.rid = rid;
		this.state.set({
			limit: LIST_SIZE,
			loading: false,
		});
		this.loadMore();
	});

	this.autorun(() => {
		const rid = this.state.get('rid');
		this.threadsObserve && this.threadsObserve.stop();
		this.threadsObserve = Messages.find({ rid, tcount: { $exists: true } }).observe({
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
	});

	this.autorun(async () => {
		const mid = this.state.get('mid');
		return this.state.set('thread', mid && this.Threads.findOne({ _id: mid }));
	});

	this.autorun(async () => {
		const { rid, mid } = Template.currentData();
		this.close = !!mid;

		this.state.set({
			mid,
			rid,
		});
	});
});

Template.threads.onDestroyed(function() {
	const { Threads, threadsObserve } = this;
	Threads.remove({});
	threadsObserve && threadsObserve.stop();
});
