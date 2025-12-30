import type { Locator, Page } from '@playwright/test';

import { FlexTab } from './flextab';
import { Listbox } from './listbox';

export class EditRoomFlexTab extends FlexTab {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Room Information' }));
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

export class OmnichannelEditRoomFlexTab extends EditRoomFlexTab {
	private readonly listbox: Listbox;

	constructor(page: Page) {
		super(page);
		this.listbox = new Listbox(page.getByRole('dialog', { name: 'Room Information' }));
	}

	get inputTopic(): Locator {
		return this.root.getByRole('textbox', { name: 'Topic' });
	}

	get inputSLAPolicy(): Locator {
		return this.root.getByRole('button', { name: 'SLA Policy' });
	}

	async selectTag(name: string): Promise<void> {
		await this.root.getByRole('option', { name, exact: true }).click();
	}

	async selectSLA(name: string): Promise<void> {
		await this.inputSLAPolicy.click();
		await this.listbox.selectOption(name);
	}

	get inputTags(): Locator {
		return this.root.getByRole('textbox', { name: 'Select an option' });
	}
}
