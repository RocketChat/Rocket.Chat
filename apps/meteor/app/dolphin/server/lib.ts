import type { IUser, OAuthConfiguration } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';
import passport from 'passport';
import _ from 'underscore';

import { callbacks } from '../../../server/lib/callbacks';
import { beforeCreateUserCallback } from '../../../server/lib/callbacks/beforeCreateUserCallback';
import { addPassportCustomOAuth } from '../../../server/lib/oauth/addPassportCustomOAuth';
import { settings } from '../../settings/server';

const config: Partial<OAuthConfiguration> = {
	serverURL: '',
	authorizePath: '/m/oauth2/auth/',
	tokenPath: '/m/oauth2/token/',
	identityPath: '/m/oauth2/api/me/',
	scope: 'basic',
	addAutopublishFields: {
		forLoggedInUser: ['services.dolphin'],
		forOtherUsers: ['services.dolphin.name'],
	},
	accessTokenParam: 'access_token',
};

function DolphinOnCreateUser(options: any, user?: IUser) {
	// TODO: callbacks Fix this
	if (user?.services?.dolphin?.NickName) {
		user.username = user.services.dolphin.NickName;
	}
	return options;
}

const configureDolphinOAuth = () => {
	passport.unuse('dolphin');

	const enabled = settings.get<boolean>('Accounts_OAuth_Dolphin');
	if (!enabled) {
		return;
	}

	const serverURL = settings.get<string>('Accounts_OAuth_Dolphin_URL').trim().replace(/\/*$/, '');
	const clientId = settings.get<string>('Accounts_OAuth_Dolphin_id');
	const clientSecret = settings.get<string>('Accounts_OAuth_Dolphin_secret');

	if (!clientId || !clientSecret || !serverURL) {
		return;
	}

	addPassportCustomOAuth('dolphin', { ...config, serverURL, clientId, clientSecret });
};

Meteor.startup(async () => {
	const updateConfig = () => _.debounce(configureDolphinOAuth, 300);

	settings.watchMultiple(
		['Accounts_OAuth_Dolphin', 'Accounts_OAuth_Dolphin_URL', 'Accounts_OAuth_Dolphin_id', 'Accounts_OAuth_Dolphin_secret'],
		updateConfig,
	);

	if (settings.get('Accounts_OAuth_Dolphin_URL')) {
		const data = {
			buttonLabelText: settings.get<string>('Accounts_OAuth_Dolphin_button_label_text'),
			buttonColor: settings.get<string>('Accounts_OAuth_Dolphin_button_color'),
			buttonLabelColor: settings.get<string>('Accounts_OAuth_Dolphin_button_label_color'),
			clientId: settings.get<string>('Accounts_OAuth_Dolphin_id'),
			secret: settings.get<string>('Accounts_OAuth_Dolphin_secret'),
			serverURL: settings.get<string>('Accounts_OAuth_Dolphin_URL'),
			loginStyle: settings.get<string>('Accounts_OAuth_Dolphin_login_style'),
		};

		await ServiceConfiguration.configurations.upsertAsync({ service: 'dolphin' }, { $set: data });
	}

	beforeCreateUserCallback.add(DolphinOnCreateUser, callbacks.priority.HIGH, 'dolphin');
});
