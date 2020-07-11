import { Meteor } from 'meteor/meteor';

import { settings } from '../../../../settings/server';
import { Messages } from '../../../../models/server';
import { IScreenSharingProvider } from './IScreenSharingProvider';
import { screenSharingStreamer } from '../stream/screenSharingStream';

export class ScreenSharingManager {
	providerName = '';

	private providers = new Map<string, IScreenSharingProvider>();

	private screenShareProvider: IScreenSharingProvider | any = null;

	activeSessions: string[] = [];

	urls = new Map<string, string>();

	enabled(): any {
		return settings.get('Livechat_screen_sharing_enabled');
	}

	setProviderName(name: string): void {
		this.providerName = name;
	}

	registerProvider(name: string, Provider: IScreenSharingProvider): void {
		this.providers.set(name, Provider);
		if (name === this.providerName) {
			this.setProvider();
		}
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
		return { enabled: this.enabled(), ...this.screenShareProvider.config } || {};
	}

	getProviderInfo(): any {
		return this.screenShareProvider.getInfo();
	}

	requestScreenSharing(roomId: string, user: any): void {
		Messages.createWithTypeRoomIdMessageAndUser('request_screen_sharing_access', roomId, '', user, {});
		this.addActiveScreenSharing(roomId);
	}

	endScreenSharingSession(roomId: string, user: any): void {
		Messages.createWithTypeRoomIdMessageAndUser('end_screen_sharing_session', roomId, '', user, {});
		this.removeActiveScreenSharing(roomId);
	}

	addActiveScreenSharing(roomId: string): void {
		this.activeSessions = this.activeSessions.filter((id) => id !== roomId);
		this.activeSessions.push(roomId);
		this.urls.set(roomId, this.screenShareProvider.getURL(roomId));
		console.log(this.activeSessions);
		screenSharingStreamer.emit('session-modified', { activeSessions: this.activeSessions });
	}

	removeActiveScreenSharing(roomId: string): void {
		this.activeSessions = this.activeSessions.filter((id) => id !== roomId);
		this.urls.delete(roomId);
		console.log(this.activeSessions);
		screenSharingStreamer.emit('session-modified', { activeSessions: this.activeSessions });
	}

	getActiveSessions(): string[] {
		return this.activeSessions;
	}

	getSessionUrl(roomId: string): any {
		return this.urls.get(roomId);
	}
}

export const ScreensharingManager = new ScreenSharingManager();

settings.get('Livechat_screen_sharing_provider', function(key, value) {
	ScreensharingManager.setProviderName(value);
});
