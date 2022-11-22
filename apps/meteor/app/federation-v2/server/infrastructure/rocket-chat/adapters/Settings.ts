import crypto from 'crypto';
import fs from 'fs';
import { resolve } from 'path';

import yaml from 'js-yaml';
import { v4 as uuidv4 } from 'uuid';
import { Settings } from '@rocket.chat/models';

import { settings, settingsRegistry } from '../../../../../settings/server';
import type { IFederationBridgeRegistrationFile } from '../../../domain/IFederationBridge';

const EVERYTHING_REGEX = '.*';
const LISTEN_RULES = EVERYTHING_REGEX;

export class RocketChatSettingsAdapter {
	public initialize(): void {
		this.addFederationSettings();
		this.watchChangesAndUpdateRegistrationFile();
		this.updateSettingsWithProvidedConfigFileIfNecessary();
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
		return this.isTypingStatusEnabled();
	}

	public isTypingStatusEnabled(): boolean {
		return this.getRegistrationFileFromHomeserver()?.enableEphemeralEvents === true;
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
			],
			this.updateRegistrationFile.bind(this),
		);
	}

	private addFederationSettings(): void {
		const preExistingConfiguration = this.getRegistrationFileFromHomeserver();

		settingsRegistry.addGroup('Federation', function () {
			this.section('Matrix Bridge', function () {
				this.add('Federation_Matrix_enabled', Boolean(preExistingConfiguration), {
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

				this.add('Federation_Matrix_id', preExistingConfiguration?.id || `rocketchat_${uniqueId}`, {
					readonly: true,
					type: 'string',
					i18nLabel: 'Federation_Matrix_id',
					i18nDescription: 'Federation_Matrix_id_desc',
				});

				this.add('Federation_Matrix_hs_token', preExistingConfiguration?.homeserverToken || homeserverToken, {
					readonly: true,
					type: 'string',
					i18nLabel: 'Federation_Matrix_hs_token',
					i18nDescription: 'Federation_Matrix_hs_token_desc',
				});

				this.add('Federation_Matrix_as_token', preExistingConfiguration?.applicationServiceToken || applicationServiceToken, {
					readonly: true,
					type: 'string',
					i18nLabel: 'Federation_Matrix_as_token',
					i18nDescription: 'Federation_Matrix_as_token_desc',
				});

				this.add('Federation_Matrix_homeserver_url', preExistingConfiguration?.rocketchat?.homeServerUrl || 'http://localhost:8008', {
					type: 'string',
					i18nLabel: 'Federation_Matrix_homeserver_url',
					i18nDescription: 'Federation_Matrix_homeserver_url_desc',
					alert: 'Federation_Matrix_homeserver_url_alert',
				});

				this.add('Federation_Matrix_homeserver_domain', preExistingConfiguration?.rocketchat?.domainName || 'local.rocket.chat', {
					type: 'string',
					i18nLabel: 'Federation_Matrix_homeserver_domain',
					i18nDescription: 'Federation_Matrix_homeserver_domain_desc',
					alert: 'Federation_Matrix_homeserver_domain_alert',
				});

				this.add('Federation_Matrix_bridge_url', preExistingConfiguration?.bridgeUrl || 'http://host.docker.internal:3300', {
					type: 'string',
					i18nLabel: 'Federation_Matrix_bridge_url',
					i18nDescription: 'Federation_Matrix_bridge_url_desc',
				});

				this.add('Federation_Matrix_bridge_localpart', preExistingConfiguration?.botName || 'rocket.cat', {
					type: 'string',
					i18nLabel: 'Federation_Matrix_bridge_localpart',
					i18nDescription: 'Federation_Matrix_bridge_localpart_desc',
				});

				this.add('Federation_Matrix_registration_file', '', {
					readonly: true,
					hidden: Boolean(preExistingConfiguration),
					type: 'code',
					i18nLabel: 'Federation_Matrix_registration_file',
					i18nDescription: 'Federation_Matrix_registration_file_desc',
					alert: 'Federation_Matrix_registration_file_Alert',
				});
			});
		});
	}

	private getRegistrationFileFromHomeserver(): Record<string, any> | undefined {
		try {
			const registrationYaml = fs.readFileSync(this.getFilePathForHomeserverConfig(), 'utf8');

			const parsedFile = yaml.load(registrationYaml as string) as Record<string, any>;
			return {
				applicationServiceToken: parsedFile.as_token,
				bridgeUrl: parsedFile.url,
				botName: parsedFile.sender_localpart,
				homeserverToken: parsedFile.hs_token,
				id: parsedFile.id,
				listenTo: parsedFile.namespaces,
				enableEphemeralEvents: parsedFile['de.sorunome.msc2409.push_ephemeral'],
				rocketchat: { domainName: parsedFile.rocketchat?.homeserver_domain, homeServerUrl: parsedFile.rocketchat?.homeserver_url },
			};
		} catch (e) {
			// no-op
		}
	}

	private getFilePathForHomeserverConfig(): string {
		return process.env.NODE_ENV === 'development'
			? '../../../../../matrix-federation-config/registration.yaml'
			: resolve(process.cwd(), '../../../matrix-federation-config/registration.yaml');
	}

	private updateSettingsWithProvidedConfigFileIfNecessary(): void {
		const existingConfiguration = this.getRegistrationFileFromHomeserver();
		if (!existingConfiguration) {
			return;
		}

		Promise.await(Settings.updateValueById('Federation_Matrix_enabled', true));
		Promise.await(Settings.updateValueById('Federation_Matrix_id', existingConfiguration.id));
		Promise.await(Settings.updateValueById('Federation_Matrix_hs_token', existingConfiguration.homeserverToken));
		Promise.await(Settings.updateValueById('Federation_Matrix_as_token', existingConfiguration.applicationServiceToken));
		Promise.await(Settings.updateValueById('Federation_Matrix_homeserver_url', existingConfiguration.rocketchat?.homeServerUrl));
		Promise.await(Settings.updateValueById('Federation_Matrix_homeserver_domain', existingConfiguration.rocketchat?.domainName));
		Promise.await(Settings.updateValueById('Federation_Matrix_bridge_url', existingConfiguration.bridgeUrl));
		Promise.await(Settings.updateValueById('Federation_Matrix_bridge_localpart', existingConfiguration.botName));
		Promise.await(Settings.update({ _id: 'Federation_Matrix_registration_file' }, { $set: { hidden: Boolean(existingConfiguration) } }));
	}
}
