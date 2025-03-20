import type { Locator } from '@playwright/test';

import { OmnichannelAdministration } from './omnichannel-administration';

export class OmnichannelCannedResponses extends OmnichannelAdministration {
	get radioPublic(): Locator {
		return this.page.locator('[data-qa-id="canned-response-public-radio"]').first();
	}

	get btnNew(): Locator {
		return this.page.locator('role=button[name="Create canned response"]').first();
	}
}
