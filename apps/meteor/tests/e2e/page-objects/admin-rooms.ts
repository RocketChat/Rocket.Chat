import type { Locator, Page } from '@playwright/test';

import { Admin, AdminSectionsHref } from './admin';
import { EditAdminRoomFlexTab } from './fragments/flextabs';

export class AdminRooms extends Admin {
	readonly editRoom: EditAdminRoomFlexTab;

	constructor(page: Page) {
		super(page);
		this.editRoom = new EditAdminRoomFlexTab(page.getByRole('dialog', { name: 'Room Information' }));
	}

	protected readonly route = AdminSectionsHref.rooms;

	protected readonly title = 'Rooms';

	get inputSearchRooms(): Locator {
		return this.pageContent.getByPlaceholder('Search rooms');
	}

	getRoomRow(name?: string): Locator {
		return this.pageContent.getByRole('link', { name });
	}

	get btnEdit(): Locator {
		return this.pageContent.getByRole('button', { name: 'Edit' });
	}

	dropdownFilterRoomType(text = 'All rooms'): Locator {
		return this.pageContent.getByRole('button', { name: text });
	}
}
