import crypto from 'crypto';

import { v4 as uuidv4 } from 'uuid';

import { settings, settingsRegistry } from '../../app/settings/server';

export const createMatrixFederationSettings = async () => {


	await settingsRegistry.add('Federation_Matrix_enabled', false, {
		readonly: false,
		type: 'boolean',
		i18nLabel: 'Federation_Matrix_enabled',
		i18nDescription: 'Federation_Matrix_enabled_desc',
		alert: 'Federation_Matrix_Enabled_Alert',
		public: true,
		group: 'Federation',
		section: 'Matrix Bridge',
	});

	const uniqueId = settings.get('uniqueID') || uuidv4().slice(0, 15).replace(new RegExp('-', 'g'), '_');
	const homeserverToken = crypto.createHash('sha256').update(`hs_${uniqueId}`).digest('hex');
	const applicationServiceToken = crypto.createHash('sha256').update(`as_${uniqueId}`).digest('hex');


	await settingsRegistry.add('Federation_Matrix_id', `rocketchat_${uniqueId}`, {
		readonly: true,
		type: 'string',
		i18nLabel: 'Federation_Matrix_id',
		i18nDescription: 'Federation_Matrix_id_desc',
		group: 'Federation',
		section: 'Matrix Bridge',
	});

	await settingsRegistry.add('Federation_Matrix_hs_token', homeserverToken, {
		readonly: true,
		type: 'string',
		i18nLabel: 'Federation_Matrix_hs_token',
		i18nDescription: 'Federation_Matrix_hs_token_desc',
		group: 'Federation',
		section: 'Matrix Bridge',
	});

	await settingsRegistry.add('Federation_Matrix_as_token', applicationServiceToken, {
		readonly: true,
		type: 'string',
		i18nLabel: 'Federation_Matrix_as_token',
		i18nDescription: 'Federation_Matrix_as_token_desc',
		group: 'Federation',
		section: 'Matrix Bridge',
	});

	await settingsRegistry.add('Federation_Matrix_homeserver_url', 'http://localhost:8008',
		{
			type: 'string',
			i18nLabel: 'Federation_Matrix_homeserver_url',
			i18nDescription: 'Federation_Matrix_homeserver_url_desc',
			alert: 'Federation_Matrix_homeserver_url_alert',
			group: 'Federation',
			section: 'Matrix Bridge',
		},
	);

	await settingsRegistry.add(
		'Federation_Matrix_homeserver_domain',
		'local.rocket.chat',
		{
			type: 'string',
			i18nLabel: 'Federation_Matrix_homeserver_domain',
			i18nDescription: 'Federation_Matrix_homeserver_domain_desc',
			alert: 'Federation_Matrix_homeserver_domain_alert',
			group: 'Federation',
			section: 'Matrix Bridge',
		},
	);

	await settingsRegistry.add('Federation_Matrix_bridge_url', 'http://host.docker.internal:3300', {
		type: 'string',
		i18nLabel: 'Federation_Matrix_bridge_url',
		i18nDescription: 'Federation_Matrix_bridge_url_desc',
		group: 'Federation',
		section: 'Matrix Bridge',
	});

	await settingsRegistry.add('Federation_Matrix_bridge_localpart', 'rocket.cat', {
		type: 'string',
		i18nLabel: 'Federation_Matrix_bridge_localpart',
		i18nDescription: 'Federation_Matrix_bridge_localpart_desc',
		group: 'Federation',
		section: 'Matrix Bridge',
	});

	await settingsRegistry.add('Federation_Matrix_registration_file', '', {
		readonly: true,
		hidden: false,
		type: 'code',
		i18nLabel: 'Federation_Matrix_registration_file',
		i18nDescription: 'Federation_Matrix_registration_file_desc',
		alert: 'Federation_Matrix_registration_file_Alert',
		group: 'Federation',
		section: 'Matrix Bridge',
	});

	await settingsRegistry.add('Federation_Matrix_max_size_of_public_rooms_users', 100, {
		readonly: false,
		type: 'int',
		i18nLabel: 'Federation_Matrix_max_size_of_public_rooms_users',
		i18nDescription: 'Federation_Matrix_max_size_of_public_rooms_users_desc',
		alert: 'Federation_Matrix_max_size_of_public_rooms_users_Alert',
		public: true,
		enterprise: true,
		invalidValue: false,
		group: 'Federation',
		section: 'Matrix Bridge',
	});
};
