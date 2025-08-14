import type { Locator } from '@playwright/test';

import { OmnichannelAdministration } from './omnichannel-administration';

export class OmnichannelLivechatAppearance extends OmnichannelAdministration {
	get inputHideSystemMessages(): Locator {
		return this.page.locator('[name="Livechat_hide_system_messages"]');
	}

	get inputLivechatBackground(): Locator {
		return this.page.locator('[name="Livechat_background"]');
	}

	get inputLivechatTitle(): Locator {
		return this.page.locator('[name="Livechat_title"]');
	}

	get inputHideExpandChat(): Locator {
		return this.page.getByRole('checkbox', { name: 'Hide "Expand chat"' });
	}

	get labelHideExpandChat(): Locator {
		return this.page.locator('label', { has: this.inputHideExpandChat });
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
