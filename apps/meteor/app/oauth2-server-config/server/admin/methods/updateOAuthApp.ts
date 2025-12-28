import type { IOAuthApps } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { OAuthApps, Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { parseUriList } from '../functions/parseUriList';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		updateOAuthApp(
			applicationId: IOAuthApps['_id'],
			application: Pick<IOAuthApps, 'name' | 'redirectUri' | 'active'>,
		): Promise<IOAuthApps | null>;
	}
}

export const updateOAuthApp = async (
	userId: string,
	applicationId: IOAuthApps['_id'],
	application: Pick<IOAuthApps, 'name' | 'redirectUri' | 'active'>,
): Promise<IOAuthApps | null> => {
	if (!(await hasPermissionAsync(userId, 'manage-oauth-apps'))) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'updateOAuthApp' });
	}

	if (!application.name || typeof application.name.valueOf() !== 'string' || application.name.trim() === '') {
		throw new Meteor.Error('error-invalid-name', 'Invalid name', { method: 'updateOAuthApp' });
	}

	if (!application.redirectUri || typeof application.redirectUri.valueOf() !== 'string' || application.redirectUri.trim() === '') {
		throw new Meteor.Error('error-invalid-redirectUri', 'Invalid redirectUri', {
			method: 'updateOAuthApp',
		});
	}

	if (typeof application.active !== 'boolean') {
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
				_updatedBy: await Users.findOneById(userId, {
					projection: {
						username: 1,
					},
				}),
			},
		},
	);
	return OAuthApps.findOneById(applicationId);
};

Meteor.methods<ServerMethods>({
	async updateOAuthApp(applicationId, application) {
		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'updateOAuthApp' });
		}

		return updateOAuthApp(this.userId, applicationId, application);
	},
});
