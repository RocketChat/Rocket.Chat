import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

import { SmartiAdapter } from '../lib/SmartiAdapter';

Meteor.methods({

	resyncRoom(rid, ignoreSyncFlag = true) {
		if (!RocketChat.authz.hasRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error(`SmartiResynch - triggerResync not permitted for user [ ${ Meteor.userId() } ]`);
		}
		SmartiAdapter.resyncRoom(rid, ignoreSyncFlag);
	},

	triggerResync() {
		if (!RocketChat.authz.hasRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error(`SmartiResynch - triggerResync not permitted for user [ ${ Meteor.userId() } ]`);
		}
		return SmartiAdapter.resync(false);
	},

	triggerFullResync() {
		if (!RocketChat.authz.hasRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error(`SmartiResynch - triggerResync not permitted for user [ ${ Meteor.userId() } ]`);
		}
		return SmartiAdapter.resync(true);
	},
});

/**
 * Limit exposed methods to prevent DOS.
 */

RocketChat.RateLimiter.limitMethod('triggerResync', 1, 2000, {
	userId() { return true; },
});
RocketChat.RateLimiter.limitMethod('triggerFullResync', 1, 2000, {
	userId() { return true; },
});
