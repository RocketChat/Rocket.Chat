import { Meteor } from 'meteor/meteor';

if (Meteor.isClient) {
	module.exports = require('./client/custom_oauth_client.js');
}

if (Meteor.isServer) {
	module.exports = require('../../server/integrations/oauth/custom');
}
