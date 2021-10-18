import { Meteor } from 'meteor/meteor';

if (Meteor.isServer) {
	module.exports = require('./server/index.js');
}
if (Meteor.isClient) {
	module.exports = require('./client/index.js');
}
