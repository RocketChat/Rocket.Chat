import { Migrations } from '../../migrations';
import { Settings } from '../../../app/models/server';
import { settings } from '../../../app/settings/server';

Migrations.add({
	version: 160,
	up() {
		const emailFieldSetting = Settings.findOne({ _id: 'SAML_Custom_Default_email_field' });
		const usernameFieldSetting = Settings.findOne({ _id: 'SAML_Custom_Default_username_field' });

		Settings.removeById('SAML_Custom_Default_email_field');
		Settings.removeById('SAML_Custom_Default_username_field');

		if (!settings.get('SAML_Custom_Default')) {
			return;
		}

		const emailField = (emailFieldSetting && emailFieldSetting.value) || 'email';
		const usernameField = (usernameFieldSetting && usernameFieldSetting.value) || 'username';

		if (emailField === 'email' && usernameField === 'username') {
			// If using default values, there's no need to initialize the new setting here.
			return;
		}

		const defaultMapping = `{"${ usernameField }":"username", "${ emailField }":"email", "cn": "name"}`;

		Settings.upsert({
			_id: 'SAML_Custom_Default_user_data_fieldmap',
		},
		{
			_id: 'SAML_Custom_Default_user_data_fieldmap',
			value: defaultMapping,
			type: 'string',
			group: 'SAML',
			section: 'Default',
			i18nLabel: 'SAML_Custom_user_data_fieldmap',
			i18nDescription: 'SAML_Custom_user_data_fieldmap_description',
		});
	},
	down() {
		// Down migration does not apply in this case
	},
});
