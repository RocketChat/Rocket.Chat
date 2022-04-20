import yaml from 'js-yaml';
import { Meteor } from 'meteor/meteor';
import { SHA256 } from 'meteor/sha';

import { settings, settingsRegistry } from '../../settings/server';
import { Settings } from '../../models/server/raw';
import { setupLogger } from './logger';

Meteor.startup(async function () {
	const uniqueId = await settings.get('uniqueID');
	const hsToken = SHA256(`hs_${uniqueId}`);
	const asToken = SHA256(`as_${uniqueId}`);

	settingsRegistry.addGroup('FederationV2', function () {
		this.add('FederationV2_enabled', false, {
			readonly: false,
			type: 'boolean',
			i18nLabel: 'FederationV2_enabled',
			i18nDescription: 'FederationV2_enabled_desc',
		});

		this.add('FederationV2_id', `rocketchat_${uniqueId}`, {
			readonly: true,
			type: 'string',
			i18nLabel: 'FederationV2_id',
			i18nDescription: 'FederationV2_id_desc',
		});

		this.add('FederationV2_hs_token', hsToken, {
			readonly: true,
			type: 'string',
			i18nLabel: 'FederationV2_hs_token',
			i18nDescription: 'FederationV2_hs_token_desc',
		});

		this.add('FederationV2_as_token', asToken, {
			readonly: true,
			type: 'string',
			i18nLabel: 'FederationV2_as_token',
			i18nDescription: 'FederationV2_as_token_desc',
		});

		this.add('FederationV2_homeserver_url', 'http://localhost:8008', {
			type: 'string',
			i18nLabel: 'FederationV2_homeserver_url',
			i18nDescription: 'FederationV2_homeserver_url_desc',
		});

		this.add('FederationV2_homeserver_domain', 'local.rocket.chat', {
			type: 'string',
			i18nLabel: 'FederationV2_homeserver_domain',
			i18nDescription: 'FederationV2_homeserver_domain_desc',
		});

		this.add('FederationV2_bridge_url', 'http://host.docker.internal:3300', {
			type: 'string',
			i18nLabel: 'FederationV2_bridge_url',
			i18nDescription: 'FederationV2_bridge_url_desc',
		});

		this.add('FederationV2_bridge_localpart', 'rocket.cat', {
			type: 'string',
			i18nLabel: 'FederationV2_bridge_localpart',
			i18nDescription: 'FederationV2_bridge_localpart_desc',
		});

		this.add('FederationV2_registration_file', '', {
			readonly: true,
			type: 'code',
			i18nLabel: 'FederationV2_registration_file',
			i18nDescription: 'FederationV2_registration_file_desc',
		});
	});
});

let registrationFile = {};

const updateRegistrationFile = async function (): Promise<void> {
	let bridgeUrl = (await Settings.getValueById('FederationV2_bridge_url')) as string;

	if (!bridgeUrl.includes(':')) {
		bridgeUrl = `${bridgeUrl}:3300`;
	}

	/* eslint-disable @typescript-eslint/camelcase */
	registrationFile = {
		id: await Settings.getValueById('FederationV2_id'),
		hs_token: await Settings.getValueById('FederationV2_hs_token'),
		as_token: await Settings.getValueById('FederationV2_as_token'),
		url: bridgeUrl,
		sender_localpart: await Settings.getValueById('FederationV2_bridge_localpart'),
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
	await Settings.updateValueById('FederationV2_registration_file', yaml.dump(registrationFile));
};

// Add settings listeners
settings.watch('FederationV2_enabled', (value) => {
	setupLogger.info(`Federation V2 is ${value ? 'enabled' : 'disabled'}`);
});

settings.watchMultiple(
	[
		'FederationV2_id',
		'FederationV2_hs_token',
		'FederationV2_as_token',
		'FederationV2_homeserver_url',
		'FederationV2_homeserver_domain',
		'FederationV2_bridge_url',
		'FederationV2_bridge_localpart',
	],
	updateRegistrationFile,
);
