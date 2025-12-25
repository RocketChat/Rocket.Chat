import type { Locator, Page } from '@playwright/test';

import { OmnichannelCloseChatModal, OmnichannelOnHoldModal } from './modals';

export abstract class Toolbar {
	constructor(protected root: Locator) {}

	click() {
		return this.root.click();
	}
}

export class RoomToolbar extends Toolbar {
	constructor(page: Page) {
		super(page.getByRole('toolbar', { name: 'Primary Room actions' }));
	}

	get btnRoomInfo() {
		return this.root.getByRole('button', { name: 'Room Information' });
	}

	private get btnTeamInfo() {
		return this.root.getByRole('button', { name: 'Team info' });
	}

	get btnMembers() {
		return this.root.getByRole('button', { name: 'Members' });
	}

	get btnVideoCall() {
		return this.root.getByRole('button', { name: 'Video Call' });
	}

	get btnVoiceCall() {
		return this.root.getByRole('button', { name: 'Voice call' });
	}

	get btnUserInfo(): Locator {
		return this.root.getByRole('button', { name: 'User Info' });
	}

	get btnDiscussion(): Locator {
		return this.root.getByRole('button', { name: 'Discussions' });
	}

	private get btnTeamChannels(): Locator {
		return this.root.getByRole('button', { name: 'Team Channels' });
	}

	get btnThreads(): Locator {
		return this.root.getByRole('button', { name: 'Threads' });
	}

	get btnFiles(): Locator {
		return this.root.getByRole('button', { name: 'Files' });
	}

	get btnMoreOptions(): Locator {
		return this.root.getByRole('button', { name: 'Options' });
	}

	get btnSearchMessages(): Locator {
		return this.root.getByRole('button', { name: 'Search Messages' });
	}

	get btnDisableE2EEncryption(): Locator {
		return this.root.getByRole('button', { name: 'Disable E2E encryption' });
	}

	get menuItemMentions(): Locator {
		return this.root.getByRole('menuitem', { name: 'Mentions' });
	}

	get menuItemStarredMessages(): Locator {
		return this.root.getByRole('menuitem', { name: 'Starred Messages' });
	}

	get menuItemPinnedMessages(): Locator {
		return this.root.getByRole('menuitem', { name: 'Pinned Messages' });
	}

	get menuItemPruneMessages(): Locator {
		return this.root.getByRole('menuitem', { name: 'Prune Messages' });
	}

	async openRoomInfo() {
		await this.btnRoomInfo.click();
	}

	async openTeamInfo() {
		await this.btnTeamInfo.click();
	}

	async openMembersTab() {
		await this.btnMembers.click();
	}

	async openUserInfo() {
		await this.btnUserInfo.click();
	}

	async openTeamChannels() {
		await this.btnTeamChannels.click();
	}

	async openMoreOptions() {
		await this.btnMoreOptions.click();
	}
}

export class OmnichannelRoomToolbar extends RoomToolbar {
	private get btnContactInfo(): Locator {
		return this.root.getByRole('button', { name: 'Contact Information' });
	}

	private get btnCannedResponses(): Locator {
		return this.root.getByRole('button', { name: 'Canned Responses' });
	}

	async openContactInfo() {
		await this.btnContactInfo.click();
	}

	async openCannedResponses() {
		await this.btnCannedResponses.click();
	}
}

export class OmnichannelQuickActionsRoomToolbar extends Toolbar {
	private closeChatModal: OmnichannelCloseChatModal;

	private onHoldModal: OmnichannelOnHoldModal;

	constructor(page: Page) {
		super(page.getByRole('toolbar', { name: 'Omnichannel Quick Actions' }));
		this.closeChatModal = new OmnichannelCloseChatModal(page);
		this.onHoldModal = new OmnichannelOnHoldModal(page);
	}

	get btnOnHold(): Locator {
		return this.root.getByRole('button', { name: 'Place chat On-Hold' });
	}

	get btnForwardChat(): Locator {
		return this.root.getByRole('button', { name: 'Forward chat' });
	}

	get btnEndConversation(): Locator {
		return this.root.getByRole('button', { name: 'End conversation' });
	}

	/**
	 * FIXME: This `clickCount` seems a hack for a bad implementation
	 */
	async placeChatOnHold() {
		await this.btnOnHold.click({ clickCount: 2 });
		await this.onHoldModal.confirm();
	}

	async forwardChat() {
		await this.btnForwardChat.click();
	}

	async closeChat({ comment = 'any_comment', downloadPDF = false } = {}): Promise<void> {
		await this.btnEndConversation.click();
		await this.closeChatModal.confirm(comment, downloadPDF);
	}
}
