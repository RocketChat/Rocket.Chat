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

	test.skip(!IS_EE, 'Enterprise Only');

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

	test('should show call is ringing in direct', async () => {
		await poHomeChannel.sidenav.openChat('user2');

		await auxContext.poHomeChannel.sidenav.openChat('user1');
		await poHomeChannel.content.btnCall.click();
		await poHomeChannel.content.menuItemVideoCall.click();
		await poHomeChannel.content.btnStartVideoCall.click();

		await expect(poHomeChannel.content.videoConfRingCallText('Calling')).toBeVisible();
		await expect(auxContext.poHomeChannel.content.videoConfRingCallText('Incoming call from')).toBeVisible();

		await auxContext.poHomeChannel.content.btnDeclineVideoCall.click();
	});

	const changeCallRingerVolumeFromHome = async (poHomeChannel: HomeChannel, poAccountProfile: AccountProfile, volume: string) => {
		await poHomeChannel.sidenav.userProfileMenu.click();
		await poHomeChannel.sidenav.accountPreferencesOption.click();

		await poAccountProfile.preferencesSoundAccordionOption.click();
		await poAccountProfile.preferencesCallRingerVolumeSlider.fill(volume);

		await poAccountProfile.btnSaveChanges.click();
		await poAccountProfile.btnClose.click();
	};

	test('should be ringing/dialing according to volume preference', async () => {
		await changeCallRingerVolumeFromHome(poHomeChannel, poAccountProfile, '50');
		await changeCallRingerVolumeFromHome(auxContext.poHomeChannel, auxContext.poAccountProfile, '25');

		await poHomeChannel.sidenav.openChat('user2');
		await auxContext.poHomeChannel.sidenav.openChat('user1');

		await poHomeChannel.content.btnCall.click();
		await poHomeChannel.content.menuItemVideoCall.click();
		await poHomeChannel.content.btnStartVideoCall.click();

		await expect(auxContext.poHomeChannel.content.getIncomingCallByName('user1')).toBeVisible();

		const dialToneVolume = await poHomeChannel.audioVideoConfDialtone.evaluate((el: HTMLAudioElement) => el.volume);
		const ringToneVolume = await auxContext.poHomeChannel.audioVideoConfRingtone.evaluate((el: HTMLAudioElement) => el.volume);

		expect(dialToneVolume).toBe(0.5);
		expect(ringToneVolume).toBe(0.25);

		await auxContext.poHomeChannel.content.btnDeclineVideoCall.click();
		await changeCallRingerVolumeFromHome(poHomeChannel, poAccountProfile, '100');
		await changeCallRingerVolumeFromHome(auxContext.poHomeChannel, auxContext.poAccountProfile, '100');
	});
});
