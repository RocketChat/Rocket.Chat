import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings/server';
import { IScreenShareProvider } from './screenSharing/IScreenShareProvider';
import { CobrowseScreenShareProvider } from './screenSharing/CobrowseScreenShareProvider';

class ScreenSharingManager {
	providerName = '';

	providers: any = {};

	private screenShareProvider: IScreenShareProvider;

	constructor(providerName: string) {
		this.providerName = providerName;
		this.registerProvider('cobrowse.io', new CobrowseScreenShareProvider());
		this.screenShareProvider = this.getProvider();
	}

	enabled(): any {
		return settings.get('Livechat_screenshare_enabled');
	}

	setProviderName(name: string): void {
		this.providerName = name;
	}

	registerProvider(name: string, Provider: IScreenShareProvider): void {
		this.providers[name] = Provider;
	}

	getProvider(): IScreenShareProvider {
		if (!this.providers[this.providerName]) {
			throw new Meteor.Error('error-screensharing-provider-not-available');
		}
		return this.providers[this.providerName];
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

// name of provider will come from settings
export const ScreensharingManager = new ScreenSharingManager('cobrowse.io');
