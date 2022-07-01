import { Page } from '@playwright/test';

import { FlextabDiscussion } from './flextab-discussion';
import { FlextabFile } from './flextab-file';
import { FlextabNotification } from './flextab-notification';
import { FlextabPinned } from './flextab-pinned';
import { FlextabSearch } from './flextab-search';
import { FlextabStared } from './flextab-stared';
import { FlextabThread } from './flextab-thread';
import { FlextabUser } from './flextab-user';

export class HomeFlextab {
	private readonly page: Page;

	readonly discussion: FlextabDiscussion;

	readonly file: FlextabFile;

	readonly notification: FlextabNotification;

	readonly pinned: FlextabPinned;

	readonly search: FlextabSearch;

	readonly stared: FlextabStared;

	readonly thread: FlextabThread;

	readonly user: FlextabUser;

	constructor(page: Page) {
		this.page = page;

		this.discussion = new FlextabDiscussion(page);
		this.file = new FlextabFile(page);
		this.notification = new FlextabNotification(page);
		this.pinned = new FlextabPinned(page);
		this.search = new FlextabSearch(page);
		this.stared = new FlextabStared(page);
		this.thread = new FlextabThread(page);
		this.user = new FlextabUser(page);
	}
}
