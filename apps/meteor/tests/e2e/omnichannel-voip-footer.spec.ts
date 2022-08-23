import type { Page } from '@playwright/test';

import { test, expect } from './utils/test';
import { OmnichannelDialpadModal, OmnichannelVoipFooter, OmnichannelSection } from './page-objects';
import { createAuxContext } from './utils';
import { createToken } from '../../client/lib/utils/createToken';
// import { IS_EE } from './config/constants';

type PageObjects = {
	page: Page;
	omncSection: OmnichannelSection;
	dialpadModal: OmnichannelDialpadModal;
	voipFooter: OmnichannelVoipFooter;
};

const createPageObjects = (page: Page) => ({
	page,
	omncSection: new OmnichannelSection(page),
	dialpadModal: new OmnichannelDialpadModal(page),
	voipFooter: new OmnichannelVoipFooter(page),
});

test.skip(true /* IS_EE */, 'Omnichannel Voip Footer > Enterprise Only');

test.use({ storageState: 'admin-session.json' });

test.describe('Omnichannel VoIP Footer', () => {
	let admin: PageObjects;
	let user: PageObjects;

	test.beforeAll(async ({ api }) => {
		// Enable Omnichannel
		await api.post('/method.call/saveSettings', {
			message: JSON.stringify({
				msg: 'method',
				id: '67',
				method: 'saveSettings',
				params: [
					[{ _id: 'Livechat_enabled', value: true }],
					{
						twoFactorCode: 'b6769a5ae0a6071ecabbe868dbdfa925f856c2bb3d910f93cb39479c64ca221e',
						twoFactorMethod: 'password',
					},
				],
			}),
		});

		// Configure VoIP
		await api.post('/method.call/saveSettings', {
			message: JSON.stringify({
				msg: 'method',
				id: '84',
				method: 'saveSettings',
				params: [
					[
						{ _id: 'VoIP_Enabled', value: true },
						{ _id: 'VoIP_Management_Server_Host', value: 'omni-asterisk.dev.rocket.chat' },
						{ _id: 'VoIP_Management_Server_Port', value: 5038 },
						{ _id: 'VoIP_Management_Server_Name', value: 'OminiAsterisk' },
						{ _id: 'VoIP_Management_Server_Username', value: 'sales.rocket.chat' },
						{ _id: 'VoIP_Management_Server_Password', value: 'rocket@123' },
						{ _id: 'VoIP_Server_Name', value: 'OmniAsterisk' },
						{ _id: 'VoIP_Server_Websocket_Path', value: 'wss://omni-asterisk.dev.rocket.chat/ws' },
					],
					{
						twoFactorCode: 'b6769a5ae0a6071ecabbe868dbdfa925f856c2bb3d910f93cb39479c64ca221e',
						twoFactorMethod: 'password',
					},
				],
			}),
		});

		// Add agent
		await Promise.all([
			api.post('/livechat/users/agent', { username: 'rocketchat.internal.admin.test' }),
			api.post('/livechat/users/agent', { username: 'user1' }),
		]);

		// Add agent to extension and as a contact
		await Promise.all([
			api.post('/omnichannel/agent/extension', { username: 'rocketchat.internal.admin.test', extension: '80018' }),
			api.post('/omnichannel/agent/extension', { username: 'user1', extension: '80017' }),
			api.post('/omnichannel/contact', {
				name: 'Test User One',
				phone: '80017',
				email: '',
				customFields: {},
				token: createToken(),
			}),
		]);
	});

	test.beforeAll(async ({ browser }) => {
		const { page } = await createAuxContext(browser, 'user1-session.json');
		user = createPageObjects(page);

		await expect(user.omncSection.element).toBeVisible({ timeout: 10000 });

		if (await page.isVisible('[data-qa-id="deviceManagementFeatureModal"]')) {
			await page.locator('[data-qa-id="deviceManagementFeatureModal"] button >> text="Got it"').click();
		}

		await expect(user.omncSection.btnVoipToggle).toBeEnabled();
		await page.waitForTimeout(2000);
		await user.omncSection.btnVoipToggle.click();
		await expect(user.omncSection.btnVoipToggle).toHaveAttribute('aria-checked', 'true');
	});

	test.afterAll(async ({ api }) => {
		// Remove users from extensions
		await Promise.all([
			api.delete(`/omnichannel/agent/extension/user1`),
			api.delete(`/omnichannel/agent/extension/rocketchat.internal.admin.test`),
		]);

		// Remove users from extensions
		await Promise.all([api.delete('/livechat/users/agent/user1'), api.delete('/livechat/users/agent/rocketchat.internal.admin.test')]);
	});

	test.beforeEach(async ({ page }) => {
		admin = createPageObjects(page);
		await page.goto('/home');
	});

	test.beforeEach(async () => {
		const { page, omncSection } = admin;

		// Enable voip
		await expect(omncSection.element).toBeVisible({ timeout: 10000 });

		// Close feature modal
		if (await page.isVisible('[data-qa-id="deviceManagementFeatureModal"]')) {
			await page.locator('[data-qa-id="deviceManagementFeatureModal"] button >> text="Got it"').click();
		}

		await expect(omncSection.btnVoipToggle).toBeEnabled();
		await page.waitForTimeout(2000);
		await admin.omncSection.btnVoipToggle.click();
		await expect(omncSection.btnVoipToggle).toHaveAttribute('aria-checked', 'true');
	});

	test('VoIP call identification', async () => {
		await test.step('expect voip footer to identify known contact', async () => {
			const { omncSection, dialpadModal, voipFooter } = admin;

			// Open dialpad modal
			await expect(omncSection.btnDialpad).toBeEnabled();
			await omncSection.btnDialpad.click();

			// Dial number and call
			await expect(dialpadModal.element).toBeVisible();
			await dialpadModal.inputPhoneNumber.type('80017');
			await expect(dialpadModal.btnCall).toBeEnabled();
			await dialpadModal.btnCall.click();

			// Check if contact name is there
			await expect(voipFooter.element).toBeVisible({ timeout: 10000 });
			await expect(voipFooter.textTitle).toHaveText('Test User One');

			// Reject the call
			await voipFooter.btnEndCall.click();
		});

		await test.step('expect voip footer to fallback to phone number for unknown contact', async () => {
			const { omncSection, dialpadModal, voipFooter } = user;

			// Open dialpad modal
			await expect(omncSection.btnDialpad).toBeEnabled();
			await omncSection.btnDialpad.click();

			// Dial number and call
			await expect(dialpadModal.element).toBeVisible();
			await dialpadModal.inputPhoneNumber.type('80018');
			await expect(dialpadModal.btnCall).toBeEnabled();
			await dialpadModal.btnCall.click();

			// Check if contact name is there
			await voipFooter.element.waitFor();
			await expect(voipFooter.element).toBeVisible({ timeout: 10000 });
			await expect(voipFooter.textTitle).toHaveText('80018');

			// Reject the call
			await voipFooter.btnEndCall.click();
		});
	});
});
