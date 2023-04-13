import { Meteor } from 'meteor/meteor';

// HACK: this barrel export is needed in JS to make the desktop app work

if (Meteor.isClient) {
	module.exports = require('./client/index.ts');
}
if (Meteor.isServer) {
	module.exports = require('./server/index.ts');
}
