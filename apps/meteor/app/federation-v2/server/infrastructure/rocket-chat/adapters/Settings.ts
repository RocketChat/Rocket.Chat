import yaml from 'js-yaml';
import { SHA256 } from 'meteor/sha';
import { v4 as uuidv4 } from 'uuid';
import { Settings } from '@rocket.chat/models';

import { settings, settingsRegistry } from '../../../../../settings/server';

const EVERYTHING_REGEX = '.*';
const LISTEN_RULES = EVERYTHING_REGEX;

export class RocketChatSettingsAdapter {
	public initialize(): void {
		this.addFederationSettings();
		this.watchChangesAndUpdateRegistrationFile();
	}

	public getApplicationServiceId(): string {
		return settings.get('Federation_Matrix_id');
	}

	public getApplicationHomeServerToken(): string {
		return settings.get('Federation_Matrix_hs_token');
	}

	public getApplicationApplicationServiceToken(): string {
		return settings.get('Federation_Matrix_as_token');
	}

	public getBridgeUrl(): string {
		return settings.get('Federation_Matrix_bridge_url');
	}

	public getBridgePort(): number {
		const [, , port] = this.getBridgeUrl().split(':');

		// The port should be 3300 if none is specified on the URL
		return parseInt(port || '3300');
	}

	public getHomeServerUrl(): string {
		return settings.get('Federation_Matrix_homeserver_url');
	}

	public getHomeServerDomain(): string {
		return settings.get('Federation_Matrix_homeserver_domain');
	}

	public getBridgeBotUsername(): string {
		return settings.get('Federation_Matrix_bridge_localpart');
	}

	public async disableFederation(): Promise<void> {
		await Settings.updateValueById('Federation_Matrix_enabled', false);
	}

	public isFederationEnabled(): boolean {
		return settings.get('Federation_Matrix_enabled') === true;
	}

	public onFederationEnabledStatusChanged(callback: Function): Function {
		return settings.watchMultiple(
			[
				'Federation_Matrix_enabled',
				'Federation_Matrix_id',
				'Federation_Matrix_hs_token',
				'Federation_Matrix_as_token',
				'Federation_Matrix_homeserver_url',
				'Federation_Matrix_homeserver_domain',
				'Federation_Matrix_bridge_url',
				'Federation_Matrix_bridge_localpart',
			],
			([enabled]) => callback(enabled),
		);
	}

	public generateRegistrationFileObject(): Record<string, any> {
		return {
			id: this.getApplicationServiceId(),
			hs_token: this.getApplicationHomeServerToken(),
			as_token: this.getApplicationApplicationServiceToken(),
			url: this.getBridgeUrl(),
			sender_localpart: this.getBridgeBotUsername(),
			namespaces: {
				users: [
					{
						exclusive: false,
						regex: LISTEN_RULES,
					},
				],
				rooms: [
					{
						exclusive: false,
						regex: LISTEN_RULES,
					},
				],
				aliases: [
					{
						exclusive: false,
						regex: LISTEN_RULES,
					},
				],
			},
		};
	}

	private async updateRegistrationFile(): Promise<void> {
		await Settings.updateValueById('Federation_Matrix_registration_file', yaml.dump(this.generateRegistrationFileObject()));
	}

	private watchChangesAndUpdateRegistrationFile(): void {
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
			this.updateRegistrationFile.bind(this),
		);
	}

	private addFederationSettings(): void {
		settingsRegistry.addGroup('Federation', function () {
			this.section('Matrix Bridge', function () {
				this.add('Federation_Matrix_enabled', false, {
					readonly: false,
					type: 'boolean',
					i18nLabel: 'Federation_Matrix_enabled',
					i18nDescription: 'Federation_Matrix_enabled_desc',
					alert: 'Federation_Matrix_Enabled_Alert',
					public: true,
				});

				const uniqueId = settings.get('uniqueID') || uuidv4().slice(0, 15).replace(new RegExp('-', 'g'), '_');
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
	}
}
