/* eslint-disable @typescript-eslint/camelcase */
import { Meteor } from 'meteor/meteor';

import { settings } from '../../../../settings/server';
import { LivechatRooms, Messages, Users, Rooms } from '../../../../models/server';
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
			this.setupBundle();
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

	setupBundle(): void {
		this.screenShareProvider.setupBundle();
	}

	getConfig(): any {
		return { enabled: this.enabled(), ...this.screenShareProvider.config };
	}

	requestSession(roomId: string, user: any, type: string): void {
		const room = Rooms.findOneById(roomId);
		if (!room) {
			return;
		}
		const { screenSharing } = room;
		if (screenSharing && screenSharing.status === 'active') {
			return;
		}
		LivechatRooms.updateScreenSharingStatus(roomId, { status: 'requested', sessionUrl: '' });
		if (type === 'agent') {
			Messages.createWithTypeRoomIdMessageAndUser('request_livechat_screen_sharing_access', roomId, '', user, {});
		} else if (type === 'visitor') {
			Messages.createWithTypeRoomIdMessageAndUser('guest_requesting_livechat_screen_sharing', roomId, 'guest_requesting_livechat_screen_sharing', user, {
				actionLinks: [
					{ icon: 'icon-videocam', i18nLabel: 'Accept', method_id: 'acceptScreenSharingRequest', params: '' },
				],
			});
		}
	}

	rejectRequest(roomId: string, visitor: any): void {
		Messages.createWithTypeRoomIdMessageAndUser('livechat_screen_sharing_request_rejected', roomId, '', visitor, {});
		LivechatRooms.updateScreenSharingStatus(roomId, { status: 'inactive', sessionUrl: '' });
	}

	acceptRequest(roomId: string, visitor: any, agent: any): void {
		Messages.createWithTypeRoomIdMessageAndUser('livechat_screen_sharing_request_accepted', roomId, '', visitor, {});
		const user = Users.findOneByUsernameIgnoringCase(agent.username, null);
		const sessionUrl = this.screenShareProvider.getURL(roomId, user);
		LivechatRooms.updateScreenSharingStatus(roomId, { status: 'active', sessionUrl });
	}

	endSession(roomId: string, user: any): void {
		Messages.createWithTypeRoomIdMessageAndUser('end_livechat_screen_sharing_session', roomId, '', user, {});
		LivechatRooms.resetScreenSharingStatus({ roomId });
	}
}

export const ScreensharingManager = new ScreenSharingManager();

settings.get('Livechat_screen_sharing_provider', function(_key, value) {
	if (!value) {
		return;
	}
	ScreensharingManager.setProviderName(value.toString());
});
