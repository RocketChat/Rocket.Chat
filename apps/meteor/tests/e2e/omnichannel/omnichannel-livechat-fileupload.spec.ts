import { faker } from '@faker-js/faker';

import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel, OmnichannelLiveChat } from '../page-objects';
import { createAgent } from '../utils/omnichannel/agents';
import { test, expect } from '../utils/test';

const visitor = {
	name: `${faker.person.firstName()} ${faker.string.uuid()}}`,
	email: faker.internet.email(),
}

// Endpoint defaults are reset after each test, so if not in matrix assume is true
const endpointMatrix = [
	[{ url: '/settings/FileUpload_Enabled', value: false}],
	[{ url: '/settings/Livechat_fileupload_enabled', value: false}],
	[{ url: '/settings/FileUpload_Enabled', value: false}, { url: '/settings/Livechat_fileupload_enabled', value: false}],
]

const beforeTest = async (poLiveChat: OmnichannelLiveChat) => {
	await poLiveChat.page.goto('/livechat');

	await poLiveChat.openAnyLiveChat();
	await poLiveChat.sendMessage(visitor, false);
	await poLiveChat.onlineAgentMessage.fill('this_a_test_message_from_user');
	await poLiveChat.btnSendMessageToOnlineAgent.click();

	await poLiveChat.txtChatMessage('this_a_test_message_from_user').waitFor({state: 'visible'});
}

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

	test.afterAll(async ({api}) => {
		await api.post('/settings/FileUpload_Enabled', { value: true });
		await api.post('/settings/Livechat_fileupload_enabled', { value: true });

		await poHomeOmnichannel.page?.close();
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

	test.afterAll(async ({api}) => {
		await api.post('/settings/FileUpload_Enabled', { value: true });
		await api.post('/settings/Livechat_fileupload_enabled', { value: true });

		await poHomeOmnichannel.page?.close();
		await agent.delete();
	});

	endpointMatrix.forEach((endpoints) => {
		const testName = endpoints.map((endpoint) => endpoint.url.split('/').pop()?.concat(`=${endpoint.value}`)).join(' ');

		test(`OC - Livechat - txt Drag & Drop - ${testName}`, async ({ page, api }) => {
			test.fail();

			poLiveChat = new OmnichannelLiveChat(page, api);

			await Promise.all(endpoints.map(async (endpoint: { url: string, value: boolean }) => {
				await api.post(endpoint.url, { value: endpoint.value });
			}));

			await poLiveChat.page.goto('/livechat');

			await poLiveChat.openAnyLiveChat();
			await poLiveChat.sendMessage(visitor, false);
			await poLiveChat.onlineAgentMessage.fill('this_a_test_message_from_user');
			await poLiveChat.btnSendMessageToOnlineAgent.click();

			await poLiveChat.txtChatMessage('this_a_test_message_from_user').waitFor({state: 'visible'});

			await test.step('expect to upload a txt file', async () => {
				await poLiveChat.dragAndDropTxtFile();

				await expect(poLiveChat.alertMessage('file_upload_disabled')).toBeVisible();
			});
		});
	});
});
