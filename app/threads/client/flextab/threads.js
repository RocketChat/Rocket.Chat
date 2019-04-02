import { Mongo } from 'meteor/mongo';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { call } from '../../../ui-utils';
import { Rooms, Messages } from '../../../models';
import { messageContext } from '../../../ui-utils/client/lib/messageContext';

import './threads.html';

export const Threads = new Mongo.Collection(null);

Template.threads.events({
	'click .js-open-thread'(e, instance) {
		const [, { hash: { msg } }] = this._arguments;
		instance.mid.set(Threads.findOne(msg._id));
		e.preventDefault();
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
		this.room.set(Rooms.findOne({ _id: rid }));
		this.close = !!mid;
		this.rid = rid;

		if (mid) {
			return this.mid.set(Messages.findOne(mid));
		}

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
			// removed: (role) => {
			// 	if (!role.u || !role.u._id) {
			// 		return;
			// 	}
			// 	ChatMessage.update({ rid: this.data._id, 'u._id': role.u._id }, { $pull: { roles: role._id } }, { multi: true });
			// },
		});
	});



});

Template.threads.onDestroyed(function() {
	const { rid } = this.data;
	Threads.remove({ rid });
	this.threadsObserve && this.threadsObserve.stop();
});
