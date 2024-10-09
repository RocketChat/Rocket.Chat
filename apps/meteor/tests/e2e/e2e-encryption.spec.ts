import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { BASE_API_URL } from './config/constants';
import { createAuxContext } from './fixtures/createAuxContext';
import injectInitialData from './fixtures/inject-initial-data';
import { Users, storeState, restoreState } from './fixtures/userStates';
import { AccountProfile, HomeChannel } from './page-objects';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('e2e-encryption initial setup', () => {
	let poAccountProfile: AccountProfile;
	let poHomeChannel: HomeChannel;
	let password: string;

	test.beforeEach(async ({ page }) => {
		poAccountProfile = new AccountProfile(page);
		poHomeChannel = new HomeChannel(page);

		await page.goto('/account/security');
	});

	test.beforeAll(async ({ api }) => {
		const statusCode = (await api.post('/settings/E2E_Enable', { value: true })).status();

		expect(statusCode).toBe(200);
	});

	test.afterAll(async ({ api }) => {
		const statusCode = (await api.post('/settings/E2E_Enable', { value: false })).status();

		expect(statusCode).toBe(200);
	});

	test.afterEach(async ({ api }) => {
		await api.recreateContext();
	});

	test("expect reset user's e2e encryption key", async ({ page }) => {
		// Reset key to start the flow from the beginning
		// It will execute a logout
		await poAccountProfile.securityE2EEncryptionSection.click();
		await poAccountProfile.securityE2EEncryptionResetKeyButton.click();

		await page.locator('role=button[name="Login"]').waitFor();

		await injectInitialData();

		// Login again, check the banner to save the generated password and test it
		await restoreState(page, Users.admin);

		await page.locator('role=banner >> text="Save your encryption password"').click();

		password = (await page.evaluate(() => localStorage.getItem('e2e.randomPassword'))) || 'undefined';

		await expect(page.locator('#modal-root')).toContainText(password);

		await page.locator('#modal-root .rcx-button-group--align-end .rcx-button--primary').click();

		await expect(page.locator('role=banner >> text="Save your encryption password"')).not.toBeVisible();

		await poHomeChannel.sidenav.logout();

		await page.locator('role=button[name="Login"]').waitFor();

		await injectInitialData();

		await restoreState(page, Users.admin);

		await page.locator('role=banner >> text="Enter your E2E password"').click();

		await page.locator('#modal-root input').fill(password);

		await page.locator('#modal-root .rcx-button--primary').click();

		await expect(page.locator('role=banner >> text="Enter your E2E password"')).not.toBeVisible();

		await storeState(page, Users.admin);
	});

	test('expect change the e2ee password', async ({ page }) => {
		// Change the password to a new one and test it
		const newPassword = 'new password';

		await restoreState(page, Users.admin);

		await poAccountProfile.securityE2EEncryptionSection.click();
		await poAccountProfile.securityE2EEncryptionPassword.click();
		await poAccountProfile.securityE2EEncryptionPassword.fill(newPassword);
		await poAccountProfile.securityE2EEncryptionPasswordConfirmation.fill(newPassword);
		await poAccountProfile.securityE2EEncryptionSavePasswordButton.click();

		await poAccountProfile.btnClose.click();

		await poHomeChannel.sidenav.logout();

		await page.locator('role=button[name="Login"]').waitFor();

		await injectInitialData();

		await restoreState(page, Users.admin, { except: ['public_key', 'private_key'] });

		await page.locator('role=banner >> text="Enter your E2E password"').click();

		await page.locator('#modal-root input').fill(password);

		await page.locator('#modal-root .rcx-button--primary').click();

		await page.locator('role=banner >> text="Wasn\'t possible to decode your encryption key to be imported."').click();

		await page.locator('#modal-root input').fill(newPassword);

		await page.locator('#modal-root .rcx-button--primary').click();

		await expect(page.locator('role=banner >> text="Wasn\'t possible to decode your encryption key to be imported."')).not.toBeVisible();
		await expect(page.locator('role=banner >> text="Enter your E2E password"')).not.toBeVisible();
	});
});

