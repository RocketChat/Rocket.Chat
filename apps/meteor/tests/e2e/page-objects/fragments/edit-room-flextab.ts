import type { Locator, Page } from '@playwright/test';

import { FlexTab } from './flextab';
import { Listbox } from './listbox';

export class EditRoomFlexTab extends FlexTab {
	constructor(locator: Locator) {
		super(locator);
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
	private readonly tagsListbox: Listbox;

	private readonly slaListbox: Listbox;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Edit Room' }));
		this.tagsListbox = new Listbox(page);
		this.slaListbox = new Listbox(page, 'SLA Policy');
	}

	get inputTopic(): Locator {
		return this.root.getByRole('textbox', { name: 'Topic', exact: true });
	}

	get inputSLAPolicy(): Locator {
		return this.root.getByRole('button', { name: 'SLA Policy', exact: true });
	}

	optionTag(name: string): Locator {
		return this.tagsListbox.getOption(name);
	}

	async selectTag(name: string) {
		await this.tagsListbox.selectOption(name);
	}

	async selectSLA(name: string) {
		await this.inputSLAPolicy.click();
		await this.slaListbox.selectOption(name, true);
	}

	get inputTags(): Locator {
		return this.root.getByRole('textbox', { name: 'Select an option' });
	}
}
