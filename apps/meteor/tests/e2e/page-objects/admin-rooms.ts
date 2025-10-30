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
		return this.page.locator('input[placeholder="Search rooms"]');
	}

	getRoomRow(name?: string): Locator {
		return this.page.locator('[role="link"]', { hasText: name });
	}

	get btnEdit(): Locator {
		return this.page.locator('button >> text="Edit"');
	}

	async dropdownFilterRoomType(text = 'All rooms'): Promise<Locator> {
		return this.page.locator(`div[role="button"]:has-text("${text}")`);
	}
}
