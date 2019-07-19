import { Template } from 'meteor/templating';
import { Mongo } from 'meteor/mongo';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import moment from 'moment';

import { LivechatRoom } from '../../collections/LivechatRoom';
import { visitorNavigationHistory } from '../../collections/LivechatVisitorNavigation';
import { RocketChatTabBar } from '../../../../ui-utils';
import { t } from '../../../../utils';

import './livechatDashboard.html';


const LivechatLocation = new Mongo.Collection('livechatLocation');

Template.livechatDashboard.helpers({
	visitors() {
		return Template.instance().users.get();
	},
	checkRegister(state) {
		return state === 'registered';
	},
	totalVisitors() {
		return Template.instance().users.get().length;
	},
	flexData() {
		return {
			tabBar: Template.instance().tabBar,
			data: Template.instance().tabBarData.get(),
		};
	},
});

Template.livechatDashboard.events({
	'click .row-link'(e, instance) {
		instance.tabBarData.set(this);
		instance.tabBar.setTemplate('visitorSession');
		instance.tabBar.setData({ label: t('Session_Info'), icon: 'info-circled' });
		instance.tabBar.open();
	},
	'submit form'(event, instance) {
		event.preventDefault();

		const filter = {};
		$(':input', event.currentTarget).each(function() {
			if (this.name) {
				filter[this.name] = $(this).val();
			}
		});

		instance.filter.set(filter);
		instance.limit.set(20);
	},
});

Template.livechatDashboard.onCreated(function() {
	this.ready = new ReactiveVar(false);
	this.limit = new ReactiveVar(20);
	this.filter = new ReactiveVar({});
	this.users = new ReactiveVar([]);
	this.tabBar = new RocketChatTabBar();
	this.tabBarData = new ReactiveVar();
	this.tabBar.showGroup(FlowRouter.current().route.name);

	this.autorun(() => {
		this.ready.set(this.subscribe('livechat:rooms', {}, 0, this.limit.get()).ready());
	});

	this.autorun(() => {
		const sub = this.subscribe('livechat:location', this.filter.get());
		if (sub.ready()) {
			const users = LivechatLocation.find({}).map((data) => data);
			if (users && users.length > 0) {
				users.map((val) => {
					// eslint-disable-next-line new-cap
					const currentTime = new moment();
					const duration = moment.duration(currentTime.diff(val.createdAt));
					const hours = duration.get('hours');
					const days = duration.get('days');
					if (hours >= 23) {
						val.timeSince = `${ days }days`;
					} else {
						val.timeSince = `${ hours }h:${ duration.get('minutes') }m:${ duration.get('seconds') }s`;
					}
					this.subscribe('livechat:visitorPageVisited', { rid: '', token: val.token });
					const pageInfo = visitorNavigationHistory.find({ token: val.token }, { sort: { ts: -1 } }).map((data) => data);
					if (pageInfo) {
						val.pageInfo = pageInfo;
					}

					const room = LivechatRoom.findOne({ t: 'l', 'v.token': val.token });
					if (room && room.servedBy) {
						val.servedBy = room.servedBy;
					}
					if (['Macintosh', 'iPhone', 'iPad'].indexOf(val.deviceInfo.os) !== -1) {
						val.osIcon = 'icon-apple';
					} else {
						val.osIcon = `icon-${ val.deviceInfo.os.toLowerCase() }`;
					}
					val.browserIcon = `icon-${ val.deviceInfo.browserName.toLowerCase() }`;

					return val;
				});
			}
			this.users.set(users);
		}
	});
});
