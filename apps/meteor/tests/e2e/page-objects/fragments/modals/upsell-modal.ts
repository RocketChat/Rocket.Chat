import type { Page } from '@playwright/test';

import { Modal } from './modal';

export class VoiceCallsUpsellModal extends Modal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Team voice calls' }));
	}
}
