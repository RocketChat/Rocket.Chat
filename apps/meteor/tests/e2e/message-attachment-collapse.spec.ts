import { faker } from '@faker-js/faker';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, deleteChannel } from './utils';
import { setUserPreferences } from './utils/setUserPreferences';
import type { BaseTest } from './utils/test';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });

const TRANSPARENT_PIXEL =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

const postAttachmentMessage = async (
	api: BaseTest['api'],
	channel: string,
	{ text, collapsed }: { text: string; collapsed?: boolean },
): Promise<void> => {
	await api.post('/chat.postMessage', {
		channel,
		attachments: [{ title: 'GIPHY', text, image_url: TRANSPARENT_PIXEL, collapsed }],
	});
};

const floodChannel = (api: BaseTest['api'], channel: string, count: number): Promise<unknown> =>
	Promise.all(Array.from({ length: count }, () => api.post('/chat.postMessage', { channel, text: faker.lorem.paragraphs(2) })));

test.describe.serial('Message Attachment Collapse', () => {
	let poHomeChannel: HomeChannel;

	const scrollUp = async (): Promise<void> => {
		const scroller = poHomeChannel.content.mainMessageListScroller;

		await scroller.evaluate((el) => {
			(el.firstElementChild as HTMLElement).scrollTop = 0;
		});
	};

	const waitForFloodToSettle = async (api: BaseTest['api'], channel: string): Promise<void> => {
		const marker = `flood settled ${faker.string.uuid()}`;
		await api.post('/chat.postMessage', { channel, text: marker });
		await expect(poHomeChannel.content.mainMessageList.getByText(marker)).toBeVisible();
	};

	test.describe('Default preference (expanded by default)', () => {
		let targetChannel: string;

		test.beforeAll(async ({ api }) => {
			targetChannel = await createTargetChannel(api);
		});

		test.beforeEach(async ({ page }) => {
			poHomeChannel = new HomeChannel(page);
			await poHomeChannel.gotoChannel(targetChannel);
		});

		test.afterAll(async ({ api }) => {
			await deleteChannel(api, targetChannel);
		});

		test('should collapse and re-expand an attachment on toggle click', async ({ api }) => {
			const text = `attachment text ${faker.string.uuid()}`;
			await postAttachmentMessage(api, targetChannel, { text });

			await expect(poHomeChannel.content.mainMessageList.getByText(text)).toBeVisible();

			await poHomeChannel.content.mainMessageList.getByRole('button', { name: 'Collapse' }).last().click();
			await expect(poHomeChannel.content.mainMessageList.getByText(text)).toBeHidden();

			await poHomeChannel.content.mainMessageList.getByRole('button', { name: 'Uncollapse' }).last().click();
			await expect(poHomeChannel.content.mainMessageList.getByText(text)).toBeVisible();
		});

		test('should not affect a different message when one attachment is toggled', async ({ api }) => {
			const textA = `attachment text A ${faker.string.uuid()}`;
			const textB = `attachment text B ${faker.string.uuid()}`;
			await postAttachmentMessage(api, targetChannel, { text: textA });
			await postAttachmentMessage(api, targetChannel, { text: textB });

			const messageA = poHomeChannel.content.messageListItems.filter({ hasText: textA });
			const messageB = poHomeChannel.content.messageListItems.filter({ hasText: textB });

			await expect(messageA).toBeVisible();
			await expect(messageB).toBeVisible();

			// Collapse only the most recent message's attachment (textB).
			await messageB.getByRole('button', { name: 'Collapse' }).click();

			await expect(poHomeChannel.content.mainMessageList.getByText(textA)).toBeVisible();
			await expect(poHomeChannel.content.mainMessageList.getByText(textB)).toBeHidden();
		});

		test('should keep a manually collapsed attachment collapsed after it is scrolled out of view and back', async ({ api }) => {
			const text = `attachment text ${faker.string.uuid()}`;
			await postAttachmentMessage(api, targetChannel, { text });

			await expect(poHomeChannel.content.mainMessageList.getByText(text)).toBeVisible();
			await poHomeChannel.content.mainMessageList.getByRole('button', { name: 'Collapse' }).last().click();
			await expect(poHomeChannel.content.mainMessageList.getByText(text)).toBeHidden();

			await floodChannel(api, targetChannel, 30);
			await waitForFloodToSettle(api, targetChannel);

			await expect(async () => {
				await scrollUp();
				await expect(poHomeChannel.content.mainMessageList.getByText(text)).toBeHidden({ timeout: 1000 });
			}).toPass();
		});
	});

	test.describe('"Collapse Embedded Media by Default" preference enabled', () => {
		let targetChannel: string;

		test.beforeAll(async ({ api }) => {
			targetChannel = await createTargetChannel(api);
			await setUserPreferences(api, { collapseMediaByDefault: true });
		});

		test.beforeEach(async ({ page }) => {
			poHomeChannel = new HomeChannel(page);
			await poHomeChannel.gotoChannel(targetChannel);
		});

		test.afterAll(async ({ api }) => {
			await setUserPreferences(api, { collapseMediaByDefault: false });
			await deleteChannel(api, targetChannel);
		});

		test('should render a new attachment collapsed by default', async ({ api }) => {
			const text = `attachment text ${faker.string.uuid()}`;
			await postAttachmentMessage(api, targetChannel, { text });

			await expect(poHomeChannel.content.mainMessageList.getByRole('button', { name: 'Uncollapse' }).last()).toBeVisible();
			await expect(poHomeChannel.content.mainMessageList.getByText(text)).toBeHidden();
		});

		test('should keep a manually expanded attachment expanded after it is scrolled out of view and back', async ({ api }) => {
			const text = `attachment text ${faker.string.uuid()}`;
			await postAttachmentMessage(api, targetChannel, { text });

			await expect(poHomeChannel.content.mainMessageList.getByText(text)).toBeHidden();
			await poHomeChannel.content.mainMessageList.getByRole('button', { name: 'Uncollapse' }).last().click();
			await expect(poHomeChannel.content.mainMessageList.getByText(text)).toBeVisible();

			await floodChannel(api, targetChannel, 30);
			await waitForFloodToSettle(api, targetChannel);

			await expect(async () => {
				await scrollUp();
				await expect(poHomeChannel.content.mainMessageList.getByText(text)).toBeVisible({ timeout: 1000 });
			}).toPass();
		});
	});

	test.describe('Nested attachments (quoted messages)', () => {
		let targetChannel: string;

		test.beforeAll(async ({ api }) => {
			targetChannel = await createTargetChannel(api);
		});

		test.beforeEach(async ({ page }) => {
			poHomeChannel = new HomeChannel(page);
			await poHomeChannel.gotoChannel(targetChannel);
		});

		test.afterAll(async ({ api }) => {
			await deleteChannel(api, targetChannel);
		});

		test('should keep a quoted attachment collapse state independent from the original message it quotes', async ({ api }) => {
			const text = `nested attachment text ${faker.string.uuid()}`;
			const quoteReplyText = `quoting the attachment ${faker.string.uuid()}`;
			await postAttachmentMessage(api, targetChannel, { text, collapsed: false });

			await expect(poHomeChannel.content.mainMessageList.getByText(text)).toBeVisible();

			await poHomeChannel.content.lastUserMessage.hover();
			await poHomeChannel.content.btnQuoteMessage.click();
			await poHomeChannel.content.sendMessage(quoteReplyText);

			const originalRow = poHomeChannel.content.messageListItems.filter({ hasText: text, hasNotText: quoteReplyText });
			const quoteRow = poHomeChannel.content.messageListItems.filter({ hasText: quoteReplyText });

			// The original message's attachment is untouched by quoting it.
			await expect(originalRow.getByText(text)).toBeVisible();

			const quoteTextVisibleBeforeToggle = await quoteRow.getByText(text).isVisible();

			// Toggling the ORIGINAL message's attachment must not affect the nested copy inside the quote.
			await originalRow.getByRole('button', { name: 'Collapse' }).click();
			await expect(originalRow.getByText(text)).toBeHidden();
			if (quoteTextVisibleBeforeToggle) {
				await expect(quoteRow.getByText(text)).toBeVisible();
			} else {
				await expect(quoteRow.getByText(text)).toBeHidden();
			}

			// Toggling the NESTED copy inside the quote must not affect the now collapsed original.
			await quoteRow.getByRole('button', { name: quoteTextVisibleBeforeToggle ? 'Collapse' : 'Uncollapse' }).click();
			if (quoteTextVisibleBeforeToggle) {
				await expect(quoteRow.getByText(text)).toBeHidden();
			} else {
				await expect(quoteRow.getByText(text)).toBeVisible();
			}
			await expect(originalRow.getByText(text)).toBeHidden();
		});
	});
});
