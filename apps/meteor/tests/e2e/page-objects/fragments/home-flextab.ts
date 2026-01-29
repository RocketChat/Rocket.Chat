import type { Locator, Page } from '@playwright/test';

import { ExportMessagesTab } from './export-messages-tab';
import { HomeFlextabChannels } from './home-flextab-channels';
import { HomeFlextabMembers } from './home-flextab-members';
import { HomeFlextabNotificationPreferences } from './home-flextab-notificationPreferences';
import { HomeFlextabPruneMessages } from './home-flextab-pruneMessages';
import { HomeFlextabRoom } from './home-flextab-room';
import { SearchMessagesFlexTab } from './searchMessages-flextab';

export class HomeFlextab {
	private readonly page: Page;

	readonly members: HomeFlextabMembers;

	readonly room: HomeFlextabRoom;

	readonly channels: HomeFlextabChannels;

	readonly notificationPreferences: HomeFlextabNotificationPreferences;

	readonly exportMessages: ExportMessagesTab;

	readonly pruneMessages: HomeFlextabPruneMessages;

	readonly searchMessages: SearchMessagesFlexTab;

	constructor(page: Page) {
		this.page = page;
		this.members = new HomeFlextabMembers(page);
		this.room = new HomeFlextabRoom(page);
		this.channels = new HomeFlextabChannels(page);
		this.notificationPreferences = new HomeFlextabNotificationPreferences(page);
		this.exportMessages = new ExportMessagesTab(page);
		this.pruneMessages = new HomeFlextabPruneMessages(page);
		this.searchMessages = new SearchMessagesFlexTab(page);
	}

	get toolbarPrimaryActions(): Locator {
		return this.page.getByRole('toolbar', { name: 'Primary Room actions' });
	}

	get btnTeamMembers(): Locator {
		return this.page.locator('role=menuitem[name="Teams Members"]');
	}

	get kebab(): Locator {
		return this.toolbarPrimaryActions.locator('role=button[name="Options"]');
	}

	get btnNotificationPreferences(): Locator {
		return this.page.locator('role=menuitem[name="Notifications Preferences"]');
	}

	get btnExportMessages(): Locator {
		return this.page.locator('role=menuitem[name="Export messages"]');
	}

	get btnPruneMessages(): Locator {
		return this.page.getByRole('menuitem', { name: 'Prune Messages' });
	}

	get btnDisableE2E(): Locator {
		return this.page.locator('role=menuitem[name="Disable E2E encryption"]');
	}

	get btnEnableE2E(): Locator {
		return this.page.locator('role=menuitem[name="Enable E2E encryption"]');
	}

	get flexTabViewThreadMessage(): Locator {
		return this.page.locator('div.thread-list ul.thread [data-qa-type="message"]').last().locator('[data-qa-type="message-body"]');
	}

	get userInfoUsername(): Locator {
		return this.page.locator('[data-qa="UserInfoUserName"]');
	}

	get btnPinnedMessagesList(): Locator {
		return this.page.locator('[data-key="pinned-messages"]');
	}

	get btnStarredMessageList(): Locator {
		return this.page.locator('[data-key="starred-messages"]');
	}
}
