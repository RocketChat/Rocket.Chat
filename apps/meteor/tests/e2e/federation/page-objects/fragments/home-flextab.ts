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

	get btnTabMembers(): Locator {
		return this.page.locator('[data-qa-id=ToolBoxAction-members]');
	}

	get btnRoomInfo(): Locator {
		return this.page.locator('[data-qa-id=ToolBoxAction-info-circled]');
	}

	get btnUserInfo(): Locator {
		return this.page.locator('[data-qa-id="ToolBoxAction-user"]');
	}

	get btnCall(): Locator {
		return this.page.locator('[data-qa-id="ToolBoxAction-phone"]');
	}

	get btnDiscussion(): Locator {
		return this.page.locator('[data-qa-id="ToolBoxAction-discussion"]');
	}

	get btnThread(): Locator {
		return this.page.locator('[data-qa-id="ToolBoxAction-thread"]');
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
