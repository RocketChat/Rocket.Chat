import type { Locator, Page } from '@playwright/test';

// Sidebar rail is currently in feature preview
export class SidebarRail {
	private root: Locator;

	constructor(protected page: Page) {
		this.root = page.getByRole('navigation', { name: 'Sidebar rail' });
	}

	private get voiceCallGroup() {
		return this.root.getByRole('group', { name: 'Voice call' });
	}

	get callBtn() {
		return this.voiceCallGroup.getByRole('button', { name: 'Calls' });
	}
}
