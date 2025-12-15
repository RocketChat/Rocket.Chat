import type { Locator, Page } from '@playwright/test';

import { FlexTab } from './flextab';

export class EditRoomFlexTab extends FlexTab {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Room Information' }));
	}

	get btnSave(): Locator {
		return this.root.locator('button >> text="Save"');
	}

	get roomNameInput(): Locator {
		return this.root.locator('input[name="roomName"]');
	}

	get privateLabel(): Locator {
		return this.root.locator(`label >> text=Private`);
	}

	get privateInput(): Locator {
		return this.root.locator('input[name="roomType"]');
	}

	get roomOwnerInput(): Locator {
		return this.root.locator('input[name="roomOwner"]');
	}

	get archivedLabel(): Locator {
		return this.root.locator('label >> text=Archived');
	}

	get archivedInput(): Locator {
		return this.root.locator('input[name="archived"]');
	}

	get favoriteLabel(): Locator {
		return this.root.locator('label >> text=Favorite');
	}

	get favoriteInput(): Locator {
		return this.root.locator('input[name="favorite"]');
	}

	get defaultLabel(): Locator {
		return this.root.locator('label >> text=Default');
	}

	get defaultInput(): Locator {
		return this.root.locator('input[name="isDefault"]');
	}
}
