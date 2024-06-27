import type { Page } from '@playwright/test';

export async function fileUpload(buttonName: string, filePath: string, page: Page) {
	const fileChooserPromise = page.waitForEvent('filechooser');
	await page.getByRole('button', { name: buttonName }).click();
	const fileChooser = await fileChooserPromise;
	await fileChooser.setFiles(filePath);
}
