import fs from 'fs';
import path from 'path';

import { expect, test } from '@playwright/test';

const packageDir = process.env.PACKAGE_DIR ?? process.cwd();

const storybookStaticDir = path.join(packageDir, 'storybook-static') ?? path.join(process.cwd(), 'storybook-static');

const storybook = JSON.parse(fs.readFileSync(path.join(storybookStaticDir, 'index.json'), 'utf-8'));

// Only run tests on stories, not other documentation pages.
const stories = Object.values(storybook.entries).filter((e: any) => e.type === 'story');

for (const story of stories as any[]) {
	test(`${story.title} ${story.name} should not have visual regressions`, async ({ page }) => {
		const params = new URLSearchParams({
			id: story.id,
			viewMode: 'story',
		});

		await page.goto(`/iframe.html?${params.toString()}`, {
			waitUntil: 'domcontentloaded',
		});

		await page.evaluate(() => document.fonts.ready);

		const storybookRoot = page.locator('#storybook-root');
		await storybookRoot.waitFor({ state: 'visible' });

		await expect(page).toHaveScreenshot(`${story.id}.png`, {
			fullPage: true,
			animations: 'disabled',
		});
	});
}
