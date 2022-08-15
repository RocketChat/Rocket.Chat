import { test, expect } from './utils/test';
import {Omni}

test.use({ storageState: 'admin-session.json' });

test.describe.serial('omnichannel-canned-responses', () => {
	let sidenav: OmnichannelSidenav;

	test.beforeEach(async ({ page }) => {
		sidenav = new OmnichannelSidenav(page);

		await page.goto('/omnichannel');
		await sidenav.linkAgents.click();
	});

	test('expect to create new canned response ', async () => {
		await
	});


});
