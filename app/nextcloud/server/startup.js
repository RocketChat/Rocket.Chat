import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { settings } from '../../settings/server';
import { CustomOAuth } from '../../custom-oauth/server';

const config = {
	serverURL: '',
	tokenPath: '/index.php/apps/oauth2/api/v1/token',
	tokenSentVia: 'header',
	authorizePath: '/index.php/apps/oauth2/authorize',
	identityPath: '/ocs/v2.php/cloud/user?format=json',
	scope: 'openid',
	addAutopublishFields: {
		forLoggedInUser: ['services.nextcloud'],
		forOtherUsers: ['services.nextcloud.name'],
	},
};

const Nextcloud = new CustomOAuth('nextcloud', config);

const fillServerURL = _.debounce(Meteor.bindEnvironment(() => {
	const nextcloudURL = settings.get('Accounts_OAuth_Nextcloud_URL');
	if (!nextcloudURL) {
		if (nextcloudURL === undefined) {
			return fillServerURL();
		}
		return;
	}
	config.serverURL = nextcloudURL.trim().replace(/\/*$/, '');
	return Nextcloud.configure(config);
}), 1000);

Meteor.startup(function() {
	settings.get('Accounts_OAuth_Nextcloud_URL', () => fillServerURL());
});

settings.addGroup('OAuth', function() {
	this.section('Nextcloud', function() {
		const enableQuery = {
			_id: 'Accounts_OAuth_Nextcloud',
			value: true,
		};

		this.add('Accounts_OAuth_Nextcloud', false, { type: 'boolean', public: true });
		this.add('Accounts_OAuth_Nextcloud_URL', '', { type: 'string', enableQuery, public: true });
		this.add('Accounts_OAuth_Nextcloud_id', '', { type: 'string', enableQuery });
		this.add('Accounts_OAuth_Nextcloud_secret', '', { type: 'string', enableQuery });
		this.add('Accounts_OAuth_Nextcloud_callback_url', '_oauth/nextcloud', { type: 'relativeUrl', readonly: true, force: true, enableQuery });
		this.add('Accounts_OAuth_Nextcloud_button_label_text', 'Nextcloud', { type: 'string', public: true, i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Text', persistent: true });
		this.add('Accounts_OAuth_Nextcloud_button_label_color', '#ffffff', { type: 'string', public: true, i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Color', persistent: true });
		this.add('Accounts_OAuth_Nextcloud_button_color', '#0082c9', { type: 'string', public: true, i18nLabel: 'Accounts_OAuth_Custom_Button_Color', persistent: true });
	});
});
