import type { Locator, Page } from '@playwright/test';

// Sidebar rail is currently in feature preview
export class SidebarRail {
	private root: Locator;

	constructor(protected page: Page) {
		this.root = page.getByRole('navigation', { name: 'Sidebar rail', exact: true });
	}

	private get voiceCallGroup() {
		return this.root.getByRole('group', { name: 'Voice call' });
	}

	get callBtn() {
		return this.voiceCallGroup.getByRole('button', { name: 'Calls' });
	}

	private get navigationGroup() {
		return this.root.getByRole('group', { name: 'Navigation' });
	}

	get btnInbox() {
		return this.navigationGroup.getByRole('button', { name: 'Inbox' });
	}

	get btnTeams() {
		return this.navigationGroup.getByRole('button', { name: 'Teams' });
	}

	get btnSidebarPreferences() {
		return this.root.getByRole('button', { name: 'Sidebar preferences' });
	}
}
