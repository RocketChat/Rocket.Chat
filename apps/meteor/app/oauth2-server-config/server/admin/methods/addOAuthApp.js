import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import _ from 'underscore';
import { OAuthApps, Users } from '@rocket.chat/models';

import { hasPermission } from '../../../../authorization/server';
import { parseUriList } from '../functions/parseUriList';
import { methodDeprecationLogger } from '../../../../lib/server/lib/deprecationWarningLogger';

export async function addOAuthApp(application, uid) {
	if (!hasPermission(uid, 'manage-oauth-apps')) {
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
	application._createdBy = await Users.findOne(uid, { projection: { username: 1 } });
	application._id = (await OAuthApps.insertOne(application)).insertedId;
	return application;
}

Meteor.methods({
	async addOAuthApp(application) {
		methodDeprecationLogger.warn('addOAuthApp is deprecated and will be removed in future versions of Rocket.Chat');

		return addOAuthApp(application, this.userId);
	},
});
