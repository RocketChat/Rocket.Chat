import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';

import { Logger } from '../../logger';
import { settings, settingsRegistry } from '../../settings/server';

export const logger = new Logger('CAS');

Meteor.startup(function () {
	settingsRegistry.addGroup('CAS', function () {
		this.add('CAS_enabled', false, { type: 'boolean', group: 'CAS', public: true });
		this.add('CAS_base_url', '', { type: 'string', group: 'CAS', public: true });
		this.add('CAS_login_url', '', { type: 'string', group: 'CAS', public: true });
		this.add('CAS_version', '1.0', {
			type: 'select',
			values: [
				{ key: '1.0', i18nLabel: '1.0' },
				{ key: '2.0', i18nLabel: '2.0' },
			],
			group: 'CAS',
		});
		this.add('CAS_trust_username', false, {
			type: 'boolean',
			group: 'CAS',
			public: true,
			i18nDescription: 'CAS_trust_username_description',
		});
		// Enable/disable user creation
		this.add('CAS_Creation_User_Enabled', true, { type: 'boolean', group: 'CAS' });

		this.section('Attribute_handling', function () {
			// Enable/disable sync
			this.add('CAS_Sync_User_Data_Enabled', true, { type: 'boolean' });
			// Attribute mapping table
			this.add('CAS_Sync_User_Data_FieldMap', '{}', { type: 'string' });
		});

		this.section('CAS_Login_Layout', function () {
			this.add('CAS_popup_width', 810, { type: 'int', group: 'CAS', public: true });
			this.add('CAS_popup_height', 610, { type: 'int', group: 'CAS', public: true });
			this.add('CAS_button_label_text', 'CAS', { type: 'string', group: 'CAS' });
			this.add('CAS_button_label_color', '#FFFFFF', { type: 'color', group: 'CAS' });
			this.add('CAS_button_color', '#1d74f5', { type: 'color', group: 'CAS' });
			this.add('CAS_autoclose', true, { type: 'boolean', group: 'CAS' });
		});
	});
});

let timer;

function updateServices(/* record*/) {
	if (typeof timer !== 'undefined') {
		Meteor.clearTimeout(timer);
	}

	timer = Meteor.setTimeout(function () {
		const data = {
			// These will pe passed to 'node-cas' as options
			enabled: settings.get('CAS_enabled'),
			base_url: settings.get('CAS_base_url'),
			login_url: settings.get('CAS_login_url'),
			// Rocketchat Visuals
			buttonLabelText: settings.get('CAS_button_label_text'),
			buttonLabelColor: settings.get('CAS_button_label_color'),
			buttonColor: settings.get('CAS_button_color'),
			width: settings.get('CAS_popup_width'),
			height: settings.get('CAS_popup_height'),
			autoclose: settings.get('CAS_autoclose'),
		};

		// Either register or deregister the CAS login service based upon its configuration
		if (data.enabled) {
			logger.info('Enabling CAS login service');
			ServiceConfiguration.configurations.upsert({ service: 'cas' }, { $set: data });
		} else {
			logger.info('Disabling CAS login service');
			ServiceConfiguration.configurations.remove({ service: 'cas' });
		}
	}, 2000);
}

settings.watchByRegex(/^CAS_.+/, (key, value) => {
	updateServices(value);
});
