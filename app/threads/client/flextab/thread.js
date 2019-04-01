import { Mongo } from 'meteor/mongo';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { call } from '../../../ui-utils';
import { messageContext } from '../../../ui-utils/client/lib/messageContext';
import { Messages } from '../../../models';

import './thread.html';

export const Threads = new Mongo.Collection(null);

Template.thread.events({
	'click .js-close'(e) {
		e.preventDefault();
		e.stopPropagation();
		const { close } = this;
		return close && close();
	},
});

Template.thread.helpers({
	mainMessage() {
		return Template.parentData().mainMessage;
	},
	loading() {
		return Template.instance().loading.get();
	},
	messages() {
		const { mainMessage } = Template.parentData();
		return Threads.find({ tmid: mainMessage._id }, { sort: { ts: 1 } });
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

Template.thread.onCreated(async function() {
	this.loading = new ReactiveVar(true);
	this.autorun(async() => {
		const { room, mainMessage } = Template.currentData();
		this.loading.set(true);

		this.room = room;

		this.rid = room._id;

		const messages = await call('getThread', { tmid: mainMessage._id });

		messages.forEach((t) => Threads.insert(t));

		this.loading.set(false);

		this.threadsObserve && this.threadsObserve.stop();

		this.threadsObserve = Messages.find({ tmid: mainMessage._id }).observe({
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

Template.thread.onDestroyed(function() {
	const { mainMessage } = this.data;
	Threads.remove({ tmid: mainMessage._id });
	Threads.remove({ _id: mainMessage._id });
	this.threadsObserve && this.threadsObserve.stop();
});
