import type { Page } from '@playwright/test';

import { RoomInfoFlexTab } from './fragments';
import { HomeChannel } from './home-channel';

export class HomeDiscussion extends HomeChannel {
	constructor(page: Page) {
		super(page);
		this.tabs.room = new RoomInfoFlexTab(page.getByRole('dialog', { name: 'Discussion Info' }), page);
	}
}
