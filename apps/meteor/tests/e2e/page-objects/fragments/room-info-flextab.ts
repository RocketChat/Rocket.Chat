import type { Locator, Page } from '@playwright/test';

import { FlexTab } from './flextab';

export class RoomInfoFlexTab extends FlexTab {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Room Information' }));
	}

	get btnEdit(): Locator {
		return this.root.getByRole('button', { name: 'Edit' });
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

	// getBadgeIndicator(name: string, title: string): Locator {
	// 	return this.homeSidenav.getSidebarItemByName(name).getByTitle(title);
	// }
	getTagInfoByLabel(label: string): Locator {
		return this.root.getByRole('list', { name: 'Tags' }).getByText(label, { exact: true });
	}
}
