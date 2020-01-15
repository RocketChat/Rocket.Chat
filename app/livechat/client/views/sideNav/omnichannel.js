import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

import { ChatSubscription, Users } from '../../../../models';
import { KonchatNotification } from '../../../../ui';
import { settings } from '../../../../settings';
import { hasPermission } from '../../../../authorization';
import { t, handleError, getUserPreference } from '../../../../utils';
import { getLivechatInquiryCollection } from '../../collections/LivechatInquiry';
import { Notifications } from '../../../../notifications/client';
import { initializeOmnichannelInquiryStream } from '../../lib/stream/queueManager';

import './omnichannel.html';

Template.omnichannel.helpers({
	isActive() {
		const query = {
			t: 'l',
			f: { $ne: true },
			open: true,
			rid: Session.get('openedRoom'),
		};

		const options = { fields: { _id: 1 } };

		if (ChatSubscription.findOne(query, options)) {
			return 'active';
		}
	},

	rooms() {
		const query = {
			t: 'l',
			open: true,
		};

		const user = Users.findOne(Meteor.userId(), {
			fields: { 'settings.preferences.sidebarShowUnread': 1 },
		});

		if (getUserPreference(user, 'sidebarShowUnread')) {
			query.alert = { $ne: true };
		}

		return ChatSubscription.find(query, {
			sort: {
				t: 1,
				fname: 1,
			},
		});
	},

	inquiries() {
		const inqs = getLivechatInquiryCollection().find({
			status: 'queued',
		}, {
			sort: {
				ts: 1,
			},
			limit: Template.instance().inquiriesLimit.get(),
		});

		// for notification sound
		inqs.forEach((inq) => {
			KonchatNotification.newRoom(inq.rid);
		});

		return inqs;
	},

	showIncomingQueue() {
		const config = Template.instance().routingConfig.get();
		return config.showQueue;
	},

	available() {
		const statusOmnichannel = Template.instance().statusOmnichannel.get();

		return {
			status: statusOmnichannel === 'available' ? 'status-online' : '',
			icon: statusOmnichannel === 'available' ? 'icon-toggle-on' : 'icon-toggle-off',
			hint: statusOmnichannel === 'available' ? t('Available') : t('Not_Available'),
		};
	},

	isOmnichannelAvailable() {
		return Template.instance().statusOmnichannel.get() === 'available';
	},

	showQueueLink() {
		const config = Template.instance().routingConfig.get();
		if (!config.showQueueLink) {
			return false;
		}
		return hasPermission(Meteor.userId(), 'view-livechat-queue') || (Template.instance().statusOmnichannel.get() === 'available' && settings.get('Livechat_show_queue_list_link'));
	},

	activeOmnichannelQueue() {
		FlowRouter.watchPathChange();
		if (FlowRouter.current().route.name === 'omnichannel-queue') {
			return 'active';
		}
	},
});

Template.omnichannel.events({
	'click .omnichannel-status'() {
		Meteor.call('livechat:changeLivechatStatus', (err /* , results*/) => {
			if (err) {
				return handleError(err);
			}
		});
	},
});

Template.omnichannel.onCreated(function() {
	this.statusOmnichannel = new ReactiveVar();
	this.routingConfig = new ReactiveVar({});
	this.inquiriesLimit = new ReactiveVar();

	Meteor.call('livechat:getRoutingConfig', (err, config) => {
		if (config) {
			this.routingConfig.set(config);
		}
	});

	this.autorun(() => {
		if (Meteor.userId()) {
			const user = Users.findOne(Meteor.userId(), { fields: { statusLivechat: 1 } });
			this.statusOmnichannel.set(user.statusLivechat);
		} else {
			this.statusOmnichannel.set();
		}
	});
	if (!settings.get('Livechat_enable_inquiry_fetch_by_stream')) {
		this.subscribe('livechat:inquiry');
	} else {
		initializeOmnichannelInquiryStream(Meteor.userId());
	}
	this.updateAgentDepartments = () => initializeOmnichannelInquiryStream(Meteor.userId());
	this.autorun(() => this.inquiriesLimit.set(settings.get('Livechat_guest_pool_max_number_incoming_livechats_displayed')));

	Notifications.onUser('departmentAgentData', (payload) => this.updateAgentDepartments(payload));
});
