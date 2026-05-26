import type { Locator, Page } from '@playwright/test';

import { Admin } from './admin';
import { EditAdminRoomFlexTab } from './fragments/flextabs';

export class AdminRooms extends Admin {
	readonly editRoom: EditAdminRoomFlexTab;

	constructor(page: Page) {
		super(page);
		this.editRoom = new EditAdminRoomFlexTab(page.getByRole('dialog', { name: 'Room Information' }));
	}

	get adminPageContent(): Locator {
		return this.page.getByRole('main').filter({ has: this.page.getByRole('heading', { name: 'Rooms' }) });
	}

	get inputSearchRooms(): Locator {
		return this.adminPageContent.getByPlaceholder('Search rooms');
	}

	getRoomRow(name?: string): Locator {
		return this.adminPageContent.getByRole('link', { name });
	}

	get btnEdit(): Locator {
		return this.adminPageContent.getByRole('button', { name: 'Edit' });
	}

	dropdownFilterRoomType(text = 'All rooms'): Locator {
		return this.adminPageContent.getByRole('button', { name: text });
	}
}
