import type { IOAuthApps, IUser } from '@rocket.chat/core-typings';
import { OAuthApps, Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import type { OauthAppsAddParams } from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { parseUriList } from './parseUriList';

export async function addOAuthApp(applicationParams: OauthAppsAddParams, uid: IUser['_id'] | undefined): Promise<IOAuthApps> {
	if (!uid) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'addOAuthApp' });
	}

	const user = await Users.findOneById(uid, { projection: { username: 1 } });

	if (!user?.username) {
		// TODO: username is required, but not always present
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'addOAuthApp' });
	}

	if (!(await hasPermissionAsync(uid, 'manage-oauth-apps'))) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'addOAuthApp' });
	}

	if (!applicationParams.name || typeof applicationParams.name.valueOf() !== 'string' || applicationParams.name.trim() === '') {
		throw new Meteor.Error('error-invalid-name', 'Invalid name', { method: 'addOAuthApp' });
	}

	if (
		!applicationParams.redirectUri ||
		typeof applicationParams.redirectUri.valueOf() !== 'string' ||
		applicationParams.redirectUri.trim() === ''
	) {
		throw new Meteor.Error('error-invalid-redirectUri', 'Invalid redirectUri', {
			method: 'addOAuthApp',
		});
	}

	if (typeof applicationParams.active !== 'boolean') {
		throw new Meteor.Error('error-invalid-arguments', 'Invalid arguments', {
			method: 'addOAuthApp',
		});
	}

	const application = {
		...applicationParams,
		redirectUri: parseUriList(applicationParams.redirectUri),
		clientId: Random.id(),
		clientSecret: Random.secret(),
		_createdAt: new Date(),
		_updatedAt: new Date(),
		_createdBy: {
			_id: user._id,
			username: user.username,
		},
	};

	if (application.redirectUri.length === 0) {
		throw new Meteor.Error('error-invalid-redirectUri', 'Invalid redirectUri', {
			method: 'addOAuthApp',
		});
	}

	return {
		...application,
		_id: (await OAuthApps.insertOne(application)).insertedId,
	};
}
