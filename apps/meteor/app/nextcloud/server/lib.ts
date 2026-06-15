import type { OAuthConfiguration } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import passport from 'passport';

import { addPassportCustomOAuth } from '../../../server/lib/oauth/addPassportCustomOAuth';
import { CustomOAuth } from '../../custom-oauth/server/custom_oauth_server';
import { settings } from '../../settings/server/cached';

const NEXTCLOUD_PATHS = {
	serverURL: '',
	tokenPath: '/index.php/apps/oauth2/api/v1/token',
	tokenSentVia: 'header' as OAuthConfiguration['tokenSentVia'],
	authorizePath: '/index.php/apps/oauth2/authorize',
	identityPath: '/ocs/v2.php/cloud/user?format=json',
	scope: 'openid',
	addAutopublishFields: {
		forLoggedInUser: ['services.nextcloud'],
		forOtherUsers: ['services.nextcloud.name'],
	},
};

const Nextcloud = new CustomOAuth('nextcloud', NEXTCLOUD_PATHS);

function configureNextcloudOAuth(): void {
	passport.unuse('nextcloud');
	const enabled = settings.get<boolean>('Accounts_OAuth_Nextcloud');
	if (!enabled) {
		return;
	}

	const serverURL = settings.get<string>('Accounts_OAuth_Nextcloud_URL')?.trim().replace(/\/*$/, '');
	const clientId = settings.get<string>('Accounts_OAuth_Nextcloud_id');
	const clientSecret = settings.get<string>('Accounts_OAuth_Nextcloud_secret');

	if (!serverURL || !clientId || !clientSecret) {
		return;
	}

	const config = { ...NEXTCLOUD_PATHS, serverURL, clientId, clientSecret };

	if (settings.get<boolean>('Accounts_OAuth_Use_Modern_Flow')) {
		addPassportCustomOAuth('nextcloud', config);
		return;
	}

	Nextcloud.configure(config);
}

Meteor.startup(() => {
	settings.watchMultiple(
		[
			'Accounts_OAuth_Nextcloud',
			'Accounts_OAuth_Nextcloud_URL',
			'Accounts_OAuth_Nextcloud_id',
			'Accounts_OAuth_Nextcloud_secret',
			'Accounts_OAuth_Use_Modern_Flow',
		],
		configureNextcloudOAuth,
	);
});
