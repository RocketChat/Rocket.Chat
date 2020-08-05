import { Meteor } from 'meteor/meteor';

import { settings } from '../../../../settings/server';
import { LivechatRooms, Messages, Users } from '../../../../models/server';
import { IScreenSharingProvider } from './IScreenSharingProvider';

export class ScreenSharingManager {
	providerName = '';

	private providers = new Map<string, IScreenSharingProvider>();

	private screenShareProvider: IScreenSharingProvider | any = null;

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

	requestScreenSharing(roomId: string, user: any): void {
		Messages.createWithTypeRoomIdMessageAndUser('request_livechat_screen_sharing_access', roomId, '', user, {});
		LivechatRooms.updateScreenSharingStatus(roomId, { active: false, sessionUrl: '' });
	}

	screenSharingRequestRejected(roomId: string, visitor: any): void {
		Messages.createWithTypeRoomIdMessageAndUser('screen_sharing_request_rejected', roomId, '', visitor, {});
	}

	screenSharingRequestAccepted(roomId: string, visitor: any, agent: any): void {
		Messages.createWithTypeRoomIdMessageAndUser('screen_sharing_request_accepted', roomId, '', visitor, {});
		const user = Users.findOneByUsernameIgnoringCase(agent.username, null);
		const sessionUrl = this.screenShareProvider.getURL(roomId, user);
		LivechatRooms.updateScreenSharingStatus(roomId, { active: true, sessionUrl });
	}

	endScreenSharingSession(roomId: string, user: any): void {
		Messages.createWithTypeRoomIdMessageAndUser('end_livechat_screen_sharing_session', roomId, '', user, {});
		LivechatRooms.updateScreenSharingStatus(roomId, { active: false, sessionUrl: '' });
	}

	guestRequestingScreenSharing(roomId: string, visitor: any): void {
		Messages.createWithTypeRoomIdMessageAndUser('guest_requesting_livechat_screen_sharing', roomId, 'guest_requesting_livechat_screen_sharing', visitor, {});
	}
}

export const ScreensharingManager = new ScreenSharingManager();

settings.get('Livechat_screen_sharing_provider', function(_key, value) {
	if (!value) {
		return;
	}
	ScreensharingManager.setProviderName(value.toString());
});
