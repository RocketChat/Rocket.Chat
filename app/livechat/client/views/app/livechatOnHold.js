import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { ChatRoom } from '../../../../models';
import './livechatOnHold.html';
import { call } from '../../../../ui-utils/client';

Template.livechatOnHold.helpers({
	roomOpen() {
		const room = Template.instance().room.get();
		return room && room.open === true;
	},

	isPreparing() {
		return Template.instance().preparing.get();
	},
});

Template.livechatOnHold.events({
	async 'click .js-resume-it'(event, instance) {
		event.preventDefault();
		event.stopPropagation();

		const room = instance.room.get();

		await call('livechat:resumeOnHold', room._id, { clientAction: true });
	},
});

Template.livechatOnHold.onCreated(function() {
	this.rid = Template.currentData().rid;
	this.room = new ReactiveVar();
	this.preparing = new ReactiveVar(true);

	this.autorun(() => {
		this.preparing.set(true);
		this.room.set(ChatRoom.findOne({ _id: Template.currentData().rid }));
		this.preparing.set(false);
	});
});
