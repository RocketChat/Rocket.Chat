import type { OAuthConfiguration } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import passport from 'passport';
import _ from 'underscore';

import { addPassportCustomOAuth } from '../../../server/lib/oauth/addPassportCustomOAuth';
import { settings } from '../../settings/server';

const config: Partial<OAuthConfiguration> = {
	identityPath: '/oauth2/UserInfo',
	authorizePath: '/oauth2/authorize',
	tokenPath: '/oauth2/token',
	scope: 'openid email profile offline_access',
	tokenSentVia: 'payload',
	usernameField: 'preferred_username',
	mergeUsers: true,
	addAutopublishFields: {
		forLoggedInUser: ['services.drupal'],
		forOtherUsers: ['services.drupal.name'],
	},
	accessTokenParam: 'access_token',
};

const configureDrupalOAuth = () => {
	passport.unuse('drupal');
	const enabled = settings.get<boolean>('Accounts_OAuth_Drupal');
	if (!enabled) {
		return;
	}

	const serverURL = settings.get<string>('API_Drupal_URL').trim().replace(/\/*$/, '');
	const clientId = settings.get<string>('Accounts_OAuth_Drupal_id');
	const clientSecret = settings.get<string>('Accounts_OAuth_Drupal_secret');

	if (!clientId || !clientSecret || !serverURL) {
		return;
	}

	addPassportCustomOAuth('drupal', { ...config, serverURL, clientId, clientSecret });
};

Meteor.startup(() => {
	const updateConfig = _.debounce(configureDrupalOAuth, 300);

	settings.watchMultiple(
		['Accounts_OAuth_Drupal', 'API_Drupal_URL', 'Accounts_OAuth_Drupal_id', 'Accounts_OAuth_Drupal_secret'],
		updateConfig,
	);
});
