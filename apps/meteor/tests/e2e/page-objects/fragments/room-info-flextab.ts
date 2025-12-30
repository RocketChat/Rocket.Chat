import type { Locator, Page } from '@playwright/test';

import { FlexTab } from './flextab';

export class RoomInfoFlexTab extends FlexTab {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Room Information' }));
	}

	get btnEdit(): Locator {
		return this.root.getByRole('button', { name: 'Edit' });
	}

	get privateLabel(): Locator {
		return this.root.locator(`label >> text=Private`);
	}

	get archivedLabel(): Locator {
		return this.root.locator('label >> text=Archived');
	}

	get archivedInput(): Locator {
		return this.root.locator('input[name="archived"]');
	}

	get roomNameInput(): Locator {
		return this.root.locator('input[name="roomName"]');
	}

	get privateInput(): Locator {
		return this.root.locator('input[name="roomType"]');
	}

	get roomOwnerInput(): Locator {
		return this.root.locator('input[name="roomOwner"]');
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

export class OmnichannelRoomInfoFlexTab extends RoomInfoFlexTab {
	getInfo(value: string): Locator {
		return this.root.locator(`span >> text="${value}"`);
	}

	getLabel(label: string): Locator {
		return this.root.locator(`div >> text="${label}"`);
	}

	getInfoByLabel(label: string): Locator {
		return this.root.getByLabel(label);
	}

	getTagInfoByLabel(label: string): Locator {
		return this.root.getByRole('list', { name: 'Tags' }).getByText(label, { exact: true });
	}
}
