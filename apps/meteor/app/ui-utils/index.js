import { Meteor } from 'meteor/meteor';

if (Meteor.isClient) {
	module.exports = require('./client/index.ts');
}
if (Meteor.isServer) {
	module.exports = require('./server/index.js');
}
