import { Meteor } from 'meteor/meteor';
import { hasRole } from '../../../../authorization';
import { SmartiAdapter } from '../lib/SmartiAdapter';
import { RateLimiter } from '../../../../lib/server/lib';

Meteor.methods({

	resyncRoom(rid, ignoreSyncFlag = true) {
		if (!hasRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error(`SmartiResynch - triggerResync not permitted for user [ ${ Meteor.userId() } ]`);
		}
		SmartiAdapter.resyncRoom(rid, ignoreSyncFlag);
	},

	triggerResync() {
		if (!hasRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error(`SmartiResynch - triggerResync not permitted for user [ ${ Meteor.userId() } ]`);
		}
		return SmartiAdapter.resync(false);
	},

	triggerFullResync() {
		if (!hasRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error(`SmartiResynch - triggerResync not permitted for user [ ${ Meteor.userId() } ]`);
		}
		return SmartiAdapter.resync(true);
	},
});

/**
 * Limit exposed methods to prevent DOS.
 */

RateLimiter.limitMethod('triggerResync', 1, 2000, {
	userId() { return true; },
});
RateLimiter.limitMethod('triggerFullResync', 1, 2000, {
	userId() { return true; },
});
