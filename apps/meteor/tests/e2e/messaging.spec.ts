import { faker } from '@faker-js/faker';
import { request as playwrightRequest } from '@playwright/test';
import type { APIRequestContext, Page } from '@playwright/test';

import { API_PREFIX, BASE_API_URL } from './config/constants';
import { createAuxContext } from './fixtures/createAuxContext';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannelAndReturnFullRoom, deleteChannel } from './utils';
import { sendMessageFromUser } from './utils/sendMessage';
import type { BaseTest } from './utils/test';
import { expect, test } from './utils/test';

test.use({ storageState: Users.user1.state });

test.describe('Messaging', () => {
	let channelPage: HomeChannel;
	let targetChannel: string;

	// beforeAll/afterAll only accept worker-scoped fixtures, while `api`
	// depends on the test-scoped `request` fixture, so build a small
	// worker-scoped admin client here instead of injecting `api`.
	const createWorkerAdminApi = async () => {
		const adminRequest = await playwrightRequest.newContext({
			baseURL: BASE_API_URL,
			extraHTTPHeaders: {
				'X-Auth-Token': Users.admin.data.loginToken,
				'X-User-Id': Users.admin.data._id,
			},
		});
		const workerApi = {
			get: (uri: string, params?: Record<string, unknown>, prefix = API_PREFIX) => adminRequest.get(`${prefix}${uri}`, { params }),
			post: (uri: string, data: Record<string, unknown>, prefix = API_PREFIX) => adminRequest.post(`${prefix}${uri}`, { data }),
			put: (uri: string, data: Record<string, unknown>, prefix = API_PREFIX) => adminRequest.put(`${prefix}${uri}`, { data }),
			delete: (uri: string, params?: Record<string, unknown>, prefix = API_PREFIX) => adminRequest.delete(`${prefix}${uri}`, { params }),
		} as unknown as BaseTest['api'];
		return { adminRequest, workerApi };
	};

	test.beforeAll(async () => {
		const { adminRequest, workerApi } = await createWorkerAdminApi();
		try {
			const { channel } = await createTargetChannelAndReturnFullRoom(workerApi, { members: [Users.user1.data.username] });
			targetChannel = channel.name as string;
			const request: APIRequestContext = await playwrightRequest.newContext();
			try {
				for (const message of ['msg1', 'msg2']) {
					const response = await sendMessageFromUser(request, Users.user1, channel._id, message);
					expect(response.success).toBe(true);
				}
			} finally {
				await request.dispose();
			}
		} finally {
			await adminRequest.dispose();
		}
	});

	test.beforeEach(async ({ page }) => {
		channelPage = new HomeChannel(page);
		await channelPage.goto();
	});

	test.afterAll(async () => {
		const { adminRequest, workerApi } = await createWorkerAdminApi();
		try {
			await deleteChannel(workerApi, targetChannel);
		} finally {
			await adminRequest.dispose();
		}
	});

	test.describe.serial('Navigation', () => {
		test.beforeEach(async () => {
			await channelPage.navbar.openChat(targetChannel);
			// wait for the room toolbox to mount, since it's a lazy loaded component
			await channelPage.roomToolbar.waitFor();
		});

		test('should navigate properly on the user card', async ({ page }) => {
			await test.step('open UserCard', async () => {
				await page.keyboard.press('Shift+Tab');
				await page.keyboard.press('ArrowUp');
				await page.keyboard.press('Tab');
				await page.keyboard.press('Space');
				await expect(channelPage.userCardToolbar).toBeVisible();
			});

			await test.step('close UserCard with Esc', async () => {
				await page.keyboard.press('Escape');
				await expect(channelPage.userCardToolbar).not.toBeVisible();
			});

			await test.step('with focus restored reopen toolbar', async () => {
				await page.keyboard.press('Space');
				await expect(channelPage.userCardToolbar).toBeVisible();
			});

			await test.step('close UserCard with button', async () => {
				await page.keyboard.press('Tab');
				await page.keyboard.press('Tab');
				await page.keyboard.press('Tab');
				await page.keyboard.press('Space');
				await expect(channelPage.userCardToolbar).not.toBeVisible();
			});
		});

		test('should not restore focus on the last focused if it was triggered by click', async ({ page }) => {
			await channelPage.content.getMessageByText('msg1').click();

			await channelPage.composer.inputMessage.click();
			await page.keyboard.press('Shift+Tab');

			await expect(channelPage.content.getMessageByText('msg2')).toBeFocused();
		});

		test('should not focus on the last message when focusing by click', async () => {
			await channelPage.content.getMessageByText('msg1').click();

			await expect(channelPage.content.lastUserMessage).not.toBeFocused();
		});

		test('should focus the latest message when moving the focus on the list and theres no previous focus', async ({ page }) => {
			await channelPage.getBtnOpenRoomInfo(targetChannel).focus();
			await expect(channelPage.getBtnOpenRoomInfo(targetChannel)).toBeFocused();

			await test.step('move focus to the list', async () => {
				await page.keyboard.press('Tab');
				await page.keyboard.press('Tab');
				await expect(channelPage.content.lastUserMessage).toBeFocused();
			});

			await test.step('move focus to the list again', async () => {
				await channelPage.getBtnOpenRoomInfo(targetChannel).focus();
				await expect(channelPage.getBtnOpenRoomInfo(targetChannel)).toBeFocused();
				await page.keyboard.press('Tab');
				await page.keyboard.press('Tab');
				await expect(channelPage.content.lastUserMessage).toBeFocused();
			});
		});
	});

	test.describe.serial('Message edition', () => {
		test('should edit messages', async ({ page }) => {
			await channelPage.navbar.openChat(targetChannel);

			await test.step('focus on the second message', async () => {
				await expect(channelPage.composer.inputMessage).toBeFocused();
				await page.keyboard.press('ArrowUp');

				await expect(channelPage.composer.inputMessage).toHaveValue('msg2');
			});

			await test.step('send edited message', async () => {
				const editPromise = page.waitForResponse(
					(response) => /api\/v1\/chat.update/.test(response.url()) && response.status() === 200 && response.request().method() === 'POST',
				);

				await channelPage.content.sendMessage('edited msg2', false);
				await editPromise;

				await expect(channelPage.content.lastUserMessageBody).toHaveText('edited msg2');
			});

			await test.step('stress test on message editions', async () => {
				const editPromise = page.waitForResponse(
					(response) => /api\/v1\/chat.update/.test(response.url()) && response.status() === 200 && response.request().method() === 'POST',
				);

				for (const element of ['edited msg2 a', 'edited msg2 b', 'edited msg2 c', 'edited msg2 d', 'edited msg2 e']) {
					await expect(channelPage.composer.inputMessage).toBeFocused();
					await page.keyboard.press('ArrowUp');

					await channelPage.content.sendMessage(element, false);
				}

				await editPromise;
				await expect(channelPage.content.lastUserMessageBody).toHaveText('edited msg2 e');
			});
		});
	});

	test.describe('Message by "chat.postMessage" API method', () => {
		test('expect show a message', async ({ api }) => {
			const messageText = faker.lorem.sentence();

			await channelPage.navbar.openChat(targetChannel);

			await api.post('/chat.postMessage', {
				channel: targetChannel,
				text: messageText,
			});

			await expect(channelPage.content.lastUserMessageBody).toHaveText(messageText);
		});

		test('expect show attachment text', async ({ api }) => {
			const messageText = faker.lorem.sentence();
			const attachmentText = faker.lorem.sentence();

			await channelPage.navbar.openChat(targetChannel);

			await api.post('/chat.postMessage', {
				channel: targetChannel,
				text: messageText,
				attachments: [
					{
						text: attachmentText,
					},
				],
			});

			await expect(channelPage.content.lastUserMessageAttachment).toHaveText(attachmentText);
		});

		test('expect show attachment text with emoji', async ({ api }) => {
			const messageText = faker.lorem.sentence();
			const attachmentText = faker.lorem.sentence();

			await channelPage.navbar.openChat(targetChannel);

			await api.post('/chat.postMessage', {
				channel: targetChannel,
				text: messageText,
				attachments: [
					{
						text: `${attachmentText} :sunglasses: `,
					},
				],
			});

			await expect(channelPage.content.lastUserMessageAttachment).toHaveText(`${attachmentText} \ud83d\ude0e `);
		});

		test('expect show attachment text without emoji inside code block', async ({ api }) => {
			const messageText = faker.lorem.sentence();
			const attachmentText = faker.lorem.sentence();

			await channelPage.navbar.openChat(targetChannel);

			await api.post('/chat.postMessage', {
				channel: targetChannel,
				text: messageText,
				attachments: [
					{
						text: `\`\`\`${attachmentText} B) \`\`\``,
					},
				],
			});

			await expect(channelPage.content.lastUserMessageAttachment).toHaveText(`${attachmentText} B) `);
		});
	});

	test.describe('Both contexts', () => {
		let auxContext: { page: Page; poHomeChannel: HomeChannel };
		test.beforeEach(async ({ browser }) => {
			const { page } = await createAuxContext(browser, Users.user2);
			auxContext = { page, poHomeChannel: new HomeChannel(page) };
		});

		test.afterEach(async () => {
			await auxContext.page.close();
		});

		test('expect show "hello word" in both contexts (targetChannel)', async () => {
			await channelPage.navbar.openChat(targetChannel);

			await auxContext.poHomeChannel.navbar.openChat(targetChannel);

			await channelPage.content.sendMessage('hello world');

			await expect(async () => {
				await expect(auxContext.poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
				await expect(channelPage.content.lastUserMessageBody).toHaveText('hello world');
			}).toPass();
		});

		test('expect show "hello word" in both contexts (direct)', async () => {
			await channelPage.navbar.openChat('user2');
			await auxContext.poHomeChannel.navbar.openChat('user1');

			await channelPage.content.sendMessage('hello world');

			await expect(async () => {
				await expect(channelPage.content.lastUserMessageBody).toHaveText('hello world');
				await expect(auxContext.poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
			}).toPass();
		});
	});
});
