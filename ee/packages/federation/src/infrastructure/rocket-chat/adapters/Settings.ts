import fs from 'fs';
import { resolve } from 'path';

import { Settings } from '@rocket.chat/models';
import yaml from 'js-yaml';

import type { IFederationBridgeRegistrationFile } from '../../../domain/IFederationBridge';

const EVERYTHING_REGEX = '.*';
const LISTEN_RULES = EVERYTHING_REGEX;

export class RocketChatSettingsAdapter {
	public async initialize() {
		await this.updateSettingsWithProvidedConfigFileIfNecessary();
	}

	public async getApplicationServiceId(): Promise<string> {
		return String((await Settings.findOneById('Federation_Matrix_id'))?.value || '');
	}

	public async getApplicationHomeServerToken(): Promise<string> {
		return String((await Settings.findOneById('Federation_Matrix_hs_token'))?.value || '');
	}

	public async getApplicationApplicationServiceToken(): Promise<string> {
		return String((await Settings.findOneById('Federation_Matrix_as_token'))?.value || '');
	}

	public async getBridgeUrl(): Promise<string> {
		return String((await Settings.findOneById('Federation_Matrix_bridge_url'))?.value || '');
	}

	public async getBridgePort(): Promise<number> {
		const [, , port = '3300'] = (await this.getBridgeUrl()).split(':');

		return parseInt(port);
	}

	public async getHomeServerUrl(): Promise<string> {
		return String((await Settings.findOneById('Federation_Matrix_homeserver_url'))?.value || '');
	}

	public async getHomeServerDomain(): Promise<string> {
		return String((await Settings.findOneById('Federation_Matrix_homeserver_domain'))?.value || '');
	}

	public async getBridgeBotUsername(): Promise<string> {
		return String((await Settings.findOneById('Federation_Matrix_bridge_localpart'))?.value || '');
	}

	public async getMaximumSizeOfUsersWhenJoiningPublicRooms(): Promise<string> {
		return String((await Settings.findOneById('Federation_Matrix_max_size_of_public_rooms_users'))?.value || '');
	}

	public async disableFederation(): Promise<void> {
		await Settings.updateValueById('Federation_Matrix_enabled', false);
	}

	public async isFederationEnabled(): Promise<boolean> {
		return (await Settings.findOneById('Federation_Matrix_enabled'))?.value === true;
	}

	public areEphemeralEventsEnabled(): boolean {
		return this.isTypingStatusEnabled();
	}

	public isTypingStatusEnabled(): boolean {
		return this.getRegistrationFileFromHomeserver()?.enableEphemeralEvents === true;
	}

	public async generateRegistrationFileObject(): Promise<IFederationBridgeRegistrationFile> {
		return {
			id: await this.getApplicationServiceId(),
			homeserverToken: await this.getApplicationHomeServerToken(),
			applicationServiceToken: await this.getApplicationApplicationServiceToken(),
			bridgeUrl: await this.getBridgeUrl(),
			botName: await this.getBridgeBotUsername(),
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

	public async updateRegistrationFile(): Promise<void> {
		const registrationFile = await this.generateRegistrationFileObject();

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

	private async updateSettingsWithProvidedConfigFileIfNecessary() {
		const existingConfiguration = this.getRegistrationFileFromHomeserver();
		if (!existingConfiguration) {
			return;
		}

		await Promise.all([
			Settings.updateValueById('Federation_Matrix_enabled', true),
			Settings.updateValueById('Federation_Matrix_id', existingConfiguration.id),
			Settings.updateValueById('Federation_Matrix_hs_token', existingConfiguration.homeserverToken),
			Settings.updateValueById('Federation_Matrix_as_token', existingConfiguration.applicationServiceToken),
			Settings.updateValueById('Federation_Matrix_homeserver_url', existingConfiguration.rocketchat?.homeServerUrl),
			Settings.updateValueById('Federation_Matrix_homeserver_domain', existingConfiguration.rocketchat?.domainName),
			Settings.updateValueById('Federation_Matrix_bridge_url', existingConfiguration.bridgeUrl),
			Settings.updateValueById('Federation_Matrix_bridge_localpart', existingConfiguration.botName),
			Settings.update({ _id: 'Federation_Matrix_registration_file' }, { $set: { hidden: Boolean(existingConfiguration) } }),
		]);
	}
}
