import { Meteor } from 'meteor/meteor';

if (Meteor.isClient) {
	module.exports = require('./client/rocketchat.e2e.js');
}
if (Meteor.isServer) {
	module.exports = require('./server/index.js');
}
