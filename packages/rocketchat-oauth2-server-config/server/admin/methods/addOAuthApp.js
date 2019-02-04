import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { hasPermission } from 'meteor/rocketchat:authorization';
import { Users, OAuthApps } from 'meteor/rocketchat:models';
import _ from 'underscore';

Meteor.methods({
	addOAuthApp(application) {
		if (!hasPermission(this.userId, 'manage-oauth-apps')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'addOAuthApp' });
		}
		if (!_.isString(application.name) || application.name.trim() === '') {
			throw new Meteor.Error('error-invalid-name', 'Invalid name', { method: 'addOAuthApp' });
		}
		if (!_.isString(application.redirectUri) || application.redirectUri.trim() === '') {
			throw new Meteor.Error('error-invalid-redirectUri', 'Invalid redirectUri', { method: 'addOAuthApp' });
		}
		if (!_.isBoolean(application.active)) {
			throw new Meteor.Error('error-invalid-arguments', 'Invalid arguments', { method: 'addOAuthApp' });
		}
		application.clientId = Random.id();
		application.clientSecret = Random.secret();
		application._createdAt = new Date;
		application._createdBy = Users.findOne(this.userId, { fields: { username: 1 } });
		application._id = OAuthApps.insert(application);
		return application;
	},
});
