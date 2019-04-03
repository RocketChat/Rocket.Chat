import { Mongo } from 'meteor/mongo';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { call } from '../../../ui-utils';
import { Rooms, Messages } from '../../../models';
import { messageContext } from '../../../ui-utils/client/lib/messageContext';
import { messageArgs } from '../../../ui-utils/client/lib/messageArgs';

import './threads.html';

export const Threads = new Mongo.Collection(null);

Template.threads.events({
	'click .js-open-thread'(e, instance) {
		const { msg } = messageArgs(this);
		instance.mid.set(Threads.findOne(msg._id));
		e.preventDefault();
		e.stopPropagation();
		return false;
	},
});

Template.threads.helpers({
	close() {
		const instance = Template.instance();
		const { tabBar } = instance.data;
		return () => (instance.close ? tabBar.close() : instance.mid.set(null));
	},
	message() {
		return Template.instance().mid.get();
	},
	isLoading() {
		return Template.instance().loading.get();
	},
	hasThreads() {
		return Threads.find({ rid: Template.instance().rid }, { sort: { ts: -1 } }).count();
	},
	threads() {
		return Threads.find({ rid: Template.instance().rid }, { sort: { ts: -1 } });
	},
	messageContext,
});

Template.threads.onCreated(async function() {
	this.loading = new ReactiveVar(false);
	this.mid = new ReactiveVar(null);
	this.room = new ReactiveVar(null);
	this.autorun(async() => {
		const { rid, mid } = Template.currentData();
		this.close = !!mid;

		if (mid) {
			this.rid = rid;
			return this.mid.set(Messages.findOne(mid));
		}

		if (this.rid == rid) {
			return;
		}

		this.rid = rid;
		this.loading.set(true);

		const threads = await call('getThreadsList', { rid });
		threads.forEach((t) => Threads.insert(t));

		this.loading.set(false);

		this.threadsObserve && this.threadsObserve.stop();
		this.threadsObserve = Messages.find({ rid, tcount: { $exists: true } }).observe({
			added: ({ _id, ...message }) => {
				Threads.upsert({ _id }, message);
			}, // Update message to re-render DOM
			changed: ({ _id, ...message }) => {
				Threads.update({ _id }, message);
			}, // Update message to re-render DOM
			removed: ({ _id }) => {
				Threads.remove(_id);

				const { _id: mid } = this.mid.get() || {};
				if (_id === mid) {
					this.mid.set(null);
				}
			},
		});
	});
});

Template.threads.onDestroyed(function() {
	const { rid } = this.data;
	Threads.remove({ rid });
	this.threadsObserve && this.threadsObserve.stop();
});
