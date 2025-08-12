import type { IUser } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';

import { callbacks } from '../../../lib/callbacks';
import { beforeCreateUserCallback } from '../../../lib/callbacks/beforeCreateUserCallback';
import { CustomOAuth } from '../../custom-oauth/server/custom_oauth_server';
import { settings } from '../../settings/server';

const config = {
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

const Dolphin = new CustomOAuth('dolphin', config);

function DolphinOnCreateUser(options: any, user?: IUser) {
	// TODO: callbacks Fix this
	if (user?.services?.dolphin?.NickName) {
		user.username = user.services.dolphin.NickName;
	}
	return options;
}

Meteor.startup(async () => {
	settings.watch<string>('Accounts_OAuth_Dolphin_URL', (value) => {
		config.serverURL = value;
		return Dolphin.configure(config);
	});

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
