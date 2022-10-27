import type { Locator, Page } from '@playwright/test';

import { FederationHomeFlextabChannels } from './home-flextab-channels';
import { FederationHomeFlextabMembers } from './home-flextab-members';
import { FederationHomeFlextabNotificationPreferences } from './home-flextab-notificationPreferences';
import { FederationHomeFlextabRoom } from './home-flextab-room';

export class FederationHomeFlextab {
	private readonly page: Page;

	readonly members: FederationHomeFlextabMembers;

	readonly room: FederationHomeFlextabRoom;

	readonly channels: FederationHomeFlextabChannels;

	readonly notificationPreferences: FederationHomeFlextabNotificationPreferences;

	constructor(page: Page) {
		this.page = page;
		this.members = new FederationHomeFlextabMembers(page);
		this.room = new FederationHomeFlextabRoom(page);
		this.channels = new FederationHomeFlextabChannels(page);
		this.notificationPreferences = new FederationHomeFlextabNotificationPreferences(page);
	}

	get btnTabMembers(): Locator {
		return this.page.locator('[data-qa-id=ToolBoxAction-members]');
	}

	get btnRoomInfo(): Locator {
		return this.page.locator('[data-qa-id=ToolBoxAction-info-circled]');
	}

	get btnChannels(): Locator {
		return this.page.locator('[data-qa-id="ToolBoxAction-hash"]');
	}

	get kebab(): Locator {
		return this.page.locator('[data-qa-id=ToolBox-Menu]');
	}

	get btnNotificationPreferences(): Locator {
		return this.page.locator('[data-qa-id=ToolBoxAction-bell]');
	}

	get userInfoUsername(): Locator {
		return this.page.locator('[data-qa="UserInfoUserName"]');
	}
}
