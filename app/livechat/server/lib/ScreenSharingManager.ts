import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings/server';
import { Messages } from '../../../models/server';
import { IScreenSharingProvider } from './screenSharing/IScreenSharingProvider';

export class ScreenSharingManager {
	providerName = '';

	private providers = new Map<string, IScreenSharingProvider>();

	private screenShareProvider: IScreenSharingProvider | any = null;

	constructor(providerName: string) {
		this.providerName = providerName;
	}

	enabled(): any {
		return settings.get('Livechat_screen_sharing_enabled');
	}

	setProviderName(name: string): void {
		this.providerName = name;
	}

	registerProvider(name: string, Provider: IScreenSharingProvider): void {
		this.providers.set(name, Provider);
	}

	getProvider(): IScreenSharingProvider | any {
		if (!this.providers.has(this.providerName)) {
			throw new Meteor.Error('error-screensharing-provider-not-available');
		}
		return this.providers.get(this.providerName);
	}

	setProvider(): void {
		this.screenShareProvider = this.getProvider();
	}

	getConfig(): any {
		return this.screenShareProvider.config || {};
	}

	getProviderInfo(): any {
		return this.screenShareProvider.getInfo();
	}

	requestScreenSharing(roomId: string, user: any): void {
		Messages.createWithTypeRoomIdMessageAndUser('request_screen_sharing_access', roomId, '', user, {});
	}
}
