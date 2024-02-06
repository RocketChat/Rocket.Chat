import type { Locator, Page } from '@playwright/test';

import { HomeFlextabChannels } from './home-flextab-channels';
import { HomeFlextabMembers } from './home-flextab-members';
import { HomeFlextabNotificationPreferences } from './home-flextab-notificationPreferences';
import { HomeFlextabRoom } from './home-flextab-room';

export class HomeFlextab {
	private readonly page: Page;

	readonly members: HomeFlextabMembers;

	readonly room: HomeFlextabRoom;

	readonly channels: HomeFlextabChannels;

	readonly notificationPreferences: HomeFlextabNotificationPreferences;

	constructor(page: Page) {
		this.page = page;
		this.members = new HomeFlextabMembers(page);
		this.room = new HomeFlextabRoom(page);
		this.channels = new HomeFlextabChannels(page);
		this.notificationPreferences = new HomeFlextabNotificationPreferences(page);
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
		return this.page.locator('role=button[name="Options"]');
	}

	get btnNotificationPreferences(): Locator {
		return this.page.locator('role=menuitem[name="Notifications Preferences"]');
	}

	get btnDisableE2E(): Locator {
		return this.page.locator('role=menuitem[name="Disable E2E"]');
	}

	get btnEnableE2E(): Locator {
		return this.page.locator('role=menuitem[name="Enable E2E"]');
	}

	get flexTabViewThreadMessage(): Locator {
		return this.page.locator('div.thread-list ul.thread [data-qa-type="message"]').last().locator('[data-qa-type="message-body"]');
	}

	get userInfoUsername(): Locator {
		return this.page.locator('[data-qa="UserInfoUserName"]');
	}

	get pruneMessagesMenuItem(): Locator {
		return this.page.locator('role=menuitem[name="Prune Messages"]');
	}

	get btnPruneMessages(): Locator {
		return this.page.locator('button >> text=Prune');
	}

	get btnConfirmPrune(): Locator {
		return this.page.locator('button >> text=Yes, prune them!');
	}
}
