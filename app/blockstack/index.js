import { Meteor } from 'meteor/meteor';

if (Meteor.isServer) {
	module.exports = require('./server/main.js');
}
if (Meteor.isClient) {
	module.exports = require('./client/main.js');
}
