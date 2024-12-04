import type { Locator, Page } from '@playwright/test';

export class Navbar {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get navbar(): Locator {
		return this.page.getByRole('navigation', { name: 'header' });
	}

	get pagesToolbar(): Locator {
		return this.navbar.getByRole('toolbar', { name: 'Pages' });
	}

	get omnichannelToolbar(): Locator {
		return this.navbar.getByRole('toolbar', { name: 'Omnichannel', exact: true });
	}

	get homeButton(): Locator {
		return this.pagesToolbar.getByRole('button', { name: 'Home', exact: true });
	}

	get directoryButton(): Locator {
		return this.pagesToolbar.getByRole('button', { name: 'Directory', exact: true });
	}

	async openInstalledApps(): Promise<void> {
		await this.pagesToolbar.getByRole('button', { name: 'Marketplace', exact: true }).click();
		await this.pagesToolbar.getByRole('menu').getByRole('menuitem', { name: 'Installed', exact: true }).click();
	}

	get settingsGroup(): Locator {
		return this.navbar.getByRole('group', { name: 'Workspace and user settings', exact: true });
	}

	get userProfileMenu(): Locator {
		return this.settingsGroup.getByRole('button', { name: 'User menu', exact: true });
	}

	get accountProfileOption(): Locator {
		return this.settingsGroup.getByRole('menuitemcheckbox', { name: 'Profile', exact: true });
	}

	async openWorkspaceSettingsMenu(): Promise<void> {
		await this.settingsGroup.getByRole('button', { name: 'Manage', exact: true }).click();
	}

	get workspaceMenuItem(): Locator {
		return this.settingsGroup.getByRole('menuitem', { name: 'Workspace', exact: true });
	}

	get omnichannelMenuItem(): Locator {
		return this.settingsGroup.getByRole('menuitem', { name: 'Omnichannel', exact: true });
	}

	async switchStatus(status: 'offline' | 'online'): Promise<void> {
		await this.userProfileMenu.click();
		await this.settingsGroup.getByRole('menu').getByRole('menuitemcheckbox', { name: status, exact: true }).click();
	}

	async switchOmnichannelStatus(status: 'offline' | 'online'): Promise<void> {
		const toggleButton = this.omnichannelToolbar.getByRole('button', { name: 'answer chats' });
		expect(toggleButton).toBeVisible();

		enum StatusTitleMap {
			offline = 'Turn on answer chats',
			online = 'Turn off answer chats',
		}

		const currentStatus = await toggleButton.getAttribute('title');
		if (status === 'offline') {
			if (currentStatus === StatusTitleMap.online) {
				await toggleButton.click();
			}
		} else if (currentStatus === StatusTitleMap.offline) {
			await toggleButton.click();
		}
		await this.page.waitForTimeout(500);

		const newStatus = await this.omnichannelToolbar.getByRole('button', { name: 'answer chats' }).getAttribute('title');
		expect(newStatus).toBe(status === 'offline' ? StatusTitleMap.offline : StatusTitleMap.online);
	}

	async logout(): Promise<void> {
		await this.userProfileMenu.click();
		await this.settingsGroup.getByRole('menu').getByRole('menuitemcheckbox', { name: 'Locoug', exact: true }).click();
	}
}
