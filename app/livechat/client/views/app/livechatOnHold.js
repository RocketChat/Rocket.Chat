import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { ChatRoom } from '../../../../models';
import './livechatOnHold.html';

Template.livechatOnHold.helpers({
	roomOpen() {
		const room = Template.instance().room.get();
		console.log('---roomOpen', room.open);
		return room && room.open === true;
	},

	isPreparing() {
		return Template.instance().preparing.get();
	},
});

Template.livechatOnHold.events({
	async 'click .js-take-it'(event, instance) {
		event.preventDefault();
		event.stopPropagation();

		console.log('---button clicked', instance);
	},
});

Template.livechatOnHold.onCreated(function() {
	this.rid = Template.currentData().rid;
	this.room = new ReactiveVar();

	this.autorun(() => {
		this.room.set(ChatRoom.findOne({ _id: Template.currentData().rid }));
	});
});

Template.livechatOnHold.onDestroyed(function() {

});
