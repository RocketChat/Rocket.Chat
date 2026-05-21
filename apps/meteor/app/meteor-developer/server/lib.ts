import type { OAuthConfiguration } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import passport from 'passport';

import { addPassportCustomOAuth } from '../../../server/lib/oauth/addPassportCustomOAuth';
import { settings } from '../../settings/server';

const config: Partial<OAuthConfiguration> = {
	serverURL: 'https://www.meteor.com',
	authorizePath: '/oauth2/authorize',
	tokenPath: '/oauth2/token',
	identityPath: '/api/v1/identity',
	scope: 'email',
	tokenSentVia: 'header',
	addAutopublishFields: {
		forLoggedInUser: ['services.meteor-developer'],
		forOtherUsers: ['services.meteor-developer.username'],
	},
};

const serviceKey = 'meteor-developer';

const configureMeteorDeveloperOAuth = (): void => {
	passport.unuse(serviceKey);

	const enabled = settings.get<boolean>('Accounts_OAuth_Meteor');
	if (!enabled) {
		return;
	}

	const clientId = settings.get<string>('Accounts_OAuth_Meteor_id');
	const clientSecret = settings.get<string>('Accounts_OAuth_Meteor_secret');

	if (!clientId || !clientSecret) {
		return;
	}

	addPassportCustomOAuth(serviceKey, { ...config, clientId, clientSecret });
};

Meteor.startup(() => {
	settings.watchMultiple(
		['Accounts_OAuth_Meteor', 'Accounts_OAuth_Meteor_id', 'Accounts_OAuth_Meteor_secret'],
		configureMeteorDeveloperOAuth,
	);
});
