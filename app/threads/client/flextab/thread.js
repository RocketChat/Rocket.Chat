import { Mongo } from 'meteor/mongo';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Tracker } from 'meteor/tracker';

import _ from 'underscore';

import { call } from '../../../ui-utils';
import { messageContext } from '../../../ui-utils/client/lib/messageContext';
import { Messages } from '../../../models';

import './thread.html';

// const LIST_SIZE = 5;
const sort = { ts: 1 };

Template.thread.events({
	'click .js-close'(e) {
		e.preventDefault();
		e.stopPropagation();
		const { close } = this;
		return close && close();
	},
	// 'scroll .js-scroll-thread': _.throttle(({ currentTarget: e }, i) => {
	// 	if (e.scrollTop < 50) {
	// 		i.loadMore && i.incLimit();
	// 	}
	// }, 500),
});

Template.thread.helpers({
	mainMessage() {
		return Template.parentData().mainMessage;
	},
	loading() {
		return Template.instance().state.get('loading');
	},
	messages() {
		const { mainMessage } = Template.parentData();
		const { Threads } = Template.instance();
		// const count = Threads.find({ tmid: mainMessage._id }).count();
		// const limit = Template.instance().state.get('limit');
		// return Threads.find({ tmid: mainMessage._id }, { sort, skip: count > limit ? count - limit : 0 });
		return Threads.find({ tmid: mainMessage._id }, { sort });
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
});


Template.thread.onRendered(function() {
	const element = this.find('.js-scroll-thread');
	element.scrollTop = element.scrollHeight - element.clientHeight;

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

		this.threadsObserve = Messages.find({ tmid }).observe({
			added: ({ _id, ...message }) => this.Threads.upsert({ _id }, message), // Update message to re-render DOM
			changed: ({ _id, ...message }) => this.Threads.update({ _id }, message), // Update message to re-render DOM
			removed: ({ _id }) => this.Threads.remove(_id),
		});
	});

	this.autorun(async () => {
		const { mainMessage } = Template.currentData();
		this.state.set({
			tmid: mainMessage._id,
		});
	});

	this.loadMore = _.debounce(async () => {
		if (this.state.get('loading')) {
			return;
		}

		const { tmid } = Tracker.nonreactive(() => this.state.all());

		this.state.set('loading', true);
		const messages = await call('getThreadMessages', { tmid });

		messages.forEach(({ _id, ...msg }) => this.Threads.upsert({ _id }, msg));
		this.state.set('loading', false);

	}, 500);
});

Template.thread.onCreated(async function() {
	// const element = this.find('.js-scroll-thread');
	const { mainMessage } = this.data;
	this.Threads = new Mongo.Collection(null);

	this.state = new ReactiveDict({
		tmid: mainMessage._id,
		// limit: LIST_SIZE,
	});

	this.loadMore = _.debounce(async () => {
		if (this.state.get('loading')) {
			return;
		}

		const { tmid } = Tracker.nonreactive(() => this.state.all());

		this.state.set('loading', true);
		const messages = await call('getThreadMessages', { tmid });
		messages.forEach(({ _id, ...msg }) => this.Threads.upsert({ _id }, msg));
		this.state.set('loading', false);

	}, 500);

	// this.incLimit = () => {
	// 	if (this.state.get('loading')) {
	// 		return;
	// 	}

	// 	const { tmid, limit } = Tracker.nonreactive(() => this.state.all());

	// 	const count = this.Threads.find({ tmid }).count();

	// 	if (limit > count) {
	// 		return;
	// 	}

	// 	// this.state.set('limit', this.state.get('limit') + LIST_SIZE);
	// 	this.loadMore();
	// };
});

Template.thread.onDestroyed(function() {
	const { Threads, threadsObserve } = this;
	Threads.remove({});
	threadsObserve && threadsObserve.stop();
});
