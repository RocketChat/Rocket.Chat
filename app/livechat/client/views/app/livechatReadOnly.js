import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { ChatRoom } from '../../../../models';
import { call } from '../../../../ui-utils/client';
import './livechatReadOnly.html';
import { APIClient } from '../../../../utils/client';

Template.livechatReadOnly.helpers({
	inquiryOpen() {
		const inquiry = Template.instance().inquiry.get();
		return inquiry || FlowRouter.go('/home');
	},

	roomOpen() {
		const room = Template.instance().room.get();
		return room && room.open === true;
	},

	showPreview() {
		const config = Template.instance().routingConfig.get();
		return config.previewRoom;
	},

});

Template.livechatReadOnly.events({
	async 'click .js-take-it'(event, instance) {
		event.preventDefault();
		event.stopPropagation();

		const inquiry = instance.inquiry.get();
		const { _id } = inquiry;
		await call('livechat:takeInquiry', _id);
		instance.loadInquiry(inquiry.rid);
	},
});

Template.livechatReadOnly.onCreated(function() {
	this.rid = Template.currentData().rid;
	this.room = new ReactiveVar();
	this.inquiry = new ReactiveVar();
	this.routingConfig = new ReactiveVar({});

	Meteor.call('livechat:getRoutingConfig', (err, config) => {
		if (config) {
			this.routingConfig.set(config);
		}
	});
	this.loadInquiry = async (roomId) => {
		const { inquiry } = await APIClient.v1.get(`livechat/inquiries.getOne?roomId=${ roomId }`);
		this.inquiry.set(inquiry);
	};
	this.autorun(() => this.loadInquiry(this.rid));
	this.autorun(() => {
		this.room.set(ChatRoom.findOne({ _id: Template.currentData().rid }, { fields: { open: 1 } }));
	});
});
