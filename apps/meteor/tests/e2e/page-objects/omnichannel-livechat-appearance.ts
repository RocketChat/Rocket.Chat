import type { Locator } from '@playwright/test';

import { OmnichannelAdministration } from './omnichannel-administration';

export class OmnichannelLivechatAppearance extends OmnichannelAdministration {
	get inputHideSystemMessages(): Locator {
		return this.page.locator('[name="Livechat_hide_system_messages"]');
	}

	get inputLivechatBackground(): Locator {
		return this.page.locator('[name="Livechat_background"]');
	}

	findHideSystemMessageOption(option: string): Locator {
		return this.page.locator(`[role="option"][value="${option}"]`);
	}

	get btnSave(): Locator {
		return this.page.locator('role=button[name="Save changes"]');
	}

	get btnCancel(): Locator {
		return this.page.locator('role=button[name="Cancel"]');
	}
}