test.describe.serial('e2e-encryption', () => {
	let poHomeChannel: HomeChannel;

	test.beforeEach(async ({ page, api }) => {
		const statusCode = (await api.post('/settings/E2E_Enable', { value: true })).status();

		expect(statusCode).toBe(200);

		poHomeChannel = new HomeChannel(page);
		await page.goto('/home');
	});

	test.beforeAll(async ({ api }) => {
		expect((await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: true })).status()).toBe(200);
		expect((await api.post('/settings/E2E_Enabled_Mentions', { value: true })).status()).toBe(200);
	});

	test.afterAll(async ({ api }) => {
		expect((await api.post('/settings/E2E_Enable', { value: false })).status()).toBe(200);
		expect((await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: false })).status()).toBe(200);
		expect((await api.post('/settings/E2E_Enabled_Mentions', { value: false })).status()).toBe(200);
	});

	test('expect create a private channel encrypted and send an encrypted message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await poHomeChannel.dismissToast();

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('hello world');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();

		await poHomeChannel.tabs.kebab.click({ force: true });

		await expect(poHomeChannel.tabs.btnDisableE2E).toBeVisible();
		await poHomeChannel.tabs.btnDisableE2E.click({ force: true });
		await poHomeChannel.dismissToast();
		await page.waitForTimeout(1000);

		await poHomeChannel.content.sendMessage('hello world not encrypted');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world not encrypted');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).not.toBeVisible();

		await poHomeChannel.tabs.kebab.click({ force: true });
		await expect(poHomeChannel.tabs.btnEnableE2E).toBeVisible();
		await poHomeChannel.tabs.btnEnableE2E.click({ force: true });
		await poHomeChannel.dismissToast();
		await page.waitForTimeout(1000);

		await poHomeChannel.content.sendMessage('hello world encrypted again');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world encrypted again');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
	});

	test('expect create a private encrypted channel and send a encrypted thread message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await poHomeChannel.dismissToast();

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('This is the thread main message.');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('This is the thread main message.');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();

		await page.locator('[data-qa-type="message"]').last().hover();
		await page.locator('role=button[name="Reply in thread"]').click();

		await expect(page).toHaveURL(/.*thread/);

		await expect(poHomeChannel.content.mainThreadMessageText).toContainText('This is the thread main message.');
		await expect(poHomeChannel.content.mainThreadMessageText.locator('.rcx-icon--name-key')).toBeVisible();

		await poHomeChannel.content.toggleAlsoSendThreadToChannel(true);
		await page.getByRole('dialog').locator('[name="msg"]').last().fill('This is an encrypted thread message also sent in channel');
		await page.keyboard.press('Enter');
		await expect(poHomeChannel.content.lastThreadMessageText).toContainText('This is an encrypted thread message also sent in channel');
		await expect(poHomeChannel.content.lastThreadMessageText.locator('.rcx-icon--name-key')).toBeVisible();
		await expect(poHomeChannel.content.lastUserMessage).toContainText('This is an encrypted thread message also sent in channel');
		await expect(poHomeChannel.content.mainThreadMessageText).toContainText('This is the thread main message.');
		await expect(poHomeChannel.content.mainThreadMessageText.locator('.rcx-icon--name-key')).toBeVisible();
	});

	test('expect create a private encrypted channel and check disabled message menu actions on an encrypted message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await poHomeChannel.dismissToast();

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('This is an encrypted message.');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('This is an encrypted message.');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();

		await page.locator('[data-qa-type="message"]').last().hover();
		await expect(page.locator('role=button[name="Forward message not available on encrypted content"]')).toBeDisabled();

		await poHomeChannel.content.openLastMessageMenu();

		await expect(page.locator('role=menuitem[name="Reply in direct message"]')).toHaveClass(/disabled/);
		await expect(page.locator('role=menuitem[name="Copy link"]')).toHaveClass(/disabled/);
	});

	test('expect create a private channel, encrypt it and send an encrypted message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.openNewByLabel('Channel');
		await poHomeChannel.sidenav.inputChannelName.fill(channelName);
		await poHomeChannel.sidenav.btnCreate.click();

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.toastSuccess).toBeVisible();

		await poHomeChannel.dismissToast();

		await poHomeChannel.tabs.kebab.click({ force: true });
		await expect(poHomeChannel.tabs.btnEnableE2E).toBeVisible();
		await poHomeChannel.tabs.btnEnableE2E.click({ force: true });
		await page.waitForTimeout(1000);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('hello world');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
	});

	test('expect create a encrypted private channel and mention user', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await poHomeChannel.dismissToast();

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('hello @user1');

		const userMention = await page.getByRole('button', {
			name: 'user1',
		});

		await expect(userMention).toBeVisible();
	});

	test('expect create a encrypted private channel, mention a channel and navigate to it', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await poHomeChannel.dismissToast();

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('Are you in the #general channel?');

		const channelMention = await page.getByRole('button', {
			name: 'general',
		});

		await expect(channelMention).toBeVisible();

		await channelMention.click();

		await expect(page).toHaveURL(`/channel/general`);
	});

	test('expect create a encrypted private channel, mention a channel and user', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await poHomeChannel.dismissToast();

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('Are you in the #general channel, @user1 ?');

		const channelMention = await page.getByRole('button', {
			name: 'general',
		});

		const userMention = await page.getByRole('button', {
			name: 'user1',
		});

		await expect(userMention).toBeVisible();
		await expect(channelMention).toBeVisible();
	});

	test('should encrypted field be available on edit room', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.openNewByLabel('Channel');
		await poHomeChannel.sidenav.inputChannelName.fill(channelName);
		await poHomeChannel.sidenav.btnCreate.click();

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.toastSuccess).toBeVisible();

		await poHomeChannel.dismissToast();

		await poHomeChannel.tabs.btnRoomInfo.click();
		await poHomeChannel.tabs.room.btnEdit.click();
		await poHomeChannel.tabs.room.advancedSettingsAccordion.click();

		await expect(poHomeChannel.tabs.room.checkboxEncrypted).toBeVisible();
	});

	test('expect create a Direct message, encrypt it and attempt to enable OTR', async ({ page }) => {
		await poHomeChannel.sidenav.openNewByLabel('Direct message');
		await poHomeChannel.sidenav.inputDirectUsername.click();
		await page.keyboard.type('user2');
		await page.waitForTimeout(1000);
		await page.keyboard.press('Enter');
		await poHomeChannel.sidenav.btnCreate.click();

		await expect(page).toHaveURL(`/direct/rocketchat.internal.admin.testuser2`);

		await poHomeChannel.tabs.kebab.click({ force: true });
		await expect(poHomeChannel.tabs.btnEnableE2E).toBeVisible();
		await poHomeChannel.tabs.btnEnableE2E.click({ force: true });
		await page.waitForTimeout(1000);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.dismissToast();

		await poHomeChannel.tabs.kebab.click({ force: true });
		await expect(poHomeChannel.tabs.btnEnableOTR).toBeVisible();
		await poHomeChannel.tabs.btnEnableOTR.click({ force: true });

		await expect(page.getByText('OTR not available')).toBeVisible();
	});

	test('expect placeholder text in place of encrypted message, when E2EE is not setup', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await poHomeChannel.dismissToast();

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('This is an encrypted message.');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('This is an encrypted message.');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();

		// Logout to remove e2ee keys
		await poHomeChannel.sidenav.logout();

		// Login again
		await page.locator('role=button[name="Login"]').waitFor();
		await injectInitialData();
		await restoreState(page, Users.admin, { except: ['private_key', 'public_key'] });

		await poHomeChannel.sidenav.openChat(channelName);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await expect(poHomeChannel.content.lastUserMessage).toContainText(
			'This message is end-to-end encrypted. To view it, you must enter your encryption key in your account settings.',
		);
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
	});

	test('expect placeholder text in place of encrypted file description, when E2EE is not setup and non-encrypted files upload in disabled e2ee room', async ({
		page,
	}) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.openNewByLabel('Channel');
		await poHomeChannel.sidenav.inputChannelName.fill(channelName);
		await poHomeChannel.sidenav.advancedSettingsAccordion.click();
		await poHomeChannel.sidenav.checkboxEncryption.click();
		await poHomeChannel.sidenav.btnCreate.click();

		await expect(page).toHaveURL(`/group/${channelName}`);

		await poHomeChannel.dismissToast();

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.dragAndDropTxtFile();
		await poHomeChannel.content.descriptionInput.fill('any_description');
		await poHomeChannel.content.fileNameInput.fill('any_file1.txt');
		await poHomeChannel.content.btnModalConfirm.click();

		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();

		await expect(poHomeChannel.content.getFileDescription).toHaveText('any_description');
		await expect(poHomeChannel.content.lastMessageFileName).toContainText('any_file1.txt');

		await test.step('disable E2EE in the room', async () => {
			await poHomeChannel.tabs.kebab.click();

			await expect(poHomeChannel.tabs.btnDisableE2E).toBeVisible();
			await poHomeChannel.tabs.btnDisableE2E.click();
			await poHomeChannel.dismissToast();
			// will wait till the key icon in header goes away
			await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toHaveCount(0);
		});

		await page.reload();

		await test.step('upload the file in disabled E2EE room', async () => {
			await expect(poHomeChannel.content.encryptedRoomHeaderIcon).not.toBeVisible();

			await poHomeChannel.content.dragAndDropTxtFile();
			await poHomeChannel.content.descriptionInput.fill('any_description');
			await poHomeChannel.content.fileNameInput.fill('any_file1.txt');
			await poHomeChannel.content.btnModalConfirm.click();

			await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).not.toBeVisible();

			await expect(poHomeChannel.content.getFileDescription).toHaveText('any_description');
			await expect(poHomeChannel.content.lastMessageFileName).toContainText('any_file1.txt');
		});

		await test.step('Enable E2EE in the room', async () => {
			await poHomeChannel.tabs.kebab.click();

			await expect(poHomeChannel.tabs.btnEnableE2E).toBeVisible();
			await poHomeChannel.tabs.btnEnableE2E.click();
			await poHomeChannel.dismissToast();
			// will wait till the key icon in header appears
			await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toHaveCount(1);
		});

		// Logout to remove e2ee keys
		await poHomeChannel.sidenav.logout();

		// Login again
		await page.locator('role=button[name="Login"]').waitFor();
		await injectInitialData();
		await restoreState(page, Users.admin, { except: ['private_key', 'public_key'] });

		await poHomeChannel.sidenav.openChat(channelName);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await expect(poHomeChannel.content.nthMessage(0)).toContainText(
			'This message is end-to-end encrypted. To view it, you must enter your encryption key in your account settings.',
		);
		await expect(poHomeChannel.content.nthMessage(0).locator('.rcx-icon--name-key')).toBeVisible();
	});

	test.describe('File Encryption', async () => {
		test.afterAll(async ({ api }) => {
			expect((await api.post('/settings/FileUpload_MediaTypeWhiteList', { value: '' })).status()).toBe(200);
			expect((await api.post('/settings/FileUpload_MediaTypeBlackList', { value: 'image/svg+xml' })).status()).toBe(200);
		});

		test('File and description encryption', async ({ page }) => {
			await test.step('create an encrypted channel', async () => {
				const channelName = faker.string.uuid();

				await poHomeChannel.sidenav.openNewByLabel('Channel');
				await poHomeChannel.sidenav.inputChannelName.fill(channelName);
				await poHomeChannel.sidenav.advancedSettingsAccordion.click();
				await poHomeChannel.sidenav.checkboxEncryption.click();
				await poHomeChannel.sidenav.btnCreate.click();

				await expect(page).toHaveURL(`/group/${channelName}`);

				await poHomeChannel.dismissToast();

				await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();
			});

			await test.step('send a file in channel', async () => {
				await poHomeChannel.content.dragAndDropTxtFile();
				await poHomeChannel.content.descriptionInput.fill('any_description');
				await poHomeChannel.content.fileNameInput.fill('any_file1.txt');
				await poHomeChannel.content.btnModalConfirm.click();

				await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
				await expect(poHomeChannel.content.getFileDescription).toHaveText('any_description');
				await expect(poHomeChannel.content.lastMessageFileName).toContainText('any_file1.txt');
			});
		});

		test('File encryption with whitelisted and blacklisted media types', async ({ page, api }) => {
			await test.step('create an encrypted room', async () => {
				const channelName = faker.string.uuid();

				await poHomeChannel.sidenav.openNewByLabel('Channel');
				await poHomeChannel.sidenav.inputChannelName.fill(channelName);
				await poHomeChannel.sidenav.advancedSettingsAccordion.click();
				await poHomeChannel.sidenav.checkboxEncryption.click();
				await poHomeChannel.sidenav.btnCreate.click();

				await expect(page).toHaveURL(`/group/${channelName}`);

				await poHomeChannel.dismissToast();

				await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();
			});

			await test.step('send a text file in channel', async () => {
				await poHomeChannel.content.dragAndDropTxtFile();
				await poHomeChannel.content.descriptionInput.fill('message 1');
				await poHomeChannel.content.fileNameInput.fill('any_file1.txt');
				await poHomeChannel.content.btnModalConfirm.click();

				await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
				await expect(poHomeChannel.content.getFileDescription).toHaveText('message 1');
				await expect(poHomeChannel.content.lastMessageFileName).toContainText('any_file1.txt');
			});

			await test.step('set whitelisted media type setting', async () => {
				expect((await api.post('/settings/FileUpload_MediaTypeWhiteList', { value: 'text/plain' })).status()).toBe(200);
			});

			await test.step('send text file again with whitelist setting set', async () => {
				await poHomeChannel.content.dragAndDropTxtFile();
				await poHomeChannel.content.descriptionInput.fill('message 2');
				await poHomeChannel.content.fileNameInput.fill('any_file2.txt');
				await poHomeChannel.content.btnModalConfirm.click();

				await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
				await expect(poHomeChannel.content.getFileDescription).toHaveText('message 2');
				await expect(poHomeChannel.content.lastMessageFileName).toContainText('any_file2.txt');
			});

			await test.step('set blacklisted media type setting to not accept application/octet-stream media type', async () => {
				expect((await api.post('/settings/FileUpload_MediaTypeBlackList', { value: 'application/octet-stream' })).status()).toBe(200);
			});

			await test.step('send text file again with blacklisted setting set, file upload should fail', async () => {
				await poHomeChannel.content.dragAndDropTxtFile();
				await poHomeChannel.content.descriptionInput.fill('message 3');
				await poHomeChannel.content.fileNameInput.fill('any_file3.txt');
				await poHomeChannel.content.btnModalConfirm.click();

				await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
				await expect(poHomeChannel.content.getFileDescription).toHaveText('message 2');
				await expect(poHomeChannel.content.lastMessageFileName).toContainText('any_file2.txt');
			});
		});

		test.describe('File encryption setting disabled', async () => {
			test.beforeAll(async ({ api }) => {
				expect((await api.post('/settings/E2E_Enable_Encrypt_Files', { value: false })).status()).toBe(200);
				expect((await api.post('/settings/FileUpload_MediaTypeBlackList', { value: 'application/octet-stream' })).status()).toBe(200);
			});

			test.afterAll(async ({ api }) => {
				expect((await api.post('/settings/E2E_Enable_Encrypt_Files', { value: true })).status()).toBe(200);
				expect((await api.post('/settings/FileUpload_MediaTypeBlackList', { value: 'image/svg+xml' })).status()).toBe(200);
			});

			test('Upload file without encryption in e2ee room', async ({ page }) => {
				await test.step('create an encrypted channel', async () => {
					const channelName = faker.string.uuid();

					await poHomeChannel.sidenav.openNewByLabel('Channel');
					await poHomeChannel.sidenav.inputChannelName.fill(channelName);
					await poHomeChannel.sidenav.advancedSettingsAccordion.click();
					await poHomeChannel.sidenav.checkboxEncryption.click();
					await poHomeChannel.sidenav.btnCreate.click();

					await expect(page).toHaveURL(`/group/${channelName}`);

					await poHomeChannel.dismissToast();

					await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();
				});

				await test.step('send a test encrypted message to check e2ee is working', async () => {
					await poHomeChannel.content.sendMessage('This is an encrypted message.');

					await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('This is an encrypted message.');
					await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
				});

				await test.step('send a text file in channel, file should not be encrypted', async () => {
					await poHomeChannel.content.dragAndDropTxtFile();
					await poHomeChannel.content.descriptionInput.fill('any_description');
					await poHomeChannel.content.fileNameInput.fill('any_file1.txt');
					await poHomeChannel.content.btnModalConfirm.click();

					await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).not.toBeVisible();
					await expect(poHomeChannel.content.getFileDescription).toHaveText('any_description');
					await expect(poHomeChannel.content.lastMessageFileName).toContainText('any_file1.txt');
				});
			});
		});
	});

	test('expect slash commands to be enabled in an e2ee room', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await poHomeChannel.dismissToast();

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('This is an encrypted message.');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('This is an encrypted message.');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();

		await page.locator('[name="msg"]').type('/');
		await expect(page.locator('#popup-item-contextualbar')).not.toHaveClass(/disabled/);
		await page.locator('[name="msg"]').clear();

		await poHomeChannel.content.dispatchSlashCommand('/contextualbar');
		await expect(poHomeChannel.btnContextualbarClose).toBeVisible();

		await poHomeChannel.btnContextualbarClose.click();
		await expect(poHomeChannel.btnContextualbarClose).toBeHidden();
	});

	test.describe('un-encrypted messages not allowed in e2ee rooms', () => {
		let poHomeChannel: HomeChannel;

		test.beforeEach(async ({ page }) => {
			poHomeChannel = new HomeChannel(page);
			await page.goto('/home');
		});
		test.beforeAll(async ({ api }) => {
			expect((await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: false })).status()).toBe(200);
		});

		test.afterAll(async ({ api }) => {
			expect((await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: true })).status()).toBe(200);
		});

		test('expect slash commands to be disabled in an e2ee room', async ({ page }) => {
			const channelName = faker.string.uuid();

			await poHomeChannel.sidenav.createEncryptedChannel(channelName);

			await expect(page).toHaveURL(`/group/${channelName}`);

			await poHomeChannel.dismissToast();

			await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

			await poHomeChannel.content.sendMessage('This is an encrypted message.');

			await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('This is an encrypted message.');
			await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();

			await page.locator('[name="msg"]').type('/');
			await expect(page.locator('#popup-item-contextualbar')).toHaveClass(/disabled/);
		});
	});

	test('expect create a private channel, send unecrypted messages, encrypt the channel and delete the last message and check the last message in the sidebar', async ({
		page,
	}) => {
		const channelName = faker.string.uuid();

		// Enable Sidebar Extended display mode
		await poHomeChannel.sidenav.setDisplayMode('Extended');

		// Create private channel
		await poHomeChannel.sidenav.openNewByLabel('Channel');
		await poHomeChannel.sidenav.inputChannelName.fill(channelName);
		await poHomeChannel.sidenav.btnCreate.click();
		await expect(page).toHaveURL(`/group/${channelName}`);
		await expect(poHomeChannel.toastSuccess).toBeVisible();
		await poHomeChannel.dismissToast();

		// Send Unencrypted Messages
		await poHomeChannel.content.sendMessage('first unencrypted message');
		await poHomeChannel.content.sendMessage('second unencrypted message');

		// Encrypt channel
		await poHomeChannel.tabs.kebab.click({ force: true });
		await expect(poHomeChannel.tabs.btnEnableE2E).toBeVisible();
		await poHomeChannel.tabs.btnEnableE2E.click({ force: true });
		await page.waitForTimeout(1000);
		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		// Send Encrypted Messages
		const encriptedMessage1 = 'first ENCRYPTED message';
		const encriptedMessage2 = 'second ENCRYPTED message';
		await poHomeChannel.content.sendMessage(encriptedMessage1);
		await poHomeChannel.content.sendMessage(encriptedMessage2);

		//  Delete last message
		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText(encriptedMessage2);
		await poHomeChannel.content.openLastMessageMenu();
		await page.locator('role=menuitem[name="Delete"]').click();
		await page.locator('#modal-root .rcx-button-group--align-end .rcx-button--danger').click();

		// Check last message in the sidebar
		const sidebarChannel = await poHomeChannel.sidenav.getSidebarItemByName(channelName);
		await expect(sidebarChannel).toBeVisible();
		await expect(sidebarChannel.locator('span')).toContainText(encriptedMessage1);
	});

	test('expect create a private encrypted channel and pin/star an encrypted message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await poHomeChannel.dismissToast();

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('This message should be pinned and stared.');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('This message should be pinned and stared.');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();

		await poHomeChannel.content.openLastMessageMenu();
		await page.locator('role=menuitem[name="Star"]').click();

		await expect(poHomeChannel.toastSuccess).toBeVisible();
		await poHomeChannel.dismissToast();

		await poHomeChannel.content.openLastMessageMenu();
		await page.locator('role=menuitem[name="Pin"]').click();
		await page.locator('#modal-root >> button:has-text("Yes, pin message")').click();

		await poHomeChannel.tabs.kebab.click();
		await poHomeChannel.tabs.btnPinnedMessagesList.click();

		await expect(page.getByRole('dialog', { name: 'Pinned Messages' })).toBeVisible();

		const lastPinnedMessage = page.getByRole('dialog', { name: 'Pinned Messages' }).locator('[data-qa-type="message"]').last();
		await expect(lastPinnedMessage).toContainText('This message should be pinned and stared.');
		await lastPinnedMessage.hover();
		await lastPinnedMessage.locator('role=button[name="More"]').waitFor();
		await lastPinnedMessage.locator('role=button[name="More"]').click();
		await expect(page.locator('role=menuitem[name="Copy link"]')).toHaveClass(/disabled/);

		await poHomeChannel.btnContextualbarClose.click();

		await poHomeChannel.tabs.kebab.click();
		await poHomeChannel.tabs.btnStarredMessageList.click();

		const lastStarredMessage = page.getByRole('dialog', { name: 'Starred Messages' }).locator('[data-qa-type="message"]').last();
		await expect(page.getByRole('dialog', { name: 'Starred Messages' })).toBeVisible();
		await expect(lastStarredMessage).toContainText('This message should be pinned and stared.');
		await lastStarredMessage.hover();
		await lastStarredMessage.locator('role=button[name="More"]').waitFor();
		await lastStarredMessage.locator('role=button[name="More"]').click();
		await expect(page.locator('role=menuitem[name="Copy link"]')).toHaveClass(/disabled/);
	});

	test.describe('reset keys', () => {
		let anotherClientPage: Page;

		test.beforeEach(async ({ browser }) => {
			anotherClientPage = (await createAuxContext(browser, Users.admin)).page;
		});

		test.afterEach(async () => {
			await anotherClientPage.close();
		});
		test.afterAll(async () => {
			// inject initial data, so that tokens are restored after forced logout
			await injectInitialData();
		});

		test('expect force logout on e2e keys reset', async ({ page }) => {
			const poAccountProfile = new AccountProfile(page);
			// creating another logged in client, to check force logout

			await page.goto('/account/security');

			await poAccountProfile.securityE2EEncryptionSection.click();
			await poAccountProfile.securityE2EEncryptionResetKeyButton.click();

			await expect(page.locator('role=button[name="Login"]')).toBeVisible();
			await expect(anotherClientPage.locator('role=button[name="Login"]')).toBeVisible();

			// await expect(page.locator('role=banner')).toContainText('Your session was ended on this device, please log in again to continue.');
			// await expect(anotherClientPage.locator('role=banner')).toContainText(
			// 	'Your session was ended on this device, please log in again to continue.',
			// );
		});
	});
});

