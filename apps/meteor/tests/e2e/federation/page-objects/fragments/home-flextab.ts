import type { Locator, Page } from '@playwright/test';

import { FederationHomeFlextabChannels } from './home-flextab-channels';
import { FederationHomeFlextabDirectMessageMember } from './home-flextab-dm-member';
import { FederationHomeFlextabMembers } from './home-flextab-members';
import { FederationHomeFlextabNotificationPreferences } from './home-flextab-notificationPreferences';
import { FederationHomeFlextabRoom } from './home-flextab-room';

export class FederationHomeFlextab {
	private readonly page: Page;

	readonly members: FederationHomeFlextabMembers;

	readonly dmUserMember: FederationHomeFlextabDirectMessageMember;

	readonly room: FederationHomeFlextabRoom;

	readonly channels: FederationHomeFlextabChannels;

	readonly notificationPreferences: FederationHomeFlextabNotificationPreferences;

	constructor(page: Page) {
		this.page = page;
		this.members = new FederationHomeFlextabMembers(page);
		this.room = new FederationHomeFlextabRoom(page);
		this.channels = new FederationHomeFlextabChannels(page);
		this.notificationPreferences = new FederationHomeFlextabNotificationPreferences(page);
		this.dmUserMember = new FederationHomeFlextabDirectMessageMember(page);
	}

	get btnAddExistingChannelToTeam(): Locator {
		return this.page.locator('role=button[name="Add Existing"]');
	}

	async searchForChannelOnAddChannelToTeam(channelName: string): Promise<void> {
		await this.page.locator('//label[contains(text(), "Channels")]/..//input').focus();
		await this.page.waitForTimeout(2000);
		await this.page.locator('//label[contains(text(), "Channels")]/..//input').type(channelName);
	}

	get userInfoUsername(): Locator {
		return this.page.locator('[data-qa="UserInfoUserName"]');
	}
}
