import type { Locator, Page } from '@playwright/test';

import { FederationHomeContent } from './fragments/home-content';
import { FederationHomeFlextab } from './fragments/home-flextab';
import { FederationSidenav } from './fragments/home-sidenav';
import { Navbar, RoomToolbar, ToastMessages } from '../../page-objects/fragments';
import { CreateNewChannelModal, CreateNewDMModal } from '../../page-objects/fragments/modals';

export class FederationChannel {
	private readonly page: Page;

	readonly content: FederationHomeContent;

	readonly sidenav: FederationSidenav;

	readonly navbar: Navbar;

	readonly tabs: FederationHomeFlextab;

	readonly roomToolbar: RoomToolbar;

	readonly toastMessage: ToastMessages;

	readonly newChannelModal: CreateNewChannelModal;

	readonly newDMModal: CreateNewDMModal;

	constructor(page: Page) {
		this.page = page;
		this.content = new FederationHomeContent(page);
		this.sidenav = new FederationSidenav(page);
		this.navbar = new Navbar(page);
		this.tabs = new FederationHomeFlextab(page);
		this.roomToolbar = new RoomToolbar(page);
		this.toastMessage = new ToastMessages(page);
		this.newChannelModal = new CreateNewChannelModal(page);
		this.newDMModal = new CreateNewDMModal(page);
	}

	get btnContextualbarClose(): Locator {
		return this.page.locator('[data-qa="ContextualbarActionClose"]');
	}

	async getFederationServerName(): Promise<string> {
		return (await this.page.locator('[data-qa="federated-origin-server-name"]').locator('span').innerText()).substring(1).trim();
	}

	async createPublicChannelAndInviteUsersUsingCreationModal(channelName: string, usernamesToInvite: string[]) {
		await this.navbar.createNew('Channel', channelName, {
			private: false,
			federated: true,
			members: usernamesToInvite,
		});
	}

	async createDiscussionSearchingForChannel(channelName: string) {
		await this.navbar.openCreate('Discussion');
		await this.page.locator('//label[text()="Parent channel or group"]/following-sibling::span//input').waitFor();
		await this.page.locator('//label[text()="Parent channel or group"]/following-sibling::span//input').focus();
		await this.page.locator('//label[text()="Parent channel or group"]/following-sibling::span//input').type(channelName, { delay: 100 });
	}

	async createTeam(teamName: string) {
		await this.navbar.createNew('Team', teamName);
	}

	async createPrivateGroupAndInviteUsersUsingCreationModal(channelName: string, usernamesToInvite: string[]) {
		await this.navbar.createNew('Channel', channelName, {
			private: true,
			federated: true,
			members: usernamesToInvite,
		});
	}

	async createDirectMessagesUsingModal(usernamesToInvite: string[]) {
		await this.navbar.openCreate('Direct message');

		for await (const username of usernamesToInvite) {
			await this.newDMModal.inviteUserToDM(username);
		}
		await this.newDMModal.btnCreate.click();
	}

	async createNonFederatedPublicChannelAndInviteUsersUsingCreationModal(channelName: string, usernamesToInvite: string[]) {
		await this.navbar.openCreate('Channel');
		await this.newChannelModal.checkboxPrivate.click();
		await this.newChannelModal.inputName.fill(channelName);
		for await (const username of usernamesToInvite) {
			await this.newChannelModal.inviteUserToChannel(username);
		}

		await this.newChannelModal.btnCreate.click();
	}
}
