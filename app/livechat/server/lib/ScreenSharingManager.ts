import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings/server';
import { IScreenShareProvider } from './screenSharing/IScreenShareProvider';

export class ScreenSharingManager {
	providerName = '';

	private providers = new Map<string, IScreenShareProvider>();

	private screenShareProvider: IScreenShareProvider | any = null;

	constructor(providerName: string) {
		this.providerName = providerName;
	}

	enabled(): any {
		return settings.get('Livechat_screenshare_enabled');
	}

	setProviderName(name: string): void {
		this.providerName = name;
	}

	registerProvider(name: string, Provider: IScreenShareProvider): void {
		this.providers.set(name, Provider);
	}

	getProvider(): IScreenShareProvider | any {
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
}
