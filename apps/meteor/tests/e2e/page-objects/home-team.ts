import type { Locator, Page } from '@playwright/test';

import { HomeChannel } from './home-channel';

/**
 * TODO: HomeTeam shouldn't exist since the rooms are the same
 */
export class HomeTeam extends HomeChannel {
	constructor(page: Page) {
		super(page);
	}

	get inputTeamName(): Locator {
		return this.page.locator('role=textbox[name="Name"]');
	}

	get btnTeamCreate(): Locator {
		return this.page.locator('role=dialog >> role=group >> role=button[name=Create]');
	}

	get textPrivate(): Locator {
		return this.page.locator('label', { has: this.page.getByRole('checkbox', { name: 'Private' }) });
	}

	get textReadOnly(): Locator {
		return this.page.locator('label', { has: this.page.getByRole('checkbox', { name: 'Read-only' }) });
	}
}
