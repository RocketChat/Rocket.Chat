import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { ChatSubscription, Users } from '../../../../models';
import { KonchatNotification } from '../../../../ui';
import { settings } from '../../../../settings';
import { hasRole } from '../../../../authorization';
import { t, handleError, getUserPreference } from '../../../../utils';
import { LivechatInquiry } from '../../../lib/LivechatInquiry';
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
		// get all inquiries of the department
		const inqs = LivechatInquiry.find({
			agents: Meteor.userId(),
			status: 'open',
		}, {
			sort: {
				ts: 1,
			},
		});

		// for notification sound
		inqs.forEach((inq) => {
			KonchatNotification.newRoom(inq.rid);
		});

		return inqs;
	},

	guestPool() {
		return settings.get('Livechat_Routing_Method') === 'Guest_Pool';
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
		if (settings.get('Livechat_Routing_Method') !== 'Least_Amount') {
			return false;
		}
		return hasRole(Meteor.userId(), 'livechat-manager') || (Template.instance().statusLivechat.get() === 'available' && settings.get('Livechat_show_queue_list_link'));
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

	this.autorun(() => {
		if (Meteor.userId()) {
			const user = Users.findOne(Meteor.userId(), { fields: { statusLivechat: 1 } });
			this.statusLivechat.set(user.statusLivechat);
		} else {
			this.statusLivechat.set();
		}
	});

	this.subscribe('livechat:inquiry');
});
