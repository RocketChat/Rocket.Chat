import type { Locator, Page } from '@playwright/test';

import { expect } from '../utils/test';
import { HomeContent, HomeSidenav, HomeFlextab } from './fragments';

export class HomeChannel {
	private readonly page: Page;

	readonly content: HomeContent;

	readonly sidenav: HomeSidenav;

	readonly tabs: HomeFlextab;

	constructor(page: Page) {
		this.page = page;
		this.content = new HomeContent(page);
		this.sidenav = new HomeSidenav(page);
		this.tabs = new HomeFlextab(page);
	}

	get toastSuccess(): Locator {
		return this.page.locator('.rcx-toastbar.rcx-toastbar--success');
	}

	get btnContextualbarClose(): Locator {
		return this.page.locator('[data-qa="ContextualbarActionClose"]');
	}

	async waitForChannel(): Promise<void> {
		await this.page.locator('role=main').waitFor();
		await this.page.locator('role=main >> role=heading[level=1]').waitFor();

		await expect(this.page.locator('role=main >> .rcx-skeleton')).toHaveCount(0);
		await expect(this.page.locator('role=main >> role=list')).not.toHaveAttribute('aria-busy', 'true');
	}

	async dismissToast() {
		// this is a workaround for when the toast is blocking the click of the button
		await this.toastSuccess.locator('button >> i.rcx-icon--name-cross.rcx-icon').click();
		await this.page.mouse.move(0, 0);
	}

	get composerToolboxActions(): Locator {
		return this.page.locator('[role=toolbar][aria-label="Composer Primary Actions"] button');
	}
}
