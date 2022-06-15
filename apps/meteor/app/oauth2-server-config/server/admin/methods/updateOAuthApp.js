import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { hasPermission } from '../../../../authorization';
import { OAuthApps } from '../../../../models/server/raw';
import { Users } from '../../../../models/server';
import { parseUriList } from '../functions/parseUriList';

Meteor.methods({
	async updateOAuthApp(applicationId, application) {
		if (!hasPermission(this.userId, 'manage-oauth-apps')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'updateOAuthApp' });
		}
		if (!_.isString(application.name) || application.name.trim() === '') {
			throw new Meteor.Error('error-invalid-name', 'Invalid name', { method: 'updateOAuthApp' });
		}
		if (!_.isString(application.redirectUri) || application.redirectUri.trim() === '') {
			throw new Meteor.Error('error-invalid-redirectUri', 'Invalid redirectUri', {
				method: 'updateOAuthApp',
			});
		}
		if (!_.isBoolean(application.active)) {
			throw new Meteor.Error('error-invalid-arguments', 'Invalid arguments', {
				method: 'updateOAuthApp',
			});
		}
		const currentApplication = await OAuthApps.findOneById(applicationId);
		if (currentApplication == null) {
			throw new Meteor.Error('error-application-not-found', 'Application not found', {
				method: 'updateOAuthApp',
			});
		}

		const redirectUri = parseUriList(application.redirectUri);

		if (redirectUri.length === 0) {
			throw new Meteor.Error('error-invalid-redirectUri', 'Invalid redirectUri', {
				method: 'updateOAuthApp',
			});
		}

		await OAuthApps.updateOne(
			{ _id: applicationId },
			{
				$set: {
					name: application.name,
					active: application.active,
					redirectUri,
					_updatedAt: new Date(),
					_updatedBy: Users.findOne(this.userId, {
						fields: {
							username: 1,
						},
					}),
				},
			},
		);
		return OAuthApps.findOneById(applicationId);
	},
});
