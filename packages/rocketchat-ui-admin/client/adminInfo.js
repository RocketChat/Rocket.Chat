import s from 'underscore.string';
import moment from 'moment';

Template.adminInfo.helpers({
	isReady() {
		return Template.instance().ready.get();
	},
	statistics() {
		return Template.instance().statistics.get();
	},
	instances() {
		return Template.instance().instances.get();
	},
	inGB(size) {
		if (size > 1073741824) {
			return `${ s.numberFormat(size / 1024 / 1024 / 1024, 2) } GB`;
		}
		return `${ s.numberFormat(size / 1024 / 1024, 2) } MB`;
	},
	humanReadableTime(time) {
		const days = Math.floor(time / 86400);
		const hours = Math.floor((time % 86400) / 3600);
		const minutes = Math.floor(((time % 86400) % 3600) / 60);
		const seconds = Math.floor(((time % 86400) % 3600) % 60);
		let out = '';
		if (days > 0) {
			out += `${ days } ${ TAPi18n.__('days') }, `;
		}
		if (hours > 0) {
			out += `${ hours } ${ TAPi18n.__('hours') }, `;
		}
		if (minutes > 0) {
			out += `${ minutes } ${ TAPi18n.__('minutes') }, `;
		}
		if (seconds > 0) {
			out += `${ seconds } ${ TAPi18n.__('seconds') }`;
		}
		return out;
	},
	formatDate(date) {
		if (date) {
			return moment(date).format('LLL');
		}
	},
	numFormat(number) {
		return s.numberFormat(number, 2);
	},
	info() {
		return RocketChat.Info;
	},
	build() {
		return RocketChat.Info && RocketChat.Info.compile || RocketChat.Info && RocketChat.Info.build;
	}
});

Template.adminInfo.events({
	'click .refresh'(e, instance) {
		instance.ready.set(false);
		return Meteor.call('getStatistics', true, function(error, statistics) {
			instance.ready.set(true);
			if (error) {
				return handleError(error);
			} else {
				return instance.statistics.set(statistics);
			}
		});
	}
});

Template.adminInfo.onRendered(function() {
	return Tracker.afterFlush(function() {
		SideNav.setFlex('adminFlex');
		return SideNav.openFlex();
	});
});

Template.adminInfo.onCreated(function() {
	const instance = this;
	this.statistics = new ReactiveVar({});
	this.instances = new ReactiveVar({});
	this.ready = new ReactiveVar(false);
	if (RocketChat.authz.hasAllPermission('view-statistics')) {
		Meteor.call('getStatistics', function(error, statistics) {
			instance.ready.set(true);
			if (error) {
				handleError(error);
			} else {
				instance.statistics.set(statistics);
			}
		});

		Meteor.call('instances/get', function(error, instances) {
			instance.ready.set(true);
			if (error) {
				handleError(error);
			} else {
				instance.instances.set(instances);
			}
		});
	}
});
