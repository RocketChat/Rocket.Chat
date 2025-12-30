import type { Locator, Page } from '@playwright/test';

import { HomeOmnichannelContent, OmnichannelQuickActionsRoomToolbar, OmnichannelRoomToolbar, OmnichannelSidebar } from './fragments';
import type { OmnichannelEditRoomFlexTab } from './fragments/edit-room-flextab';
import { OmnichannelRoomInfoFlexTab } from './fragments/room-info-flextab';
import { HomeChannel } from './home-channel';
import {
	OmnichannelCannedResponses,
	OmnichannelManager,
	OmnichannelMonitors,
	OmnichannelTranscript,
	OmnichannelTriggers,
	OmnichannelContactCenterContacts,
	OmnichannelAgents,
	OmnichannelContactCenterChats,
} from './omnichannel';

export class HomeOmnichannel extends HomeChannel {
	readonly triggers: OmnichannelTriggers;

	readonly omnisidenav: OmnichannelSidebar;

	readonly transcript: OmnichannelTranscript;

	readonly cannedResponses: OmnichannelCannedResponses;

	readonly agents: OmnichannelAgents;

	readonly managers: OmnichannelManager;

	readonly monitors: OmnichannelMonitors;

	readonly contacts: OmnichannelContactCenterContacts;

	readonly chats: OmnichannelContactCenterChats;

	readonly roomInfo: OmnichannelRoomInfoFlexTab;

	readonly editRoomInfo: OmnichannelEditRoomFlexTab;

	readonly quickActionsRoomToolbar: OmnichannelQuickActionsRoomToolbar;

	override readonly content: HomeOmnichannelContent;

	override readonly roomToolbar: OmnichannelRoomToolbar;

	constructor(page: Page) {
		super(page);
		this.triggers = new OmnichannelTriggers(page);
		this.omnisidenav = new OmnichannelSidebar(page);
		this.transcript = new OmnichannelTranscript(page);
		this.cannedResponses = new OmnichannelCannedResponses(page);
		this.agents = new OmnichannelAgents(page);
		this.managers = new OmnichannelManager(page);
		this.monitors = new OmnichannelMonitors(page);
		this.contacts = new OmnichannelContactCenterContacts(page);
		this.chats = new OmnichannelContactCenterChats(page);
		this.roomInfo = new OmnichannelRoomInfoFlexTab(page);
		this.quickActionsRoomToolbar = new OmnichannelQuickActionsRoomToolbar(page);
		this.content = new HomeOmnichannelContent(page);
		this.roomToolbar = new OmnichannelRoomToolbar(page);
	}

	get btnContactInfo(): Locator {
		return this.page.getByRole('button', { name: 'Contact Information' });
	}
}
