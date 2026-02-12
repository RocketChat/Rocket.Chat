import type { Locator, Page } from '@playwright/test';

import { FlexTab } from './flextab';

export class RoomInfoFlexTab extends FlexTab {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Room Information' }));
	}

	get btnEdit(): Locator {
		return this.root.getByRole('button', { name: 'Edit' });
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
