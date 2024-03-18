import crypto from 'crypto';

import { Settings } from '@rocket.chat/models';
import { v4 as uuidv4 } from 'uuid';

import { settings, settingsRegistry } from '../../../../../../app/settings/server';
import type { IFederationBridgeRegistrationFile } from '../../../domain/IFederationBridge';

const EVERYTHING_REGEX = '.*';
const LISTEN_RULES = EVERYTHING_REGEX;

export class RocketChatSettingsAdapter {
	public async initialize() {
		await this.addFederationSettings();
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
		await Settings.updateValueById('Federation_Matrix_enabled', false);
	}

	public isFederationEnabled(): boolean {
		return settings.get('Federation_Matrix_enabled') === true;
	}

	public shouldServeWellKnown(): boolean {
		return settings.get<boolean>('Federation_Matrix_serve_well_known');
	}

	public isTypingStatusEnabled(): boolean {
		return settings.get('Federation_Matrix_enable_ephemeral_events') === true;
	}

	public onFederationEnabledStatusChanged(
		callback: (
			enabled: boolean,
			serveWellKnown: boolean,
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
				'Federation_Matrix_serve_well_known',
				'Federation_Matrix_id',
				'Federation_Matrix_hs_token',
				'Federation_Matrix_as_token',
				'Federation_Matrix_homeserver_url',
				'Federation_Matrix_homeserver_domain',
				'Federation_Matrix_bridge_url',
				'Federation_Matrix_bridge_localpart',
			],
			([enabled, serveWellKnown]) =>
				callback(
					enabled === true,
					serveWellKnown === true,
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

		await settingsRegistry.add('Federation_Matrix_serve_well_known', false, {
			readonly: false,
			type: 'boolean',
			i18nLabel: 'Federation_Matrix_serve_well_known',
			i18nDescription: 'Federation_Matrix_serve_well_known_desc',
			alert: 'Federation_Matrix_serve_well_known_Alert',
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
	}
}
