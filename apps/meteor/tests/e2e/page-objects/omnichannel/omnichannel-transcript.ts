import type { Locator } from '@playwright/test';

import { OmnichannelAdmin } from './omnichannel-admin';

export class OmnichannelTranscript extends OmnichannelAdmin {
	get contactCenterChats(): Locator {
		return this.page.locator('//button[contains(.,"Chats")]');
	}

	get contactCenterSearch(): Locator {
		return this.page.locator('[placeholder="Search"]');
	}

	get firstRow(): Locator {
		return this.page.locator('//tr[1]//td[1]');
	}

	get btnOpenChat(): Locator {
		return this.page.getByRole('dialog').getByRole('button', { name: 'Open chat', exact: true });
	}

	get DownloadedPDF(): Locator {
		return this.page.locator('[data-qa-type="attachment-title-link"]').last();
	}
}