test.describe.serial('e2ee room setup', () => {
	let poAccountProfile: AccountProfile;
	let poHomeChannel: HomeChannel;
	let e2eePassword: string;

	test.beforeEach(async ({ page }) => {
		poAccountProfile = new AccountProfile(page);
		poHomeChannel = new HomeChannel(page);
	});

	test.beforeAll(async ({ api }) => {
		expect((await api.post('/settings/E2E_Enable', { value: true })).status()).toBe(200);
		expect((await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: false })).status()).toBe(200);
	});

	test.afterAll(async ({ api }) => {
		expect((await api.post('/settings/E2E_Enable', { value: false })).status()).toBe(200);
		expect((await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: false })).status()).toBe(200);
	});

	test.afterEach(async ({ api }) => {
		await api.recreateContext();
	});

	test('expect save password state on encrypted room', async ({ page }) => {
		await page.goto('/account/security');
		await poAccountProfile.securityE2EEncryptionSection.click();
		await poAccountProfile.securityE2EEncryptionResetKeyButton.click();

		await page.locator('role=button[name="Login"]').waitFor();

		await injectInitialData();
		await restoreState(page, Users.admin);

		await page.goto('/home');

		await expect(page.locator('role=banner >> text="Save your encryption password"')).toBeVisible();

		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.openNewByLabel('Channel');
		await poHomeChannel.sidenav.inputChannelName.fill(channelName);
		await poHomeChannel.sidenav.advancedSettingsAccordion.click();
		await poHomeChannel.sidenav.checkboxEncryption.click();
		await poHomeChannel.sidenav.btnCreate.click();

		await expect(page).toHaveURL(`/group/${channelName}`);

		await poHomeChannel.dismissToast();

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon.first()).toBeVisible();

		await expect(page.locator('role=button[name="Save E2EE password"]')).toBeVisible();

		await poHomeChannel.tabs.btnE2EERoomSetupDisableE2E.waitFor();
		await expect(poHomeChannel.tabs.btnE2EERoomSetupDisableE2E).toBeVisible();
		await expect(poHomeChannel.tabs.btnTabMembers).toBeVisible();
		await expect(poHomeChannel.tabs.btnRoomInfo).toBeVisible();

		await expect(poHomeChannel.content.inputMessage).not.toBeVisible();

		await page.locator('role=button[name="Save E2EE password"]').click();

		e2eePassword = (await page.evaluate(() => localStorage.getItem('e2e.randomPassword'))) || 'undefined';

		await expect(page.locator('role=dialog[name="Save your encryption password"]')).toBeVisible();
		await expect(page.locator('#modal-root')).toContainText(e2eePassword);

		await page.locator('#modal-root >> button:has-text("I saved my password")').click();

		await poHomeChannel.content.inputMessage.waitFor();

		await poHomeChannel.content.sendMessage('hello world');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
	});

	test('expect enter password state on encrypted room', async ({ page }) => {
		await page.goto('/home');

		// Logout to remove e2ee keys
		await poHomeChannel.sidenav.logout();

		await page.locator('role=button[name="Login"]').waitFor();

		await injectInitialData();
		await restoreState(page, Users.admin, { except: ['private_key', 'public_key'] });

		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.openNewByLabel('Channel');
		await poHomeChannel.sidenav.inputChannelName.fill(channelName);
		await poHomeChannel.sidenav.advancedSettingsAccordion.click();
		await poHomeChannel.sidenav.checkboxEncryption.click();
		await poHomeChannel.sidenav.btnCreate.click();

		await expect(page).toHaveURL(`/group/${channelName}`);

		await poHomeChannel.dismissToast();

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon.first()).toBeVisible();

		await page.locator('role=button[name="Enter your E2E password"]').waitFor();

		await expect(page.locator('role=banner >> text="Enter your E2E password"')).toBeVisible();

		await poHomeChannel.tabs.btnE2EERoomSetupDisableE2E.waitFor();
		await expect(poHomeChannel.tabs.btnE2EERoomSetupDisableE2E).toBeVisible();
		await expect(poHomeChannel.tabs.btnTabMembers).toBeVisible();
		await expect(poHomeChannel.tabs.btnRoomInfo).toBeVisible();

		await expect(poHomeChannel.content.inputMessage).not.toBeVisible();

		await page.locator('role=button[name="Enter your E2E password"]').click();

		await page.locator('#modal-root input').fill(e2eePassword);

		await page.locator('#modal-root .rcx-button--primary').click();

		await expect(page.locator('role=banner >> text="Enter your E2E password"')).not.toBeVisible();

		await poHomeChannel.content.inputMessage.waitFor();
		// For E2EE to complete init setup
		await page.waitForTimeout(300);

		await poHomeChannel.content.sendMessage('hello world');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();

		await storeState(page, Users.admin);
	});

	test('expect waiting for room keys state', async ({ page }) => {
		await page.goto('/home');

		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.openNewByLabel('Channel');
		await poHomeChannel.sidenav.inputChannelName.fill(channelName);
		await poHomeChannel.sidenav.advancedSettingsAccordion.click();
		await poHomeChannel.sidenav.checkboxEncryption.click();
		await poHomeChannel.sidenav.btnCreate.click();

		await expect(page).toHaveURL(`/group/${channelName}`);

		await poHomeChannel.dismissToast();

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon.first()).toBeVisible();

		await poHomeChannel.content.sendMessage('hello world');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();

		await poHomeChannel.sidenav.userProfileMenu.click();
		await poHomeChannel.sidenav.accountProfileOption.click();

		await page.locator('role=navigation >> a:has-text("Security")').click();

		await poAccountProfile.securityE2EEncryptionSection.click();
		await poAccountProfile.securityE2EEncryptionResetKeyButton.click();

		await page.locator('role=button[name="Login"]').waitFor();

		await page.reload();

		await page.locator('role=button[name="Login"]').waitFor();

		await injectInitialData();
		await restoreState(page, Users.admin);

		await page.locator('role=navigation >> role=button[name=Search]').click();
		await page.locator('role=search >> role=searchbox').fill(channelName);
		await page.locator(`role=search >> role=listbox >> role=link >> text="${channelName}"`).click();

		await page.locator('role=button[name="Save E2EE password"]').click();
		await page.locator('#modal-root >> button:has-text("I saved my password")').click();

		await expect(poHomeChannel.content.inputMessage).not.toBeVisible();
		await expect(page.locator('.rcx-states__title')).toContainText('Check back later');

		await poHomeChannel.tabs.btnE2EERoomSetupDisableE2E.waitFor();
		await expect(poHomeChannel.tabs.btnE2EERoomSetupDisableE2E).toBeVisible();
		await expect(poHomeChannel.tabs.btnTabMembers).toBeVisible();
		await expect(poHomeChannel.tabs.btnRoomInfo).toBeVisible();
	});
});

