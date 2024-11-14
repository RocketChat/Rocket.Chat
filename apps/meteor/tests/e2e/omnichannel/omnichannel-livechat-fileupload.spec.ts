import { createFakeVisitor } from '../../mocks/data';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel, OmnichannelLiveChat } from '../page-objects';
import { setSettingValueById } from '../utils';
import { createAgent } from '../utils/omnichannel/agents';
import { deleteClosedRooms } from '../utils/omnichannel/rooms';
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
];

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
		await poLiveChat.page.goto('/livechat');
	});

	test.beforeEach(async () => {
		await poLiveChat.startChat();
	});

	test.afterEach(async () => {
		await poLiveChat.closeChat();
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([
			deleteClosedRooms(api),
			setSettingValueById(api, 'FileUpload_Enabled', true),
			setSettingValueById(api, 'Livechat_fileupload_enabled', true),
		]);

		await poHomeOmnichannel.page.close();
		await agent.delete();
	});

	// Default settings are FileUpload_Enabled true and Livechat_fileupload_enabled true
	test('OC - Livechat - txt Drag & Drop', async () => {
		await test.step('expect to upload a txt file', async () => {
			await poLiveChat.dragAndDropTxtFile();
			await expect(poLiveChat.findUploadedFileLink('any_file.txt')).toBeVisible();
		});
	});

	test('OC - Livechat - lst Drag & Drop', async () => {
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

	test.afterAll(async ({ api }) => {
		await Promise.all([
			agent.delete(),
			setSettingValueById(api, 'FileUpload_Enabled', true),
			setSettingValueById(api, 'Livechat_fileupload_enabled', true),
		]);

		await poHomeOmnichannel.page?.close();
	});

	settingsMatrix.forEach((endpoints) => {
		const testName = endpoints.map((endpoint) => `${endpoint.name}=${endpoint.value}`);

		test(`OC - Livechat - txt Drag & Drop - ${testName}`, async ({ page, api }) => {
			poLiveChat = new OmnichannelLiveChat(page, api);

			await test.step('expect to configure environment', async () => {
				await Promise.all(
					endpoints.map((endpoint: { name: string; value: boolean }) => setSettingValueById(api, endpoint.name, endpoint.value)),
				);
			});

			await test.step('expect to start a livechat conversation', async () => {
				await poLiveChat.page.goto('/livechat');
				await poLiveChat.startChat({ visitor, message: 'this_a_test_message_from_user' });
			});

			await test.step('expect to upload a txt file', async () => {
				await poLiveChat.dragAndDropTxtFile();
				await expect(poLiveChat.alertMessage('File upload is disabled')).toBeVisible();
			});

			await test.step('expect to close the livechat conversation', async () => {
				await poLiveChat.closeChat();
			});
		});
	});
});
