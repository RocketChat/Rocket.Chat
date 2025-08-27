import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { createAuxContext } from './fixtures/createAuxContext';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, deleteChannel } from './utils';
import { expect, test } from './utils/test';

test.use({ storageState: Users.user1.state });

test.describe('Messaging', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test.afterAll(async ({ api }) => {
		await deleteChannel(api, targetChannel);
	});

	test.describe.serial('Navigation', () => {
		test('should navigate on messages using keyboard', async ({ page }) => {
			await test.step('open chat and send message', async () => {
				await poHomeChannel.sidenav.openChat(targetChannel);
				await poHomeChannel.content.sendMessage('msg1');
				await poHomeChannel.content.sendMessage('msg2');
			});

			await test.step('move focus to the second message', async () => {
				await page.keyboard.press('Shift+Tab');
				await expect(page.locator('[data-qa-type="message"]').last()).toBeFocused();
			});

			await test.step('move focus to the first system message', async () => {
				await page.keyboard.press('ArrowUp');
				await page.keyboard.press('ArrowUp');
				await expect(page.locator('[data-qa="system-message"]').first()).toBeFocused();
			});

			await test.step('move focus to the first typed message', async () => {
				await page.keyboard.press('ArrowDown');
				await expect(page.locator('[data-qa-type="message"]:has-text("msg1")')).toBeFocused();
			});

			await test.step('move focus to the room title', async () => {
				await page.keyboard.press('Shift+Tab');
				await expect(page.getByRole('button', { name: targetChannel }).first()).toBeFocused();
			});

			await test.step('move focus to the channel list', async () => {
				await page.keyboard.press('Tab');
				await page.keyboard.press('Tab');
				await page.keyboard.press('Tab');
				await expect(page.locator('[data-qa-type="message"]:has-text("msg1")')).toBeFocused();
			});

			await test.step('move focus to the message toolbar', async () => {
				await page
					.locator('[data-qa-type="message"]:has-text("msg1")')
					.locator('[role=toolbar][aria-label="Message actions"]')
					.getByRole('button', { name: 'Add reaction' })
					.waitFor();
				await page.keyboard.press('Tab');
				await page.keyboard.press('Tab');
				await expect(
					page
						.locator('[data-qa-type="message"]:has-text("msg1")')
						.locator('[role=toolbar][aria-label="Message actions"]')
						.getByRole('button', { name: 'Add reaction' }),
				).toBeFocused();
			});

			await test.step('move focus to the composer', async () => {
				await page.keyboard.press('Tab');
				await page
					.locator('[data-qa-type="message"]:has-text("msg2")')
					.locator('[role=toolbar][aria-label="Message actions"]')
					.getByRole('button', { name: 'Add reaction' })
					.waitFor();
				await page.keyboard.press('Tab');
				await page.keyboard.press('Tab');
				await expect(poHomeChannel.composer).toBeFocused();
			});
		});

		test('should edit messages', async ({ page }) => {
			await poHomeChannel.sidenav.openChat(targetChannel);

			await test.step('focus on the second message', async () => {
				await page.keyboard.press('ArrowUp');

				expect(await poHomeChannel.composer.inputValue()).toBe('msg2');
			});

			await test.step('send edited message', async () => {
				await poHomeChannel.content.sendMessage('edited msg2');

				await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('edited msg2');
			});

			await test.step('stress test on message editions', async () => {
				for (const element of ['edited msg2 a', 'edited msg2 b', 'edited msg2 c', 'a', 'b', 'c']) {
					// eslint-disable-next-line no-await-in-loop
					await page.keyboard.press('ArrowUp');
					// eslint-disable-next-line no-await-in-loop
					await poHomeChannel.content.sendMessage(element, false);
				}

				let timeoutOccurred = false;

				try {
					await page.waitForSelector('.rcx-toastbar.rcx-toastbar--error', { timeout: 5000 });

					timeoutOccurred = false;
				} catch (error: unknown) {
					if ((error as { name: string }).name === 'TimeoutError') {
						timeoutOccurred = true;
					} else {
						throw error;
					}
				}

				expect(timeoutOccurred).toBe(true);
			});
		});

		test('should navigate properly on the user card', async ({ page }) => {
			await poHomeChannel.sidenav.openChat(targetChannel);

			await test.step('open UserCard', async () => {
				await page.keyboard.press('Shift+Tab');
				await page.keyboard.press('ArrowUp');
				await page.keyboard.press('Tab');
				await page.keyboard.press('Space');
				await expect(poHomeChannel.userCardToolbar).toBeVisible();
			});

			await test.step('close UserCard with Esc', async () => {
				await page.keyboard.press('Escape');
				await expect(poHomeChannel.userCardToolbar).not.toBeVisible();
			});

			await test.step('with focus restored reopen toolbar', async () => {
				await page.keyboard.press('Space');
				await expect(poHomeChannel.userCardToolbar).toBeVisible();
			});

			await test.step('close UserCard with button', async () => {
				await page.keyboard.press('Tab');
				await page.keyboard.press('Tab');
				await page.keyboard.press('Tab');
				await page.keyboard.press('Space');
				await expect(poHomeChannel.userCardToolbar).not.toBeVisible();
			});
		});

		test('should not restore focus on the last focused if it was triggered by click', async ({ page }) => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await page.locator('[data-qa-type="message"]:has-text("msg1")').click();
			await poHomeChannel.composer.click();
			await page.keyboard.press('Shift+Tab');

			await expect(page.locator('[data-qa-type="message"]:has-text("msg2")')).toBeFocused();
		});

		test('should not focus on the last message when focusing by click', async ({ page }) => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await page.locator('[data-qa-type="message"]:has-text("msg1")').click();

			await expect(page.locator('[data-qa-type="message"]').last()).not.toBeFocused();
		});

		test('should focus the latest message when moving the focus on the list and theres no previous focus', async ({ page }) => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await page.getByRole('button', { name: targetChannel }).first().focus();

			await test.step('move focus to the list', async () => {
				await page.keyboard.press('Tab');
				await page.keyboard.press('Tab');
				await page.keyboard.press('Tab');
				await expect(page.locator('[data-qa-type="message"]').last()).toBeFocused();
			});

			await test.step('move focus to the list again', async () => {
				await page.getByRole('button', { name: targetChannel }).first().focus();
				await page.keyboard.press('Tab');
				await page.keyboard.press('Tab');
				await page.keyboard.press('Tab');
				await expect(page.locator('[data-qa-type="message"]').last()).toBeFocused();
			});
		});
	});

	test.describe('Message by "chat.postMessage" API method', () => {
		test('expect show a message', async ({ api }) => {
			const messageText = faker.lorem.sentence();

			await poHomeChannel.sidenav.openChat(targetChannel);

			await api.post('/chat.postMessage', {
				channel: targetChannel,
				text: messageText,
			});

			await expect(poHomeChannel.content.lastUserMessageBody).toHaveText(messageText);
		});

		test('expect show attachment text', async ({ api }) => {
			const messageText = faker.lorem.sentence();
			const attachmentText = faker.lorem.sentence();

			await poHomeChannel.sidenav.openChat(targetChannel);

			await api.post('/chat.postMessage', {
				channel: targetChannel,
				text: messageText,
				attachments: [
					{
						text: attachmentText,
					},
				],
			});

			await expect(poHomeChannel.content.lastUserMessageAttachment).toHaveText(attachmentText);
		});

		test('expect show attachment text with emoji', async ({ api }) => {
			const messageText = faker.lorem.sentence();
			const attachmentText = faker.lorem.sentence();

			await poHomeChannel.sidenav.openChat(targetChannel);

			await api.post('/chat.postMessage', {
				channel: targetChannel,
				text: messageText,
				attachments: [
					{
						text: `${attachmentText} B) `,
					},
				],
			});

			await expect(poHomeChannel.content.lastUserMessageAttachment).toHaveText(`${attachmentText} \ud83d\ude0e `);
		});

		test('expect show attachment text without emoji inside code block', async ({ api }) => {
			const messageText = faker.lorem.sentence();
			const attachmentText = faker.lorem.sentence();

			await poHomeChannel.sidenav.openChat(targetChannel);

			await api.post('/chat.postMessage', {
				channel: targetChannel,
				text: messageText,
				attachments: [
					{
						text: `\`\`\`${attachmentText} B) \`\`\``,
					},
				],
			});

			await expect(poHomeChannel.content.lastUserMessageAttachment).toHaveText(`${attachmentText} B) `);
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
			await poHomeChannel.sidenav.openChat(targetChannel);

			await auxContext.poHomeChannel.sidenav.openChat(targetChannel);

			await poHomeChannel.content.sendMessage('hello world');

			await expect(async () => {
				await expect(auxContext.poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
				await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
			}).toPass();
		});

		test('expect show "hello word" in both contexts (direct)', async () => {
			await poHomeChannel.sidenav.openChat('user2');
			await auxContext.poHomeChannel.sidenav.openChat('user1');

			await poHomeChannel.content.sendMessage('hello world');

			await expect(async () => {
				await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
				await expect(auxContext.poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
			}).toPass();
		});
	});
});
