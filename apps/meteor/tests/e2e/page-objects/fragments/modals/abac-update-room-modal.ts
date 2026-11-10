import type { Page } from '@playwright/test';

import { Modal } from './modal';

export class ABACUpdateRoomModal extends Modal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Update ABAC room' }));
	}
}
