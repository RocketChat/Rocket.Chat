import { Meteor } from 'meteor/meteor';

if (Meteor.isServer) {
	module.exports = require('./server/bigbluebutton-api.js');
}
