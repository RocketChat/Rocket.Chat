import { settingsRegistry } from '../../app/settings/server';

export const createFederationHomeserverSettings = () =>
	settingsRegistry.addGroup('Federation', async function () {
		await this.section('Homeserver Federation', async function () {
			await this.add('Federation_Homeserver_enabled', false, {
				type: 'boolean',
				i18nLabel: 'Enabled',
				i18nDescription: 'Federation_Homeserver_enabled_Description',
				public: true,
			});

			await this.add('Federation_Homeserver_url', '', {
				type: 'string',
				i18nLabel: 'Homeserver_URL',
				i18nDescription: 'Federation_Homeserver_url_Description',
				enableQuery: {
					_id: 'Federation_Homeserver_enabled',
					value: true,
				},
			});

			await this.add('Federation_Homeserver_domain', '', {
				type: 'string',
				i18nLabel: 'Homeserver_Domain',
				i18nDescription: 'Federation_Homeserver_domain_Description',
				enableQuery: {
					_id: 'Federation_Homeserver_enabled',
					value: true,
				},
			});

			await this.add('Federation_Homeserver_bridge_port', 8081, {
				type: 'int',
				i18nLabel: 'Bridge_Port',
				i18nDescription: 'Federation_Homeserver_bridge_port_Description',
				enableQuery: {
					_id: 'Federation_Homeserver_enabled',
					value: true,
				},
			});

			await this.add('Federation_Homeserver_app_service_token', '', {
				type: 'string',
				i18nLabel: 'App_Service_Token',
				i18nDescription: 'Federation_Homeserver_app_service_token_Description',
				secret: true,
				enableQuery: {
					_id: 'Federation_Homeserver_enabled',
					value: true,
				},
			});

			await this.add('Federation_Homeserver_homeserver_token', '', {
				type: 'string',
				i18nLabel: 'Homeserver_Token',
				i18nDescription: 'Federation_Homeserver_homeserver_token_Description',
				secret: true,
				enableQuery: {
					_id: 'Federation_Homeserver_enabled',
					value: true,
				},
			});
		});
	});