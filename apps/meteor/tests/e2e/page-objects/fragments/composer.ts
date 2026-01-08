import type { Locator, Page } from 'playwright-core';

export abstract class Composer {
	constructor(
		protected root: Locator,
		protected page?: Page,
	) {
		this.root = root;
		this.page = page;
	}

	get inputMessage(): Locator {
		return this.root.locator('[name="msg"]');
	}

	get toolbarPrimaryActions(): Locator {
		return this.root.getByRole('toolbar', { name: 'Composer Primary Actions' });
	}

	get allPrimaryActions(): Locator {
		return this.toolbarPrimaryActions.getByRole('button');
	}

	get btnComposerEmoji(): Locator {
		return this.toolbarPrimaryActions.getByRole('button', { name: 'Emoji' });
	}

	get btnJoinRoom(): Locator {
		return this.root.getByRole('button', { name: 'Join' });
	}

	get btnSend(): Locator {
		return this.root.getByRole('button', { name: 'Send', exact: true });
	}

	get btnOptionFileUpload(): Locator {
		return this.toolbarPrimaryActions.getByRole('button', { name: 'Upload file' });
	}

	get btnVideoMessage(): Locator {
		return this.toolbarPrimaryActions.getByRole('button', { name: 'Video message' });
	}
}

export class MessageComposer extends Composer {
	constructor(page: Page) {
		super(page.getByRole('group', { name: 'Message composer' }));
	}
}

export class ThreadMessageComposer extends Composer {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'thread' }).getByRole('group', { name: 'Message composer' }));
	}
}
