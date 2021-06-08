import { Meteor } from 'meteor/meteor';

if (Meteor.isClient) {
	module.exports = require('./client/custom_oauth_client.js');
}
