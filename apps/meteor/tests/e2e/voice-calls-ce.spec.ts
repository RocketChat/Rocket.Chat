import { IS_EE } from './config/constants';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { VoiceCallsUpsellModal } from './page-objects/fragments/modals';
import { expect, test } from './utils/test';

test.use({ storageState: Users.user1.state });

test.describe('Voice Calls - Community Edition', () => {
	test.skip(IS_EE, 'Community Edition Only');
	let poHomeChannel: HomeChannel;
	let upsellVoiceCallsModal: VoiceCallsUpsellModal;

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		upsellVoiceCallsModal = new VoiceCallsUpsellModal(page);
		await page.goto('/home');
	});

	test('should see upsell modal when clicked on DM > voice call button', async () => {
		await test.step('should open direct message with user2', async () => {
			await poHomeChannel.navbar.openChat('user2');
			await expect(poHomeChannel.content.inputMessage).toBeVisible();
		});

		await test.step('should click voice call from room toolbar and see upsell modal', async () => {
			await poHomeChannel.content.btnVoiceCall.click();
			await upsellVoiceCallsModal.waitForDisplay();
		});
	});

	test('should see upsell modal when clicked on user info > voice call button', async () => {
		await test.step('should open direct message with user2', async () => {
			await poHomeChannel.navbar.openChat('user2');
			await expect(poHomeChannel.content.inputMessage).toBeVisible();
		});

		await test.step('should click voice call from contact information and see upsell modal', async () => {
			await poHomeChannel.content.btnContactInformation.click();
			await poHomeChannel.content.btnContactInfoVoiceCall.click();
			await upsellVoiceCallsModal.waitForDisplay();
		});
	});

	test('should see upsell modal when clicked on User menu > New voice call', async () => {
		await test.step('should open user menu', async () => {
			await poHomeChannel.navbar.btnNewVoiceCall.click();
		});

		await test.step('should see upsell modal', async () => {
			await upsellVoiceCallsModal.waitForDisplay();
		});

		await test.step('should close upsell modal', async () => {
			await upsellVoiceCallsModal.close();
		});
	});
});
