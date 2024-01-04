import { Logger } from '@rocket.chat/logger';
import { ServiceConfiguration } from 'meteor/service-configuration';

import { settings } from '../../settings/server';

export const logger = new Logger('CAS');

let timer;

async function updateServices(/* record*/) {
	if (typeof timer !== 'undefined') {
		clearTimeout(timer);
	}

	timer = setTimeout(async () => {
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
			await ServiceConfiguration.configurations.upsertAsync({ service: 'cas' }, { $set: data });
		} else {
			logger.info('Disabling CAS login service');
			await ServiceConfiguration.configurations.removeAsync({ service: 'cas' });
		}
	}, 2000);
}

settings.watchByRegex(/^CAS_.+/, async (key, value) => {
	await updateServices(value);
});
