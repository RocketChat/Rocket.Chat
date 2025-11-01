import type { Locator, Page } from '@playwright/test';

import { Admin } from './admin';
import { EditRoomFlexTab } from './fragments/edit-room-flextab';

export class AdminRooms extends Admin {
	readonly editRoom: EditRoomFlexTab;

	constructor(page: Page) {
		super(page);
		this.editRoom = new EditRoomFlexTab(page);
	}

	get inputSearchRooms(): Locator {
		return this.page.getByPlaceholder('Search rooms');
	}

	getRoomRow(name?: string): Locator {
		return this.page.getByRole('link', { name });
	}

	get btnEdit(): Locator {
		return this.page.getByRole('button', { name: 'Edit' });
	}

	dropdownFilterRoomType(text = 'All rooms'): Locator {
		return this.page.getByRole('button', { name: text });
	}
}
