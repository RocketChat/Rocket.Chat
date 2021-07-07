import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { ChatRoom } from '../../../../models';
import { call } from '../../../../ui-utils/client';
import './livechatReadOnly.html';
import { APIClient } from '../../../../utils/client';
import { inquiryDataStream } from '../../lib/stream/inquiry';

Template.livechatReadOnly.helpers({
	inquiryOpen() {
		const inquiry = Template.instance().inquiry.get();
		const room = Template.instance().room.get();
		return (inquiry && inquiry.status === 'queued') || !room.servedBy;
	},

	roomOpen() {
		const room = Template.instance().room.get();
		return room && room.open === true;
	},

	showPreview() {
		const config = Template.instance().routingConfig.get();
		return config.previewRoom || Template.currentData().onHold;
	},

	isPreparing() {
		return Template.instance().preparing.get();
	},

	isOnHold() {
		return Template.currentData().onHold;
	},
});

Template.livechatReadOnly.events({
	async 'click .js-take-it'(event, instance) {
		event.preventDefault();
		event.stopPropagation();

		const inquiry = instance.inquiry.get();
		const { _id } = inquiry;
		await call('livechat:takeInquiry', _id, { clientAction: true });
		instance.loadInquiry(inquiry.rid);
	},

	async 'click .js-resume-it'(event, instance) {
		event.preventDefault();
		event.stopPropagation();

		const room = instance.room.get();

		await call('livechat:resumeOnHold', room._id, { clientAction: true });
	},
});

Template.livechatReadOnly.onCreated(function() {
	this.rid = Template.currentData().rid;
	this.room = new ReactiveVar();
	this.inquiry = new ReactiveVar();
	this.routingConfig = new ReactiveVar({});
	this.preparing = new ReactiveVar(true);

	this.updateInquiry = async ({ clientAction, ...inquiry }) => {
		if (clientAction === 'removed' || !await call('canAccessRoom', inquiry.rid, Meteor.userId())) {
			return FlowRouter.go('/home');
		}

		this.inquiry.set(inquiry);
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
		this.room.set(ChatRoom.findOne({ _id: Template.currentData().rid }, { fields: { open: 1, servedBy: 1 } }));
	});
});

Template.livechatReadOnly.onDestroyed(function() {
	const inquiry = this.inquiry.get();
	if (inquiry && inquiry._id) {
		inquiryDataStream.removeListener(inquiry._id, this.updateInquiry);
	}
});
