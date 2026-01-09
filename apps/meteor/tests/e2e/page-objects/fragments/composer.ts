import type { Locator, Page } from 'playwright-core';

export abstract class Composer {
	constructor(protected root: Locator) {
		this.root = root;
	}

	private get msgComposer(): Locator {
		return this.root.getByRole('group', { name: 'Message composer' });
	}

	get inputMessage(): Locator {
		return this.msgComposer.locator('[name="msg"]');
	}

	get btnJoinRoom(): Locator {
		return this.root.getByRole('button', { name: 'Join' });
	}

	get toolbarPrimaryActions(): Locator {
		return this.msgComposer.getByRole('toolbar', { name: 'Composer Primary Actions' });
	}

	get allPrimaryActions(): Locator {
		return this.toolbarPrimaryActions.getByRole('button');
	}

	get btnComposerEmoji(): Locator {
		return this.toolbarPrimaryActions.getByRole('button', { name: 'Emoji', exact: true });
	}

	get btnAudioMessage(): Locator {
		return this.toolbarPrimaryActions.getByRole('button', { name: 'Audio message' });
	}

	get btnSend(): Locator {
		return this.msgComposer.getByRole('button', { name: 'Send' });
	}

	get btnOptionFileUpload(): Locator {
		return this.toolbarPrimaryActions.getByRole('button', { name: 'Upload file' });
	}

	get btnVideoMessage(): Locator {
		return this.toolbarPrimaryActions.getByRole('button', { name: 'Video message' });
	}

	get btnMenuMoreActions() {
		return this.toolbarPrimaryActions.getByRole('button', { name: 'More actions' });
	}

	get boxPopup(): Locator {
		return this.root.locator('[role="menu"][name="ComposerBoxPopup"]');
	}

	get readOnlyFooter(): Locator {
		return this.root.getByText('This room is read only');
	}
}

export class RoomComposer extends Composer {
	constructor(page: Page) {
		super(page.locator('footer[aria-label="Room composer"]'));
	}
}

export class ThreadComposer extends Composer {
	constructor(page: Page) {
		super(page.locator('footer[aria-label="Thread composer"]'));
	}
}
