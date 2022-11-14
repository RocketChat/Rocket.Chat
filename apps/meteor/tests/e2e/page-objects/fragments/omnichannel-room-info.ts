import type { Locator, Page } from '@playwright/test';

import { OmnichannelEditRoomInfo } from './omnichannel-edit-room-info';

export class OmnichannelRoomInfo {
	private readonly page: Page;

	readonly edit: OmnichannelEditRoomInfo;

	constructor(page: Page) {
		this.page = page;
		this.edit = new OmnichannelEditRoomInfo(this.page);
	}

	get topic(): Locator {
		return this.page.locator('div:has-text("Topic")~span');
	}

	get agentFieldUsername(): Locator {
		return this.page.locator('[data-qa-id="agent-info-details-username"]').last();
	}

	get departmentFieldName(): Locator {
		return this.page.locator('[data-qa-id="department-field-name"]');
	}

	get btnEdit(): Locator {
		return this.page.locator('button:has-text("Edit")');
	}
}
