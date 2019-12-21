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
import { initializeLivechatInquiryStream, removeInquiriesByDepartment, addInquiriesAndListenerByDepartment } from '../../lib/stream/inquiry';

import './livechat.html';

Template.livechat.helpers({
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
		const statusLivechat = Template.instance().statusLivechat.get();

		return {
			status: statusLivechat === 'available' ? 'status-online' : '',
			icon: statusLivechat === 'available' ? 'icon-toggle-on' : 'icon-toggle-off',
			hint: statusLivechat === 'available' ? t('Available') : t('Not_Available'),
		};
	},

	isLivechatAvailable() {
		return Template.instance().statusLivechat.get() === 'available';
	},

	showQueueLink() {
		const config = Template.instance().routingConfig.get();
		if (!config.showQueueLink) {
			return false;
		}
		return hasPermission(Meteor.userId(), 'view-livechat-queue') || (Template.instance().statusLivechat.get() === 'available' && settings.get('Livechat_show_queue_list_link'));
	},

	activeLivechatQueue() {
		FlowRouter.watchPathChange();
		if (FlowRouter.current().route.name === 'livechat-queue') {
			return 'active';
		}
	},
});

Template.livechat.events({
	'click .livechat-status'() {
		Meteor.call('livechat:changeLivechatStatus', (err /* , results*/) => {
			if (err) {
				return handleError(err);
			}
		});
	},
});

Template.livechat.onCreated(function() {
	this.statusLivechat = new ReactiveVar();
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
			this.statusLivechat.set(user.statusLivechat);
		} else {
			this.statusLivechat.set();
		}
	});
	if (!settings.get('Livechat_enable_inquiry_fetch_by_stream')) {
		this.subscribe('livechat:inquiry');
	} else {
		initializeLivechatInquiryStream(Meteor.userId());
	}
	this.updateAgentDepartments = ({ action, departmentId }) => {
		switch (action) {
			case 'inserted':
				addInquiriesAndListenerByDepartment(departmentId);
				break;

			case 'removed':
				removeInquiriesByDepartment(departmentId);
				break;
		}
	};
	this.autorun(() => this.inquiriesLimit.set(settings.get('Livechat_guest_pool_max_number_incoming_livechats_displayed')));

	Notifications.onUser('departmentAgentData', (payload) => this.updateAgentDepartments(payload));
});
