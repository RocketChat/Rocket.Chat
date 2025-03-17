import type { Locator, Page } from '@playwright/test';

import { HomeContent, HomeSidenav, HomeFlextab, Navbar, Sidebar, Sidepanel } from './fragments';

export class HomeChannel {
	public readonly page: Page;

	readonly content: HomeContent;

	readonly sidenav: HomeSidenav;

	readonly sidebar: Sidebar;

	readonly sidepanel: Sidepanel;

	readonly navbar: Navbar;

	readonly tabs: HomeFlextab;

	constructor(page: Page) {
		this.page = page;
		this.content = new HomeContent(page);
		this.sidenav = new HomeSidenav(page);
		this.sidebar = new Sidebar(page);
		this.sidepanel = new Sidepanel(page);
		this.navbar = new Navbar(page);
		this.tabs = new HomeFlextab(page);
	}

	get toastSuccess(): Locator {
		return this.page.locator('.rcx-toastbar.rcx-toastbar--success');
	}

	get btnContextualbarClose(): Locator {
		return this.page.locator('[data-qa="ContextualbarActionClose"]');
	}

	async dismissToast() {
		// this is a workaround for when the toast is blocking the click of the button
		await this.toastSuccess.locator('button >> i.rcx-icon--name-cross.rcx-icon').click();
		await this.page.mouse.move(0, 0);
	}

	get composer(): Locator {
		return this.page.locator('textarea[name="msg"]');
	}

	get composerBoxPopup(): Locator {
		return this.page.locator('[role="menu"][name="ComposerBoxPopup"]');
	}

	get userCardToolbar(): Locator {
		return this.page.locator('[role=toolbar][aria-label="User card actions"]');
	}

	get composerToolbar(): Locator {
		return this.page.locator('[role=toolbar][aria-label="Composer Primary Actions"]');
	}

	get composerToolbarActions(): Locator {
		return this.page.locator('[role=toolbar][aria-label="Composer Primary Actions"] button');
	}

	get roomHeaderFavoriteBtn(): Locator {
		return this.page.getByRole('button', { name: 'Favorite' });
	}

	get readOnlyFooter(): Locator {
		return this.page.locator('footer', { hasText: 'This room is read only' });
	}

	get roomHeaderToolbar(): Locator {
		return this.page.locator('[role=toolbar][aria-label="Primary Room actions"]');
	}

	get markUnread(): Locator {
		return this.page.locator('role=menuitem[name="Mark Unread"]');
	}

	get audioVideoConfRingtone(): Locator {
		return this.page.locator('#custom-sound-ringtone');
	}

	get audioVideoConfDialtone(): Locator {
		return this.page.locator('#custom-sound-dialtone');
	}

	get dialogEnterE2EEPassword(): Locator {
		return this.page.getByRole('dialog', { name: 'Enter E2EE password' });
	}

	get dialogSaveE2EEPassword(): Locator {
		return this.page.getByRole('dialog', { name: 'Save your encryption password' });
	}

	get btnSaveE2EEPassword(): Locator {
		return this.dialogSaveE2EEPassword.getByRole('button', { name: 'Save E2EE password' });
	}

	get btnRoomSaveE2EEPassword(): Locator {
		return this.page.getByRole('main').getByRole('button', { name: 'Save E2EE password' });
	}

	get btnRoomEnterE2EEPassword(): Locator {
		return this.page.getByRole('main').getByRole('button', { name: 'Enter your E2E password' });
	}

	get btnSavedMyPassword(): Locator {
		return this.dialogSaveE2EEPassword.getByRole('button', { name: 'I saved my password' });
	}

	get btnEnterE2EEPassword(): Locator {
		return this.dialogEnterE2EEPassword.getByRole('button', { name: 'Enter your E2E password' });
	}

	get bannerSaveEncryptionPassword(): Locator {
		return this.page.getByRole('button', { name: 'Save your encryption password' });
	}

	get bannerEnterE2EEPassword(): Locator {
		return this.page.getByRole('button', { name: 'Enter your E2E password' });
	}

	get btnNotPossibleDecodeKey(): Locator {
		return this.page.getByRole('button', { name: "Wasn't possible to decode your encryption key to be imported." });
	}

	get audioRecorder(): Locator {
		return this.page.getByRole('group', { name: 'Audio recorder', exact: true });
	}

	get btnJoinRoom(): Locator {
		return this.page.getByRole('button', { name: 'Join' });
	}
}
