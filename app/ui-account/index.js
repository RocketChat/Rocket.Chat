import { Meteor } from 'meteor/meteor';

if (Meteor.isClient) {
	module.exports = require('./client/index.js');
}
