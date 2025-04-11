import { createFakeVisitor } from '../../mocks/data';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel, OmnichannelLiveChat } from '../page-objects';
import { createAgent } from '../utils/omnichannel/agents';
import { test, expect } from '../utils/test';

const visitor = createFakeVisitor();

// Endpoint defaults are reset after each test, so if not in matrix assume is true
const settingsMatrix = [
	[{ name: 'FileUpload_Enabled', value: false }],
	[{ name: 'Livechat_fileupload_enabled', value: false }],
	[
		{ name: 'FileUpload_Enabled', value: false },
		{ name: 'Livechat_fileupload_enabled', value: false },
	],
] as const;

const beforeTest = async (poLiveChat: OmnichannelLiveChat) => {
	await poLiveChat.page.goto('/livechat');

	await poLiveChat.openAnyLiveChat();
	await poLiveChat.sendMessage(visitor, false);
	await poLiveChat.onlineAgentMessage.fill('this_a_test_message_from_user');
	await poLiveChat.btnSendMessageToOnlineAgent.click();

	await poLiveChat.txtChatMessage('this_a_test_message_from_user').waitFor({ state: 'visible' });
};

test.describe('OC - Livechat - OC - File Upload', () => {
	let poLiveChat: OmnichannelLiveChat;
	let poHomeOmnichannel: HomeOmnichannel;
	let agent: Awaited<ReturnType<typeof createAgent>>;

	test.beforeAll(async ({ browser, api }) => {
		agent = await createAgent(api, 'user1');

		const { page } = await createAuxContext(browser, Users.user1, '/');
		poHomeOmnichannel = new HomeOmnichannel(page);
	});

	test.beforeEach(async ({ page, api }) => {
		poLiveChat = new OmnichannelLiveChat(page, api);
	});

	test.afterAll(async ({ updateSetting }) => {
		await Promise.all([updateSetting('FileUpload_Enabled', true), updateSetting('Livechat_fileupload_enabled', true)]);

		await poHomeOmnichannel.page.close();
		await agent.delete();
	});

	// Default settings are FileUpload_Enabled true and Livechat_fileupload_enabled true
	test('OC - Livechat - txt Drag & Drop', async () => {
		await beforeTest(poLiveChat);

		await test.step('expect to upload a txt file', async () => {
			await poLiveChat.dragAndDropTxtFile();
			await expect(poLiveChat.findUploadedFileLink('any_file.txt')).toBeVisible();
		});
	});

	test('OC - Livechat - lst Drag & Drop', async () => {
		await beforeTest(poLiveChat);

		await test.step('expect to upload a lst file', async () => {
			await poLiveChat.dragAndDropLstFile();
			await expect(poLiveChat.findUploadedFileLink('lst-test.lst')).toBeVisible();
		});
	});
});

test.describe('OC - Livechat - OC - File Upload - Disabled', () => {
	let poLiveChat: OmnichannelLiveChat;
	let poHomeOmnichannel: HomeOmnichannel;
	let agent: Awaited<ReturnType<typeof createAgent>>;

	test.beforeAll(async ({ browser, api }) => {
		agent = await createAgent(api, 'user1');

		const { page } = await createAuxContext(browser, Users.user1, '/');
		poHomeOmnichannel = new HomeOmnichannel(page);
	});

	test.afterAll(async ({ updateSetting }) => {
		await Promise.all([updateSetting('FileUpload_Enabled', true), updateSetting('Livechat_fileupload_enabled', true)]);

		await poHomeOmnichannel.page?.close();
		await agent.delete();
	});

	settingsMatrix.forEach((settings) => {
		const testName = settings.map(({ name, value }) => `${name}=${value}`).join(' ');

		test(`OC - Livechat - txt Drag & Drop - ${testName}`, async ({ page, api, updateSetting }) => {
			poLiveChat = new OmnichannelLiveChat(page, api);

			await Promise.all(settings.map(({ name, value }) => updateSetting(name, value)));

			await poLiveChat.page.goto('/livechat');

			await poLiveChat.openAnyLiveChat();
			await poLiveChat.sendMessage(visitor, false);
			await poLiveChat.onlineAgentMessage.fill('this_a_test_message_from_user');
			await poLiveChat.btnSendMessageToOnlineAgent.click();

			await poLiveChat.txtChatMessage('this_a_test_message_from_user').waitFor({ state: 'visible' });

			await test.step('expect to upload a txt file', async () => {
				await poLiveChat.dragAndDropTxtFile();

				await expect(poLiveChat.alertMessage('File upload is disabled')).toBeVisible();
			});
		});
	});
});
