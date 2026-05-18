import type { OAuthConfiguration } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import passport from 'passport';

import { addPassportCustomOAuth } from '../../../server/lib/oauth/addPassportCustomOAuth';
import { settings } from '../../settings/server';

const config: Partial<OAuthConfiguration> = {
	serverURL: 'https://www.linkedin.com',
	authorizePath: '/oauth/v2/authorization',
	tokenPath: '/oauth/v2/accessToken',
	identityPath: 'https://api.linkedin.com/v2/userinfo',
	scope: 'openid email profile',
	tokenSentVia: 'header',
	addAutopublishFields: {
		forLoggedInUser: ['services.linkedin'],
		forOtherUsers: ['services.linkedin.name'],
	},
	pkce: false,
	emailField: 'email',
	avatarField: 'picture',
};

const serviceKey = 'linkedin';

const configureLinkedInOAuth = (): void => {
	passport.unuse(serviceKey);

	const enabled = settings.get<boolean>('Accounts_OAuth_Linkedin');
	if (!enabled) {
		return;
	}

	const clientId = settings.get<string>('Accounts_OAuth_Linkedin_id');
	const clientSecret = settings.get<string>('Accounts_OAuth_Linkedin_secret');

	if (!clientId || !clientSecret) {
		return;
	}

	addPassportCustomOAuth(serviceKey, { ...config, clientId, clientSecret });
};

Meteor.startup(() => {
	settings.watchMultiple(
		['Accounts_OAuth_Linkedin', 'Accounts_OAuth_Linkedin_id', 'Accounts_OAuth_Linkedin_secret'],
		configureLinkedInOAuth,
	);
});
