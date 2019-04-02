import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Rooms } from '../../../../models';
import { LivechatInquiry } from '../../../lib/LivechatInquiry';
import { handleError } from '../../../../utils';
import { call } from '../../../../ui-utils/client';
import { settings } from '../../../../settings';

Template.livechatReadOnly.helpers({
	isInquiryOpen() {
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
	'click .js-take-it'(event, instance) {
		event.preventDefault();
		event.stopPropagation();

		const inquiry = instance.inquiry.get();
		const { _id } = inquiry;
		call('livechat:takeInquiry', _id, (error /* ,result */) => {
			if (error) {
				return handleError(error);
			}
		});
	},
});

Template.livechatReadOnly.onCreated(function() {
	this.rid = Template.currentData().rid;
	this.room = new ReactiveVar(null);
	this.inquiry = new ReactiveVar(null);

	this.autorun(() => {
		const room = Rooms.findOne({ _id: this.rid });
		this.room.set(room);
		const inquiry = LivechatInquiry.findOne({ agents: Meteor.userId(), status: 'open', rid: this.rid });
		this.inquiry.set(inquiry);

		if (inquiry) {
			this.subscribe('livechat:inquiry', inquiry._id);
		}
	});

});
