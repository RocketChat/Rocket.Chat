import type { Locator, Page } from '@playwright/test';

import { FederationHomeContent } from './fragments/home-content';
import { FederationHomeFlextab } from './fragments/home-flextab';
import { FederationSidenav } from './fragments/home-sidenav';

export class FederationChannel {
	private readonly page: Page;

	readonly content: FederationHomeContent;

	readonly sidenav: FederationSidenav;

	readonly tabs: FederationHomeFlextab;

	constructor(page: Page) {
		this.page = page;
		this.content = new FederationHomeContent(page);
		this.sidenav = new FederationSidenav(page);
		this.tabs = new FederationHomeFlextab(page);
	}

	get toastSuccess(): Locator {
		return this.page.locator('.rcx-toastbar.rcx-toastbar--success');
	}

	get btnVerticalBarClose(): Locator {
		return this.page.locator('[data-qa="VerticalBarActionClose"]');
	}

	async createPublicChannelAndInviteUsersUsingCreationModal(channelName: string, usernamesToInvite: string[]) {
		await this.sidenav.openNewByLabel('Channel');
		await this.sidenav.checkboxPrivateChannel.click();
		await this.sidenav.checkboxFederatedChannel.click();
		await this.sidenav.inputChannelName.type(channelName);
		for await (const username of usernamesToInvite) {
			await this.sidenav.inviteUserToChannel(username);
		}

		await this.sidenav.btnCreateChannel.click();
	}

	async createPrivateGroupAndInviteUsersUsingCreationModal(channelName: string, usernamesToInvite: string[]) {
		await this.sidenav.openNewByLabel('Channel');
		await this.sidenav.checkboxFederatedChannel.click();
		await this.sidenav.inputChannelName.type(channelName);
		for await (const username of usernamesToInvite) {
			await this.sidenav.inviteUserToChannel(username);
		}

		await this.sidenav.btnCreateChannel.click();
	}

	async createDirectMessagesUsingModal(usernamesToInvite: string[]) {
		await this.sidenav.openNewByLabel('Direct Messages');
		for await (const username of usernamesToInvite) {
			await this.sidenav.inviteUserToDM(username);
		}
		await this.page
			.locator('//*[@id="modal-root"]//*[contains(@class, "rcx-modal__title") and contains(text(), "Direct Messages")]')
			.click();
		await this.sidenav.btnCreateChannel.click();
	}
}
