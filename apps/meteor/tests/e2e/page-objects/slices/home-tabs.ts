import { Page } from '@playwright/test';

import { HomeTabDiscussion } from './home-tab-discussion';
import { HomeTabFile } from './home-tab-file';
import { HomeTabNotification } from './home-tab-notification';
import { HomeTabOTR } from './home-tab-otr';
import { HomeTabPinned } from './home-tab-pinned';
import { HomeTabSearch } from './home-tab-search';
import { HomeTabShortcut } from './home-tab-shortcut';
import { HomeTabStared } from './home-tab-stared';
import { HomeTabThread } from './home-tab-thread';
import { HomeTabUser } from './home-tab-user';

export class HomeTabs {
	private readonly page: Page;

	readonly discussion: HomeTabDiscussion;

	readonly file: HomeTabFile;

	readonly notification: HomeTabNotification;

	readonly OTR: HomeTabOTR;

	readonly pinned: HomeTabPinned;

	readonly search: HomeTabSearch;

	readonly shortcut: HomeTabShortcut;

	readonly stared: HomeTabStared;

	readonly thread: HomeTabThread;

	readonly user: HomeTabUser;

	constructor(page: Page) {
		this.page = page;

		this.discussion = new HomeTabDiscussion(page);
		this.file = new HomeTabFile(page);
		this.notification = new HomeTabNotification(page);
		this.OTR = new HomeTabOTR(page);
		this.pinned = new HomeTabPinned(page);
		this.search = new HomeTabSearch(page);
		this.shortcut = new HomeTabShortcut(page);
		this.stared = new HomeTabStared(page);
		this.thread = new HomeTabThread(page);
		this.user = new HomeTabUser(page);
	}
}
