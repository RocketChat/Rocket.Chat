import crypto from 'crypto';

import { Settings } from '@rocket.chat/models';
import yaml from 'js-yaml';
import { v4 as uuidv4 } from 'uuid';

import { notifyOnSettingChangedById } from '../../../../../../app/lib/server/lib/notifyListener';
import { settings, settingsRegistry } from '../../../../../../app/settings/server';
import type { IFederationBridgeRegistrationFile } from '../../../domain/IFederationBridge';

const EVERYTHING_REGEX = '.*';
const LISTEN_RULES = EVERYTHING_REGEX;

export class RocketChatSettingsAdapter {
	public async initialize() {
		await this.addFederationSettings();
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
		const [, , port = '3300'] = this.getBridgeUrl().split(':');

		return parseInt(port);
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

	public getMaximumSizeOfUsersWhenJoiningPublicRooms(): string {
		return settings.get('Federation_Matrix_max_size_of_public_rooms_users');
	}

	public async disableFederation(): Promise<void> {
		// TODO: audit
		(await Settings.updateValueById('Federation_Matrix_enabled', false)).modifiedCount &&
			void notifyOnSettingChangedById('Federation_Matrix_enabled');
	}

	public isFederationEnabled(): boolean {
		return settings.get('Federation_Matrix_enabled') === true;
	}

	public isTypingStatusEnabled(): boolean {
		return settings.get('Federation_Matrix_enable_ephemeral_events') === true;
	}

	public isConfigurationValid(): boolean {
		return settings.get('Federation_Matrix_configuration_status') === 'Valid';
	}

	public async setConfigurationStatus(status: 'Valid' | 'Invalid'): Promise<void> {
		// TODO: audit
		const { modifiedCount } = await Settings.updateValueById('Federation_Matrix_configuration_status', status);
		if (modifiedCount) {
			void notifyOnSettingChangedById('Federation_Matrix_configuration_status');
		}
	}

	public onFederationEnabledStatusChanged(
		callback: (
			enabled: boolean,
			appServiceId: string,
			homeServerUrl: string,
			homeServerDomain: string,
			bridgeUrl: string,
			bridgePort: number,
			homeServerRegistrationFile: IFederationBridgeRegistrationFile,
		) => Promise<void>,
	): () => void {
		return settings.watchMultiple<boolean>(
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
			([enabled]) =>
				callback(
					enabled === true,
					this.getApplicationServiceId(),
					this.getHomeServerUrl(),
					this.getHomeServerDomain(),
					this.getBridgeUrl(),
					this.getBridgePort(),
					this.getAppServiceRegistrationObject(),
				),
		);
	}

	public getAppServiceRegistrationObject(): IFederationBridgeRegistrationFile {
		return {
			id: this.getApplicationServiceId(),
			homeserverToken: this.getApplicationHomeServerToken(),
			applicationServiceToken: this.getApplicationApplicationServiceToken(),
			bridgeUrl: this.getBridgeUrl(),
			botName: this.getBridgeBotUsername(),
			enableEphemeralEvents: this.isTypingStatusEnabled(),
			listenTo: {
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
		const registrationFile = this.getAppServiceRegistrationObject();

		await Settings.updateValueById(
			'Federation_Matrix_registration_file',
			yaml.dump({
				'id': registrationFile.id,
				'hs_token': registrationFile.homeserverToken,
				'as_token': registrationFile.applicationServiceToken,
				'url': registrationFile.bridgeUrl,
				'sender_localpart': registrationFile.botName,
				'namespaces': registrationFile.listenTo,
				'de.sorunome.msc2409.push_ephemeral': registrationFile.enableEphemeralEvents,
				'use_appservice_legacy_authorization': true,
			}),
		);
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

	private async addFederationSettings(): Promise<void> {
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

		await settingsRegistry.add('Federation_Matrix_serve_well_known', true, {
			readonly: false,
			type: 'boolean',
			i18nLabel: 'Federation_Matrix_serve_well_known',
			alert: 'Federation_Matrix_serve_well_known_Alert',
			group: 'Federation',
			section: 'Matrix Bridge',
		});

		await settingsRegistry.add('Federation_Matrix_enable_ephemeral_events', false, {
			readonly: false,
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
			readonly: process.env.NODE_ENV === 'production',
			type: 'string',
			i18nLabel: 'Federation_Matrix_id',
			i18nDescription: 'Federation_Matrix_id_desc',
			group: 'Federation',
			section: 'Matrix Bridge',
		});

		await settingsRegistry.add('Federation_Matrix_hs_token', homeserverToken, {
			readonly: process.env.NODE_ENV === 'production',
			type: 'string',
			i18nLabel: 'Federation_Matrix_hs_token',
			i18nDescription: 'Federation_Matrix_hs_token_desc',
			group: 'Federation',
			section: 'Matrix Bridge',
		});

		await settingsRegistry.add('Federation_Matrix_as_token', applicationServiceToken, {
			readonly: process.env.NODE_ENV === 'production',
			type: 'string',
			i18nLabel: 'Federation_Matrix_as_token',
			i18nDescription: 'Federation_Matrix_as_token_desc',
			group: 'Federation',
			section: 'Matrix Bridge',
		});

		await settingsRegistry.add('Federation_Matrix_homeserver_url', 'http://localhost:8008', {
			type: 'string',
			i18nLabel: 'Federation_Matrix_homeserver_url',
			i18nDescription: 'Federation_Matrix_homeserver_url_desc',
			alert: 'Federation_Matrix_homeserver_url_alert',
			group: 'Federation',
			section: 'Matrix Bridge',
		});

		await settingsRegistry.add('Federation_Matrix_homeserver_domain', siteUrl, {
			type: 'string',
			i18nLabel: 'Federation_Matrix_homeserver_domain',
			i18nDescription: 'Federation_Matrix_homeserver_domain_desc',
			alert: 'Federation_Matrix_homeserver_domain_alert',
			group: 'Federation',
			section: 'Matrix Bridge',
		});

		await settingsRegistry.add('Federation_Matrix_bridge_url', 'http://localhost:3300', {
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
			modules: ['federation'],
			public: true,
			enterprise: true,
			invalidValue: false,
			group: 'Federation',
			section: 'Matrix Bridge',
		});

		await settingsRegistry.add('Federation_Matrix_configuration_status', 'Invalid', {
			readonly: true,
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
			type: 'action',
			actionText: 'Federation_Matrix_check_configuration',
			public: false,
			enterprise: false,
			invalidValue: '',
			group: 'Federation',
			section: 'Matrix Bridge',
		});
	}
}
