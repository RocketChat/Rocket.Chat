import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import _ from 'underscore';

import { hasPermission } from '../../../../authorization';
import { Users } from '../../../../models/server';
import { OAuthApps } from '../../../../models/server/raw';
import { parseUriList } from '../functions/parseUriList';

Meteor.methods({
	async addOAuthApp(application) {
		if (!hasPermission(this.userId, 'manage-oauth-apps')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'addOAuthApp' });
		}
		if (!_.isString(application.name) || application.name.trim() === '') {
			throw new Meteor.Error('error-invalid-name', 'Invalid name', { method: 'addOAuthApp' });
		}
		if (!_.isString(application.redirectUri) || application.redirectUri.trim() === '') {
			throw new Meteor.Error('error-invalid-redirectUri', 'Invalid redirectUri', {
				method: 'addOAuthApp',
			});
		}
		if (!_.isBoolean(application.active)) {
			throw new Meteor.Error('error-invalid-arguments', 'Invalid arguments', {
				method: 'addOAuthApp',
			});
		}

		application.redirectUri = parseUriList(application.redirectUri);

		if (application.redirectUri.length === 0) {
			throw new Meteor.Error('error-invalid-redirectUri', 'Invalid redirectUri', {
				method: 'addOAuthApp',
			});
		}

		application.clientId = Random.id();
		application.clientSecret = Random.secret();
		application._createdAt = new Date();
		application._createdBy = Users.findOne(this.userId, { fields: { username: 1 } });
		application._id = (await OAuthApps.insertOne(application)).insertedId;
		return application;
	},
});
