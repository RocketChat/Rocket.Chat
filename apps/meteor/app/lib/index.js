import { Meteor } from 'meteor/meteor';

if (Meteor.isServer) {
	module.exports = require('./server/');
}
if (Meteor.isClient) {
	module.exports = require('./client/');
}
