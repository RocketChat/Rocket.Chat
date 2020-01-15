import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { ChatRoom } from '../../../../models';
import { call } from '../../../../ui-utils/client';
import './omnichannelReadOnly.html';
import { APIClient } from '../../../../utils/client';
import { inquiryDataStream } from '../../lib/stream/inquiry';

Template.omnichannelReadOnly.helpers({
	inquiryOpen() {
		const inquiry = Template.instance().inquiry.get();
		return (inquiry && inquiry.status === 'queued') || FlowRouter.go('/home');
	},

	roomOpen() {
		const room = Template.instance().room.get();
		return room && room.open === true;
	},

	showPreview() {
		const config = Template.instance().routingConfig.get();
		return config.previewRoom;
	},

	isPreparing() {
		return Template.instance().preparing.get();
	},
});

Template.omnichannelReadOnly.events({
	async 'click .js-take-it'(event, instance) {
		event.preventDefault();
		event.stopPropagation();

		const inquiry = instance.inquiry.get();
		const { _id } = inquiry;
		await call('livechat:takeInquiry', _id);
		instance.loadInquiry(inquiry.rid);
	},
});

Template.omnichannelReadOnly.onCreated(function() {
	this.rid = Template.currentData().rid;
	this.room = new ReactiveVar();
	this.inquiry = new ReactiveVar();
	this.routingConfig = new ReactiveVar({});
	this.preparing = new ReactiveVar(true);

	this.updateInquiry = (inquiry) => {
		if (inquiry && inquiry.rid === this.rid) {
			this.inquiry.set(inquiry);
		}
	};

	Meteor.call('livechat:getRoutingConfig', (err, config) => {
		if (config) {
			this.routingConfig.set(config);
		}
	});

	this.loadInquiry = async (roomId) => {
		this.preparing.set(true);
		const { inquiry } = await APIClient.v1.get(`livechat/inquiries.getOne?roomId=${ roomId }`);
		this.inquiry.set(inquiry);
		if (inquiry && inquiry._id) {
			inquiryDataStream.on(inquiry._id, this.updateInquiry);
		}
		this.preparing.set(false);
	};

	this.autorun(() => this.loadInquiry(this.rid));
	this.autorun(() => {
		this.room.set(ChatRoom.findOne({ _id: Template.currentData().rid }, { fields: { open: 1 } }));
	});
});

Template.omnichannelReadOnly.onDestroyed(function() {
	const inquiry = this.inquiry.get();
	if (inquiry && inquiry._id) {
		inquiryDataStream.removeListener(inquiry._id, this.updateInquiry);
	}
});
