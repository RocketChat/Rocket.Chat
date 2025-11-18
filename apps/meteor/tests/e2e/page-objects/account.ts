import type { Page } from '@playwright/test';

import { ToastMessages } from './fragments';

export abstract class Account {
	readonly toastMessage: ToastMessages;

	constructor(protected page: Page) {
		this.toastMessage = new ToastMessages(page);
	}
}
