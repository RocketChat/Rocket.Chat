import type { Locator, Page } from '@playwright/test';

import { HomeOmnichannelContent } from '../../fragments';
import { OmnichannelAdmin } from '../omnichannel-admin';

export abstract class OmnichannelContactCenter extends OmnichannelAdmin {
	readonly content: HomeOmnichannelContent;

	constructor(page: Page) {
		super(page);
		this.content = new HomeOmnichannelContent(page);
	}

	get tabContacts(): Locator {
		return this.page.locator('role=tab[name="Contacts"]');
	}

	get btnFilters(): Locator {
		return this.page.getByRole('button', { name: 'Filters' });
	}
}
