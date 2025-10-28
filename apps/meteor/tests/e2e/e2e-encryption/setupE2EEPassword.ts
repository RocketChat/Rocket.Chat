import type { Page } from '@playwright/test';

import { SaveE2EEPasswordBanner, SaveE2EEPasswordModal } from '../page-objects/fragments/e2ee';

/**
 * Click the banner to open the dialog to save the generated password
 */
export const setupE2EEPassword = async (page: Page) => {
	const saveE2EEPasswordBanner = new SaveE2EEPasswordBanner(page);
	const saveE2EEPasswordModal = new SaveE2EEPasswordModal(page);

	await saveE2EEPasswordBanner.click();
	const password = await saveE2EEPasswordModal.getPassword();
	await saveE2EEPasswordModal.confirm();
	await saveE2EEPasswordBanner.waitForDisappearance();

	return password;
};
