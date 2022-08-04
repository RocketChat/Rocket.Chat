import { Meteor } from 'meteor/meteor';

if (Meteor.isClient) {
	module.exports = require('./client/');
}
if (Meteor.isServer) {
	module.exports = require('./server/');
}
