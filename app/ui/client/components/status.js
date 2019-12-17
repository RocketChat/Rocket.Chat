import _ from 'underscore';
import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import './status.html';
import { isMobile } from '../../../utils';


const retryTime = new ReactiveVar(0);
const nextRetry = new ReactiveVar(0);
let retryHandle = null;
let intervalId = null;

const clearRetryInterval = function() {
	clearInterval(retryHandle);

	retryHandle = null;
};

const reconnectToServer = function() {
	if (Meteor.status().status === 'waiting') {
		nextRetry.set(new Date((new Date()).getTime() + 5000));
		intervalId = intervalId || Meteor.setInterval(function() {
			nextRetry.set(new Date((new Date()).getTime() + 5000));
			Meteor.reconnect();
		}, 5000);
	} else {
		Meteor.clearInterval(intervalId);
		intervalId = null;
	}
};

const trackStatus = function() {
	if (Meteor.status().status === 'waiting') {
		retryHandle = retryHandle || setInterval(function() {
			const timeDiff = nextRetry.get() - (new Date()).getTime();
			const _retryTime = (timeDiff > 0 && Math.round(timeDiff / 1000)) || 0;

			retryTime.set(_retryTime);
		}, 500);
	} else {
		clearRetryInterval();
	}
};

Template.status.onDestroyed(clearRetryInterval);

Template.status.onCreated(function() {
	this.autorun(trackStatus);
	this.autorun(reconnectToServer);
});

Template.status.helpers({
	connected() {
		return Meteor.status().connected;
	},

	showTopStatus() {
		return !isMobile();
	},

	message() {
		return TAPi18n.__('meteor_status', { context: Meteor.status().status });
	},

	shortMessage() {
		return TAPi18n.__('meteor_short_status', { context: Meteor.status().status });
	},

	extraMessage() {
		if (Meteor.status().status === 'waiting') {
			return TAPi18n.__('meteor_status_reconnect_in', { count: retryTime.get() });
		}
	},

	extraShortMessage() {
		if (Meteor.status().status === 'waiting') {
			return TAPi18n.__('meteor_short_status_reconnect_in', { count: retryTime.get() });
		}
	},

	showReconnect() {
		return _.contains(['waiting', 'offline'], Meteor.status().status);
	},

	showShortReconnect() {
		return _.contains(['offline'], Meteor.status().status);
	},

	reconnectLabel() {
		return TAPi18n.__('meteor_status_try_now', { context: Meteor.status().status });
	},
});

Template.status.events({
	'click a.alert-link'(e) {
		e.preventDefault();
		Meteor.reconnect();
	},
});
