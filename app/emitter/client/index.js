import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import CONSTANTS from '../constants';

Meteor.startup(function() {
	Tracker.autorun(() => !Meteor.userId() || Meteor.subscribe(CONSTANTS.STREAM));
});


Meteor.connection._stream.on('message', (raw_msg) => {
	console.log(raw_msg);
	// const msg = DDPCommon.parseDDP(raw_msg);
	// if (msg && msg.msg === 'changed' && msg.collection && msg.fields && msg.fields.eventName && msg.fields.args) {
	// 	msg.fields.args.unshift(msg.fields.eventName);
	// 	msg.fields.args.unshift(msg.collection);
	// 	this.emit.apply(this, msg.fields.args);
	// }
});
