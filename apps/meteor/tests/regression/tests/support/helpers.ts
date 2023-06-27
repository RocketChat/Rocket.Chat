import { Page } from '@playwright/test';

export function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

export async function fileUpload(
  buttonName: string,
  filePath: string,
  page: Page
) {
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: buttonName }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(filePath);
}
