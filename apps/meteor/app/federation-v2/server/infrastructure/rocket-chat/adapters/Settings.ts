import crypto from 'crypto';

import yaml from 'js-yaml';
import { v4 as uuidv4 } from 'uuid';
import { Settings } from '@rocket.chat/models';

import { settings, settingsRegistry } from '../../../../../settings/server';
import { IFederationBridgeRegistrationFile } from '../../../domain/IFederationBridge';

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

	public async disableFederation(): Promise<void> {
		await Settings.updateValueById('Federation_Matrix_enabled', false);
	}

	public isFederationEnabled(): boolean {
		return settings.get('Federation_Matrix_enabled') === true;
	}

	public areEphemeralEventsEnabled(): boolean {
		return (
			settings.get('Federation_Matrix_enable_presence_status') === true ||
			settings.get('Federation_Matrix_enable_typing_status') === true ||
			settings.get('Federation_Matrix_enable_sync_user_avatar') === true
		);
	}

	public isUserPresenceStatusEnabled(): boolean {
		return settings.get('Federation_Matrix_enable_presence_status') === true;
	}

	public isTypingStatusEnabled(): boolean {
		return settings.get('Federation_Matrix_enable_typing_status') === true;
	}

	public isSyncUserAvatarEnabled(): boolean {
		return settings.get('Federation_Matrix_enable_sync_user_avatar') === true;
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
				'Federation_Matrix_enable_presence_status',
				'Federation_Matrix_enable_typing_status',
				'Federation_Matrix_enable_sync_user_avatar',
			],
			([enabled]) =>
				Promise.await(
					callback(
						enabled === true,
						this.getApplicationServiceId(),
						this.getHomeServerUrl(),
						this.getHomeServerDomain(),
						this.getBridgeUrl(),
						this.getBridgePort(),
						this.generateRegistrationFileObject(),
					),
				),
		);
	}

	public generateRegistrationFileObject(): IFederationBridgeRegistrationFile {
		return {
			id: this.getApplicationServiceId(),
			homeserverToken: this.getApplicationHomeServerToken(),
			applicationServiceToken: this.getApplicationApplicationServiceToken(),
			bridgeUrl: this.getBridgeUrl(),
			botName: this.getBridgeBotUsername(),
			enableEphemeralEvents: this.areEphemeralEventsEnabled(),
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
		const registrationFile = this.generateRegistrationFileObject();
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
				'Federation_Matrix_enable_presence_status',
				'Federation_Matrix_enable_typing_status',
				'Federation_Matrix_enable_sync_user_avatar',
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
				const homeserverToken = crypto.createHash('sha256').update(`hs_${uniqueId}`).digest('hex');
				const applicationServiceToken = crypto.createHash('sha256').update(`as_${uniqueId}`).digest('hex');

				this.add('Federation_Matrix_id', `rocketchat_${uniqueId}`, {
					readonly: true,
					type: 'string',
					i18nLabel: 'Federation_Matrix_id',
					i18nDescription: 'Federation_Matrix_id_desc',
				});

				this.add('Federation_Matrix_hs_token', homeserverToken, {
					readonly: true,
					type: 'string',
					i18nLabel: 'Federation_Matrix_hs_token',
					i18nDescription: 'Federation_Matrix_hs_token_desc',
				});

				this.add('Federation_Matrix_as_token', applicationServiceToken, {
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

				this.add('Federation_Matrix_enable_presence_status', false, {
					readonly: false,
					type: 'boolean',
					i18nLabel: 'Federation_Matrix_enable_presence_status',
					i18nDescription: 'Federation_Matrix_enable_presence_status_desc',
					alert: 'Federation_Matrix_enable_presence_status_Alert',
				});

				this.add('Federation_Matrix_enable_typing_status', false, {
					readonly: false,
					type: 'boolean',
					i18nLabel: 'Federation_Matrix_enable_typing_status',
					i18nDescription: 'Federation_Matrix_enable_typing_status_desc',
					alert: 'Federation_Matrix_enable_typing_status_Alert',
				});

				this.add('Federation_Matrix_enable_sync_user_avatar', false, {
					readonly: false,
					type: 'boolean',
					i18nLabel: 'Federation_Matrix_enable_sync_user_avatar',
					i18nDescription: 'Federation_Matrix_enable_sync_user_avatar_desc',
					alert: 'Federation_Matrix_enable_sync_user_avatar_Alert',
				});
			});
		});
	}
}
