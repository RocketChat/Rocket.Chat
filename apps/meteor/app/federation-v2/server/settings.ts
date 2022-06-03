import yaml from 'js-yaml';
import { SHA256 } from 'meteor/sha';

import { getRegistrationInfo } from './config';
import { Settings } from '../../models/server/raw';
import { settings, settingsRegistry } from '../../settings/server';

settingsRegistry.addGroup('Federation', function () {
	this.section('Matrix Bridge', async function () {
		this.add('Federation_Matrix_enabled', false, {
			readonly: false,
			type: 'boolean',
			i18nLabel: 'Federation_Matrix_enabled',
			i18nDescription: 'Federation_Matrix_enabled_desc',
			alert: 'Federation_Matrix_Enabled_Alert',
		});

		const uniqueId = await settings.get('uniqueID');
		const hsToken = SHA256(`hs_${uniqueId}`);
		const asToken = SHA256(`as_${uniqueId}`);

		this.add('Federation_Matrix_id', `rocketchat_${uniqueId}`, {
			readonly: true,
			type: 'string',
			i18nLabel: 'Federation_Matrix_id',
			i18nDescription: 'Federation_Matrix_id_desc',
		});

		this.add('Federation_Matrix_hs_token', hsToken, {
			readonly: true,
			type: 'string',
			i18nLabel: 'Federation_Matrix_hs_token',
			i18nDescription: 'Federation_Matrix_hs_token_desc',
		});

		this.add('Federation_Matrix_as_token', asToken, {
			readonly: true,
			type: 'string',
			i18nLabel: 'Federation_Matrix_as_token',
			i18nDescription: 'Federation_Matrix_as_token_desc',
		});

		this.add('Federation_Matrix_homeserver_url', 'http://localhost:8008', {
			type: 'string',
			i18nLabel: 'Federation_Matrix_homeserver_url',
			i18nDescription: 'Federation_Matrix_homeserver_url_desc',
			alert: 'Federation_Matrix_homeserver_url_alert',
		});

		this.add('Federation_Matrix_homeserver_domain', 'local.rocket.chat', {
			type: 'string',
			i18nLabel: 'Federation_Matrix_homeserver_domain',
			i18nDescription: 'Federation_Matrix_homeserver_domain_desc',
			alert: 'Federation_Matrix_homeserver_domain_alert',
		});

		this.add('Federation_Matrix_bridge_url', 'http://host.docker.internal:3300', {
			type: 'string',
			i18nLabel: 'Federation_Matrix_bridge_url',
			i18nDescription: 'Federation_Matrix_bridge_url_desc',
		});

		this.add('Federation_Matrix_bridge_localpart', 'rocket.cat', {
			type: 'string',
			i18nLabel: 'Federation_Matrix_bridge_localpart',
			i18nDescription: 'Federation_Matrix_bridge_localpart_desc',
		});

		this.add('Federation_Matrix_registration_file', '', {
			readonly: true,
			type: 'code',
			i18nLabel: 'Federation_Matrix_registration_file',
			i18nDescription: 'Federation_Matrix_registration_file_desc',
		});
	});
});

let registrationFile = {};

const updateRegistrationFile = async function (): Promise<void> {
	const registrationInfo = getRegistrationInfo();

	// eslint-disable-next-line @typescript-eslint/camelcase
	const { id, hs_token, as_token, sender_localpart } = registrationInfo;
	let { url } = registrationInfo;

	if (!url || !url.includes(':')) {
		url = `${url}:3300`;
	}

	/* eslint-disable @typescript-eslint/camelcase */
	registrationFile = {
		id,
		hs_token,
		as_token,
		url,
		sender_localpart,
		namespaces: {
			users: [
				{
					exclusive: false,
					regex: '.*',
				},
			],
			rooms: [
				{
					exclusive: false,
					regex: '.*',
				},
			],
			aliases: [
				{
					exclusive: false,
					regex: '.*',
				},
			],
		},
	};
	/* eslint-enable @typescript-eslint/camelcase */

	// Update the registration file
	await Settings.updateValueById('Federation_Matrix_registration_file', yaml.dump(registrationFile));
};

settings.watchMultiple(
	[
		'Federation_Matrix_id',
		'Federation_Matrix_hs_token',
		'Federation_Matrix_as_token',
		'Federation_Matrix_homeserver_url',
		'Federation_Matrix_homeserver_domain',
		'Federation_Matrix_bridge_url',
		'Federation_Matrix_bridge_localpart',
	],
	updateRegistrationFile,
);
