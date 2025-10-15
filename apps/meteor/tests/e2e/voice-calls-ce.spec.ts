import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createDirectMessage } from './utils';
import { expect, test } from './utils/test';

test.use({ storageState: Users.user1.state });

test.describe('Voice Calls - Community Edition', () => {
	let poHomeChannel: HomeChannel;

	test.beforeAll(async ({ api }) => {
		await createDirectMessage(api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await page.goto('/home');
	});

	test('should see upsell modal when clicked on DM > voice call button', async () => {
		await test.step('should open direct message with user2', async () => {
			await poHomeChannel.sidenav.openChat('user2');
			await expect(poHomeChannel.content.inputMessage).toBeVisible();
		});

		await test.step('should click voice call from room toolbar and see upsell modal', async () => {
			await poHomeChannel.content.btnVoiceCall.click();
			await expect(poHomeChannel.content.modalUpsellVoiceCalls).toBeVisible();
		});
	});

	test('should see upsell modal when clicked on user info > voice call button', async () => {
		await test.step('should open direct message with user2', async () => {
			await poHomeChannel.sidenav.openChat('user2');
			await expect(poHomeChannel.content.inputMessage).toBeVisible();
		});

		await test.step('should click voice call from contact information and see upsell modal', async () => {
			await poHomeChannel.content.btnContactInformation.click();
			await poHomeChannel.content.btnContactInfoVoiceCall.click();
			await expect(poHomeChannel.content.modalUpsellVoiceCalls).toBeVisible();
		});
	});

	test('should see upsell modal when clicked on User menu > New voice call', async () => {
		await test.step('should open user menu', async () => {
			await poHomeChannel.sidenav.btnUserProfileMenu.click();
			await poHomeChannel.sidenav.getUserProfileMenuOption('New voice call').click();
		});

		await test.step('should see upsell modal', async () => {
			await expect(poHomeChannel.content.modalUpsellVoiceCalls).toBeVisible();
		});
	});
});