test.describe.serial('e2ee support legacy formats', () => {
	test.use({ storageState: Users.userE2EE.state });

	let poHomeChannel: HomeChannel;

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
	});

	test.beforeAll(async ({ api }) => {
		expect((await api.post('/settings/E2E_Enable', { value: true })).status()).toBe(200);
		expect((await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: false })).status()).toBe(200);
	});

	test.afterAll(async ({ api }) => {
		await api.post('/settings/E2E_Enable', { value: false });
		await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: false });
	});

	//  ->>>>>>>>>>>Not testing upload since it was not implemented in the legacy format
	test('expect create a private channel encrypted and send an encrypted message', async ({ page, request }) => {
		await page.goto('/home');

		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await poHomeChannel.dismissToast();

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		const rid = await page.locator('[data-qa-rc-room]').getAttribute('data-qa-rc-room');

		// send old format encrypted message via API
		const msg = await page.evaluate(async (rid) => {
			// eslint-disable-next-line import/no-unresolved, @typescript-eslint/no-var-requires, import/no-absolute-path
			const { e2e } = require('/app/e2e/client/rocketchat.e2e.ts');
			const e2eRoom = await e2e.getInstanceByRoomId(rid);
			return e2eRoom.encrypt({ _id: 'id', msg: 'Old format message' });
		}, rid);

		await request.post(`${BASE_API_URL}/chat.sendMessage`, {
			headers: {
				'X-Auth-Token': Users.userE2EE.data.loginToken,
				'X-User-Id': Users.userE2EE.data._id,
			},
			data: {
				message: {
					rid,
					msg,
					t: 'e2e',
				},
			},
		});

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('Old format message');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
	});
});
