import type { Locator, Page } from '@playwright/test';

import { TeamInfoFlexTab, TeamToolbar } from './fragments';
import { HomeChannel } from './home-channel';

/**
 * TODO: HomeTeam shouldn't exist since the rooms are the same
 */
export class HomeTeam extends HomeChannel {
	override readonly tabs: HomeChannel['tabs'] & { teamInfo: TeamInfoFlexTab };

	readonly headerToolbar: TeamToolbar;

	constructor(page: Page) {
		super(page);
		this.tabs.room = new TeamInfoFlexTab(page.getByRole('dialog', { name: 'Team Information' }), page);
		this.headerToolbar = new TeamToolbar(page);
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
