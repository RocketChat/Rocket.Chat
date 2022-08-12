import { Meteor } from 'meteor/meteor';

if (Meteor.isClient) {
	module.exports = require('./client/index.js');
}
if (Meteor.isServer) {
	module.exports = require('./server/index');
}
