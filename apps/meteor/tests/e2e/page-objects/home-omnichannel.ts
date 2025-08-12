import type { Locator, Page } from '@playwright/test';

import { HomeOmnichannelContent, HomeSidenav, HomeFlextab, OmnichannelSidenav } from './fragments';
import { OmnichannelAgents } from './omnichannel-agents';
import { OmnichannelCannedResponses } from './omnichannel-canned-responses';
import { OmnichannelContacts } from './omnichannel-contacts-list';
import { OmnichannelCurrentChats } from './omnichannel-current-chats';
import { OmnichannelManager } from './omnichannel-manager';
import { OmnichannelMonitors } from './omnichannel-monitors';
import { OmnichannelRoomInfo } from './omnichannel-room-info';
import { OmnichannelTranscript } from './omnichannel-transcript';
import { OmnichannelTriggers } from './omnichannel-triggers';

export class HomeOmnichannel {
	readonly page: Page;

	readonly content: HomeOmnichannelContent;

	readonly sidenav: HomeSidenav;

	readonly tabs: HomeFlextab;

	readonly triggers: OmnichannelTriggers;

	readonly omnisidenav: OmnichannelSidenav;

	readonly currentChats: OmnichannelCurrentChats;

	readonly transcript: OmnichannelTranscript;

	readonly cannedResponses: OmnichannelCannedResponses;

	readonly agents: OmnichannelAgents;

	readonly managers: OmnichannelManager;

	readonly monitors: OmnichannelMonitors;

	readonly contacts: OmnichannelContacts;

	readonly roomInfo: OmnichannelRoomInfo;

	constructor(page: Page) {
		this.page = page;
		this.content = new HomeOmnichannelContent(page);
		this.sidenav = new HomeSidenav(page);
		this.tabs = new HomeFlextab(page);
		this.triggers = new OmnichannelTriggers(page);
		this.omnisidenav = new OmnichannelSidenav(page);
		this.currentChats = new OmnichannelCurrentChats(page);
		this.transcript = new OmnichannelTranscript(page);
		this.cannedResponses = new OmnichannelCannedResponses(page);
		this.agents = new OmnichannelAgents(page);
		this.managers = new OmnichannelManager(page);
		this.monitors = new OmnichannelMonitors(page);
		this.contacts = new OmnichannelContacts(page);
		this.roomInfo = new OmnichannelRoomInfo(page);
	}

	get toastSuccess(): Locator {
		return this.page.locator('.rcx-toastbar.rcx-toastbar--success');
	}

	get btnContextualbarClose(): Locator {
		return this.page.locator('[data-qa="ContextualbarActionClose"]');
	}

	get btnContactInfo(): Locator {
		return this.page.getByRole('button', { name: 'Contact Information' });
	}
}
