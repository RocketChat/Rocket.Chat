import crypto from 'crypto';

import yaml from 'js-yaml';
import { v4 as uuidv4 } from 'uuid';

import { settings, settingsRegistry } from '../../app/settings/server';

export const createMatrixFederationSettings = async () => {
	await settingsRegistry.addGroup('Federation', async function () {
		await this.section('Matrix Bridge', async function () {
			await this.add('Federation_Matrix_enabled', false, {
				readonly: false,
				type: 'boolean',
				i18nLabel: 'Federation_Matrix_enabled',
				i18nDescription: 'Federation_Matrix_enabled_desc',
				alert: 'Federation_Matrix_Enabled_Alert',
				public: true,
			});
			const uniqueId = settings.get('uniqueID') || uuidv4().slice(0, 15).replace(new RegExp('-', 'g'), '_');
			const homeserverToken = crypto.createHash('sha256').update(`hs_${uniqueId}`).digest('hex');
			const applicationServiceToken = crypto.createHash('sha256').update(`as_${uniqueId}`).digest('hex');
			await this.add('Federation_Matrix_id', `rocketchat_${uniqueId}`, {
				readonly: true,
				type: 'string',
				i18nLabel: 'Federation_Matrix_id',
				i18nDescription: 'Federation_Matrix_id_desc',
			});
			await this.add('Federation_Matrix_hs_token', homeserverToken, {
				readonly: true,
				type: 'string',
				i18nLabel: 'Federation_Matrix_hs_token',
				i18nDescription: 'Federation_Matrix_hs_token_desc',
			});
			await this.add('Federation_Matrix_as_token', applicationServiceToken, {
				readonly: true,
				type: 'string',
				i18nLabel: 'Federation_Matrix_as_token',
				i18nDescription: 'Federation_Matrix_as_token_desc',
			});
			await this.add('Federation_Matrix_homeserver_url', 'http://localhost:8008', {
				type: 'string',
				i18nLabel: 'Federation_Matrix_homeserver_url',
				i18nDescription: 'Federation_Matrix_homeserver_url_desc',
				alert: 'Federation_Matrix_homeserver_url_alert',
			});
			await this.add('Federation_Matrix_homeserver_domain', 'local.rocket.chat', {
				type: 'string',
				i18nLabel: 'Federation_Matrix_homeserver_domain',
				i18nDescription: 'Federation_Matrix_homeserver_domain_desc',
				alert: 'Federation_Matrix_homeserver_domain_alert',
			});
			await this.add('Federation_Matrix_bridge_url', 'http://host.docker.internal:3300', {
				type: 'string',
				i18nLabel: 'Federation_Matrix_bridge_url',
				i18nDescription: 'Federation_Matrix_bridge_url_desc',
			});
			await this.add('Federation_Matrix_bridge_localpart', 'rocket.cat', {
				type: 'string',
				i18nLabel: 'Federation_Matrix_bridge_localpart',
				i18nDescription: 'Federation_Matrix_bridge_localpart_desc',
			});
			await this.add(
				'Federation_Matrix_registration_file',
				yaml.dump({
					'id': settings.get('Federation_Matrix_id'),
					'hs_token': settings.get('Federation_Matrix_hs_token'),
					'as_token': settings.get('Federation_Matrix_as_token'),
					'url': settings.get('Federation_Matrix_homeserver_url'),
					'sender_localpart': settings.get('Federation_Matrix_bridge_localpart'),
					'namespaces': {
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
					'de.sorunome.msc2409.push_ephemeral': false,
				}),
				{
					readonly: true,
					hidden: false,
					type: 'code',
					i18nLabel: 'Federation_Matrix_registration_file',
					i18nDescription: 'Federation_Matrix_registration_file_desc',
					alert: 'Federation_Matrix_registration_file_Alert',
				},
			);
		});
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
