import { Template } from 'meteor/templating';
import { Mongo } from 'meteor/mongo';
import { ReactiveVar } from 'meteor/reactive-var';
import moment from 'moment';

import { LivechatRoom } from '../../collections/LivechatRoom';
import { visitorNavigationHistory } from '../../collections/LivechatVisitorNavigation';

import './livechatDashboard.html';


const LivechatLocation = new Mongo.Collection('livechatLocation');

Template.livechatDashboard.helpers({
	visitors() {
		return Template.instance().users.get();
	},
});

Template.livechatDashboard.events({
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

	this.autorun(() => {
		this.ready.set(this.subscribe('livechat:rooms', {}, 0, this.limit.get()).ready());
	});

	this.autorun(() => {
		const sub = this.subscribe('livechat:location', this.filter.get());
		if (sub.ready()) {
			const users = LivechatLocation.find({}).map((data) => data);
			if (users && users.length > 0) {
				users.map((val) => {
					const currentTime = new moment();
					const duration = moment.duration(currentTime.diff(val._updatedAt));
					val.timeSince = `${ duration.get('hours') }:${ duration.get('minutes') }:${ duration.get('seconds') }`;
					const room = LivechatRoom.findOne({ t: 'l', 'v.token': val.token });
					if (room && room.servedBy) {
						val.servedBy = room.servedBy;
						this.subscribe('livechat:visitorPageVisited', { rid: room._id });
						const pageInfo = visitorNavigationHistory.findOne({ rid: room._id }, { sort: { ts: -1 } });
						if (pageInfo) {
							val.pageInfo = pageInfo;
						}
					}


					return val;
				});
			}
			this.users.set(users);
		}
	});
});
