import { Meteor } from 'meteor/meteor';

if (Meteor.isClient) {
	module.exports = require('./client/client.js');
}
if (Meteor.isServer) {
	module.exports = require('./server/server.js');
}
