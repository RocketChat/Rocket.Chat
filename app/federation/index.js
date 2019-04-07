import { Meteor } from 'meteor/meteor';

if (Meteor.isClient) {
	module.exports = require('./client/main.js');
}
if (Meteor.isServer) {
	module.exports = require('./server/main.js');
}
