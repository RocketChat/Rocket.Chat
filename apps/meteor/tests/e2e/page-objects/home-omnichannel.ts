import type { Locator, Page } from '@playwright/test';

import { HomeOmnichannelContent, OmnichannelSidenav } from './fragments';
import { OmnichannelQuickActionsRoomToolbar, OmnichannelRoomToolbar } from './fragments/toolbar';
import { HomeChannel } from './home-channel';
import { OmnichannelAgents } from './omnichannel-agents';
import { OmnichannelCannedResponses } from './omnichannel-canned-responses';
import { OmnichannelChats } from './omnichannel-contact-center-chats';
import { OmnichannelContacts } from './omnichannel-contacts-list';
import { OmnichannelManager } from './omnichannel-manager';
import { OmnichannelMonitors } from './omnichannel-monitors';
import { OmnichannelRoomInfo } from './omnichannel-room-info';
import { OmnichannelTranscript } from './omnichannel-transcript';
import { OmnichannelTriggers } from './omnichannel-triggers';

export class HomeOmnichannel extends HomeChannel {
	readonly triggers: OmnichannelTriggers;

	readonly omnisidenav: OmnichannelSidenav;

	readonly transcript: OmnichannelTranscript;

	readonly cannedResponses: OmnichannelCannedResponses;

	readonly agents: OmnichannelAgents;

	readonly managers: OmnichannelManager;

	readonly monitors: OmnichannelMonitors;

	readonly contacts: OmnichannelContacts;

	readonly chats: OmnichannelChats;

	readonly roomInfo: OmnichannelRoomInfo;

	readonly quickActionsRoomToolbar: OmnichannelQuickActionsRoomToolbar;

	override readonly content: HomeOmnichannelContent;

	override readonly roomToolbar: OmnichannelRoomToolbar;

	constructor(page: Page) {
		super(page);
		this.triggers = new OmnichannelTriggers(page);
		this.omnisidenav = new OmnichannelSidenav(page);
		this.transcript = new OmnichannelTranscript(page);
		this.cannedResponses = new OmnichannelCannedResponses(page);
		this.agents = new OmnichannelAgents(page);
		this.managers = new OmnichannelManager(page);
		this.monitors = new OmnichannelMonitors(page);
		this.contacts = new OmnichannelContacts(page);
		this.chats = new OmnichannelChats(page);
		this.roomInfo = new OmnichannelRoomInfo(page);
		this.quickActionsRoomToolbar = new OmnichannelQuickActionsRoomToolbar(page);
		this.content = new HomeOmnichannelContent(page);
		this.roomToolbar = new OmnichannelRoomToolbar(page);
	}

	get btnContactInfo(): Locator {
		return this.page.getByRole('button', { name: 'Contact Information' });
	}
}
