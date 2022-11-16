import faker from '@faker-js/faker';
import type { Browser, Page } from '@playwright/test';

import { expect, test } from './utils/test';
import { HomeLivechat, OmnichannelLiveChat } from './page-objects';
import { IS_EE } from './config/constants';

const createAuxContext = async (browser: Browser, storageState: string): Promise<{ page: Page; poHomeLivechat: HomeLivechat }> => {
	const page = await browser.newPage({ storageState });
	const poHomeLivechat = new HomeLivechat(page);
	await page.goto('/');
	await page.locator('.main-content').waitFor();

	return { page, poHomeLivechat };
};

const visitor = {
	name: faker.name.firstName(),
	email: faker.internet.email(),
};

// TODO: Improve this test to check the department info
const hasDepartment = false;

// TODO: Improve this test to check if customFields exist;
const hasCustomFields = false;

test.describe('Omnichannel room info', () => {
	let poLiveChat: OmnichannelLiveChat;
	let agent: { page: Page; poHomeLivechat: HomeLivechat };

	test.beforeAll(async ({ api, browser }) => {
		// Set user user 1 as manager and agent
		await api.post('/livechat/users/agent', { username: 'user1' });
		await api.post('/livechat/users/manager', { username: 'user1' });
		agent = await createAuxContext(browser, 'user1-session.json');
	});

	test.beforeEach(async ({ page }) => {
		poLiveChat = new OmnichannelLiveChat(page);
	});

	test.afterAll(async ({ api }) => {
		await api.delete('/livechat/users/agent/user1');
		await api.delete('/livechat/users/manager/user1');
		// TODO: close conversation;
	});

	test.describe.serial('Omnichannel room info', () => {
		test('Expect send a message as a visitor', async ({ page }) => {
			await page.goto('/livechat');
			await poLiveChat.btnOpenLiveChat('R').click();
			await poLiveChat.sendMessage(visitor, false);
			await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_visitor');
			await poLiveChat.btnSendMessageToOnlineAgent.click();
		});

		test('Expect agent open the visitor conversation', async () => {
			await agent.poHomeLivechat.sidenav.openChat(visitor.name);
		});

		test('Expect agent field to be visible', async () => {
			await expect(agent.poHomeLivechat.contextualBar.roomInfo.agentFieldUsername).toContainText('(user1)');
		});

		test('Expect department field to be visible', async () => {
			if (!hasDepartment) {
				return;
			}
			await expect(agent.poHomeLivechat.contextualBar.roomInfo.departmentFieldName).toBeVisible();
		});

		test.describe('Omnichannel edit room info', () => {
			test.beforeAll(async () => {
				await agent.poHomeLivechat.contextualBar.roomInfo.btnEdit.click();
			});

			test('Expect omnichannel edit room info is visible', async () => {
				await expect(agent.poHomeLivechat.contextualBar.roomInfo.edit.title).toBeVisible();
			});

			test('Expect custom fields form to be visible', async () => {
				if (!hasCustomFields) {
					return;
				}
				await expect(agent.poHomeLivechat.contextualBar.roomInfo.edit.inputCustomFields).toBeVisible();
			});

			test('Expect priority field to be visible', async () => {
				test.skip(!IS_EE, 'Enterprise only');
				await expect(agent.poHomeLivechat.contextualBar.roomInfo.edit.inputPriorities).toBeVisible();
			});

			test('Expect save edited room info', async () => {
				await agent.poHomeLivechat.contextualBar.roomInfo.edit.inputTopic.waitFor();
				await agent.poHomeLivechat.contextualBar.roomInfo.edit.inputTopic.fill('this_is_a_test_topic');
				await agent.poHomeLivechat.contextualBar.roomInfo.edit.btnSave.click();

				await expect(agent.poHomeLivechat.contextualBar.roomInfo.topic).toContainText('this_is_a_test_topic');
			});
		});
	});
});
