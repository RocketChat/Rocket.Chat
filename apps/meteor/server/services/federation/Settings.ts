import crypto from 'crypto';

import { v4 as uuidv4 } from 'uuid';

import { settings, settingsRegistry } from '../../../app/settings/server';

export const addMatrixBridgeFederationSettings = async (): Promise<void> => {
	await settingsRegistry.add('Federation_Matrix_enabled', false, {
		readonly: true,
		type: 'boolean',
		i18nLabel: 'Federation_Matrix_enabled',
		i18nDescription: 'Federation_Matrix_enabled_desc',
		alert: 'Old_Federation_Alert',
		public: true,
		group: 'Federation',
		section: 'Matrix Bridge',
	});

	await settingsRegistry.add('Federation_Matrix_serve_well_known', true, {
		readonly: true,
		type: 'boolean',
		i18nLabel: 'Federation_Matrix_serve_well_known',
		alert: 'Federation_Matrix_serve_well_known_Alert',
		group: 'Federation',
		section: 'Matrix Bridge',
	});

	await settingsRegistry.add('Federation_Matrix_enable_ephemeral_events', false, {
		readonly: true,
		type: 'boolean',
		i18nLabel: 'Federation_Matrix_enable_ephemeral_events',
		i18nDescription: 'Federation_Matrix_enable_ephemeral_events_desc',
		alert: 'Federation_Matrix_enable_ephemeral_events_Alert',
		public: true,
		group: 'Federation',
		section: 'Matrix Bridge',
	});

	const uniqueId = settings.get('uniqueID') || uuidv4().slice(0, 15).replace(new RegExp('-', 'g'), '_');
	const homeserverToken = crypto.createHash('sha256').update(`hs_${uniqueId}`).digest('hex');
	const applicationServiceToken = crypto.createHash('sha256').update(`as_${uniqueId}`).digest('hex');

	const siteUrl = settings.get<string>('Site_Url');

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

	await settingsRegistry.add('Federation_Matrix_homeserver_url', 'http://localhost:8008', {
		readonly: true,
		type: 'string',
		i18nLabel: 'Federation_Matrix_homeserver_url',
		i18nDescription: 'Federation_Matrix_homeserver_url_desc',
		alert: 'Federation_Matrix_homeserver_url_alert',
		group: 'Federation',
		section: 'Matrix Bridge',
	});

	await settingsRegistry.add('Federation_Matrix_homeserver_domain', siteUrl, {
		readonly: true,
		type: 'string',
		i18nLabel: 'Federation_Matrix_homeserver_domain',
		i18nDescription: 'Federation_Matrix_homeserver_domain_desc',
		alert: 'Federation_Matrix_homeserver_domain_alert',
		group: 'Federation',
		section: 'Matrix Bridge',
	});

	await settingsRegistry.add('Federation_Matrix_bridge_url', 'http://localhost:3300', {
		readonly: true,
		type: 'string',
		i18nLabel: 'Federation_Matrix_bridge_url',
		i18nDescription: 'Federation_Matrix_bridge_url_desc',
		group: 'Federation',
		section: 'Matrix Bridge',
	});

	await settingsRegistry.add('Federation_Matrix_bridge_localpart', 'rocket.cat', {
		readonly: true,
		type: 'string',
		i18nLabel: 'Federation_Matrix_bridge_localpart',
		i18nDescription: 'Federation_Matrix_bridge_localpart_desc',
		group: 'Federation',
		section: 'Matrix Bridge',
	});

	await settingsRegistry.add('Federation_Matrix_registration_file', '', {
		readonly: true,
		type: 'code',
		i18nLabel: 'Federation_Matrix_registration_file',
		i18nDescription: 'Federation_Matrix_registration_file_desc',
		alert: 'Federation_Matrix_registration_file_Alert',
		group: 'Federation',
		section: 'Matrix Bridge',
	});

	await settingsRegistry.add('Federation_Matrix_max_size_of_public_rooms_users', 100, {
		readonly: true,
		type: 'int',
		i18nLabel: 'Federation_Matrix_max_size_of_public_rooms_users',
		i18nDescription: 'Federation_Matrix_max_size_of_public_rooms_users_desc',
		alert: 'Federation_Matrix_max_size_of_public_rooms_users_Alert',
		modules: ['federation'],
		public: true,
		enterprise: true,
		invalidValue: false,
		group: 'Federation',
		section: 'Matrix Bridge',
	});

	await settingsRegistry.add('Federation_Matrix_configuration_status', 'Invalid', {
		readonly: true,
		hidden: true,
		type: 'string',
		i18nLabel: 'Federation_Matrix_configuration_status',
		i18nDescription: 'Federation_Matrix_configuration_status_desc',
		public: false,
		enterprise: false,
		invalidValue: '',
		group: 'Federation',
		section: 'Matrix Bridge',
	});

	await settingsRegistry.add('Federation_Matrix_check_configuration_button', 'checkFederationConfiguration', {
		readonly: true,
		hidden: true,
		type: 'action',
		actionText: 'Federation_Matrix_check_configuration',
		public: false,
		enterprise: false,
		invalidValue: '',
		group: 'Federation',
		section: 'Matrix Bridge',
	});
};
