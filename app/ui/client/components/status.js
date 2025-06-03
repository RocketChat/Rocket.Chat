import _ from 'underscore';
import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import './status.html';
import { webSocketConnected } from '/app/ws/client';

const retryTime = new ReactiveVar(0);
let attempts = 0
let retryHandle = null;
let lastRetryTime = null



const clearRetryInterval = function() {
	clearInterval(retryHandle);

	retryHandle = null;
	attempts = 0;
};

const trackStatus = function() {
	if (!webSocketConnected.get()) {
		lastRetryTime = Date.now() +  Math.min(300000, Math.pow(2, attempts) * 1000); ;
		retryHandle = retryHandle || setInterval(function() {			const timeDiff = lastRetryTime - new Date().getTime(); 
			if (timeDiff <= 0) {
				attempts ++;
				lastRetryTime = Date.now() +  Math.min(30000, Math.pow(2, attempts) * 1000); ;
			}
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
});

Template.status.helpers({
	connected() {
		return webSocketConnected.get();
	},

	message() {
		return ''
		return TAPi18n.__('meteor_status', { context: Meteor.status().status });
	},

	extraMessage() {
		if (!webSocketConnected.get()) {
			return TAPi18n.__('meteor_status_reconnect_in', { count: retryTime.get() });
		}
	},

	showReconnect() {
		return (!webSocketConnected.get());
	},

	reconnectLabel() {
		return TAPi18n.__('meteor_status_try_now_waiting');
	},
});

Template.status.events({
	'click a.alert-link'(e) {
		e.preventDefault();
		//Meteor.reconnect();
	},
});
