import type { Locator, Page } from '@playwright/test';

import { HomeContent, HomeFlextab, Navbar, Sidepanel, RoomSidebar, ToastMessages } from './fragments';
import { RoomToolbar } from './fragments/toolbar';
import { VoiceCalls } from './fragments/voice-calls';

export class HomeChannel {
	public readonly page: Page;

	readonly content: HomeContent;

	readonly sidebar: RoomSidebar;

	readonly sidepanel: Sidepanel;

	readonly navbar: Navbar;

	readonly tabs: HomeFlextab;

	readonly roomToolbar: RoomToolbar;

	readonly voiceCalls: VoiceCalls;

	readonly toastMessage: ToastMessages;

	constructor(page: Page) {
		this.page = page;
		this.content = new HomeContent(page);
		this.sidebar = new RoomSidebar(page);
		this.sidepanel = new Sidepanel(page);
		this.navbar = new Navbar(page);
		this.tabs = new HomeFlextab(page);
		this.roomToolbar = new RoomToolbar(page);
		this.voiceCalls = new VoiceCalls(page);
		this.toastMessage = new ToastMessages(page);
	}

	goto() {
		return this.page.goto('/home');
	}

	get btnContextualbarClose(): Locator {
		return this.page.locator('[data-qa="ContextualbarActionClose"]');
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
		return this.page.getByRole('main').getByRole('button', { name: 'Favorite' });
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

	get dialogEnterE2EEPassword(): Locator {
		return this.page.getByRole('dialog', { name: 'Enter E2EE password' });
	}

	get dialogSaveE2EEPassword(): Locator {
		return this.page.getByRole('dialog', { name: 'Save your new E2EE password' });
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

	get bannerSaveEncryptionPassword(): Locator {
		return this.page.getByRole('button', { name: 'Save your new E2EE password' });
	}

	get bannerEnterE2EEPassword(): Locator {
		return this.page.getByRole('button', { name: 'Enter your E2E password' });
	}

	get audioRecorder(): Locator {
		return this.page.getByRole('group', { name: 'Audio recorder', exact: true });
	}

	get btnJoinRoom(): Locator {
		return this.page.getByRole('button', { name: 'Join' });
	}

	get statusUploadIndicator(): Locator {
		return this.page.getByRole('main').getByRole('status');
	}

	get homepageHeader(): Locator {
		return this.page.locator('main').getByRole('heading', { name: 'Home' });
	}

	async waitForHome(): Promise<void> {
		await this.homepageHeader.waitFor({ state: 'visible' });
	}

	async waitForRoomLoad(): Promise<void> {
		await this.roomHeaderToolbar.waitFor({ state: 'visible' });
	}
}
