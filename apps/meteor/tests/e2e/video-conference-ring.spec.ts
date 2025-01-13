import type { Page } from '@playwright/test';

import { IS_EE } from './config/constants';
import { createAuxContext } from './fixtures/createAuxContext';
import { Users } from './fixtures/userStates';
import { HomeChannel, AccountProfile } from './page-objects';
import { expect, test } from './utils/test';

test.use({ storageState: Users.user1.state });

test.describe('video conference ringing', () => {
	let poHomeChannel: HomeChannel;
	let poAccountProfile: AccountProfile;

	// test.skip(!IS_EE, 'Enterprise Only');

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		poAccountProfile = new AccountProfile(page);

		await page.goto('/home');
	});

	let auxContext: { page: Page; poHomeChannel: HomeChannel; poAccountProfile: AccountProfile };
	test.beforeEach(async ({ browser }) => {
		const { page } = await createAuxContext(browser, Users.user2);
		auxContext = { page, poHomeChannel: new HomeChannel(page), poAccountProfile: new AccountProfile(page) };
	});

	test.afterEach(async () => {
		await auxContext.page.close();
	});

	test('expect is ringing in direct', async () => {
		await poHomeChannel.sidenav.openChat('user2');

		await auxContext.poHomeChannel.sidenav.openChat('user1');
		await poHomeChannel.content.btnCall.click();
		await poHomeChannel.content.menuItemVideoCall.click();
		await poHomeChannel.content.btnStartVideoCall.click();

		await expect(poHomeChannel.content.videoConfRingCallText('Calling')).toBeVisible();
		await expect(auxContext.poHomeChannel.content.videoConfRingCallText('Incoming call from')).toBeVisible();

		await auxContext.poHomeChannel.content.btnDeclineVideoCall.click();

		await auxContext.page.close();
	});

	test('expect call to be ringing/dialing according to volume preference', async ({ page }) => {
		await poHomeChannel.sidenav.userProfileMenu.click();
		await poHomeChannel.sidenav.accountPreferencesOption.click();

		await poAccountProfile.preferencesSoundAccordionOption.click();
		await poAccountProfile.preferencesCallRingerVolumeSlider.fill('50');

		await poAccountProfile.preferencesBtnSubmit.click();
		await poAccountProfile.btnClose.click();

		await auxContext.poHomeChannel.sidenav.userProfileMenu.click();
		await auxContext.poHomeChannel.sidenav.accountPreferencesOption.click();

		await auxContext.poAccountProfile.preferencesSoundAccordionOption.click();
		await auxContext.poAccountProfile.preferencesCallRingerVolumeSlider.fill('25');

		await auxContext.poAccountProfile.preferencesBtnSubmit.click();
		await auxContext.poAccountProfile.btnClose.click();

		await poHomeChannel.sidenav.openChat('user2');
		await auxContext.poHomeChannel.sidenav.openChat('user1');

		await poHomeChannel.content.btnCall.click();
		await poHomeChannel.content.menuItemVideoCall.click();
		await poHomeChannel.content.btnStartVideoCall.click();

		console.log(
			await poHomeChannel.videoConfRingtoneVolume.evaluate((el: HTMLAudioElement) => ({
				volume: el.volume,
				currentTime: el.currentTime,
				duration: el.duration,
				paused: el.paused,
				muted: el.muted,
				src: el.src,
				readyState: el.readyState,
				networkState: el.networkState,
			})),
		);
	});
});
