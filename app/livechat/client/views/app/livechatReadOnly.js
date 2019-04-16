import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { ChatRoom } from '../../../../models';
import { LivechatInquiry } from '../../../lib/LivechatInquiry';
import { handleError } from '../../../../utils';
import { call } from '../../../../ui-utils/client';
import { settings } from '../../../../settings';

Template.livechatReadOnly.helpers({
	inquiryOpen() {
		const inquiry = Template.instance().inquiry.get();
		return inquiry || FlowRouter.go('/home');
	},

	roomOpen() {
		const room = Template.instance().room.get();
		return room && room.open === true;
	},

	guestPool() {
		return settings.get('Livechat_Routing_Method') === 'Guest_Pool';
	},
});

Template.livechatReadOnly.events({
	async 'click .js-take-it'(event, instance) {
		event.preventDefault();
		event.stopPropagation();

		const inquiry = instance.inquiry.get();
		const { _id } = inquiry;
		await call('livechat:takeInquiry', _id, (error /* ,result */) => {
			if (error) {
				return handleError(error);
			}
		});
	},
});

Template.livechatReadOnly.onCreated(function() {
	this.rid = Template.currentData().rid;
	this.room = new ReactiveVar();
	this.inquiry = new ReactiveVar();

	this.autorun(() => {
		const inquiry = LivechatInquiry.findOne({ agents: Meteor.userId(), status: 'open', rid: this.rid });
		this.inquiry.set(inquiry);

		if (inquiry) {
			this.subscribe('livechat:inquiry', inquiry._id);
		}
	});

	this.autorun(() => {
		this.room.set(ChatRoom.findOne({ _id: Template.currentData().rid }, { fields: { open: 1 } }));
	});

});
