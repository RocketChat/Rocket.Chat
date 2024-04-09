import { createAuxContext } from './fixtures/createAuxContext';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';
import { expect, test } from './utils/test';

test.use({ storageState: Users.user1.state });

test.describe.parallel('image-gallery', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;
	// Using more than 5 images so that new images need to be loaded by the gallery
	const imageNames = ['number1.png', 'number2.png', 'number3.png', 'number4.png', 'number5.png', 'number6.png'];

	test.beforeAll(async ({ api, browser }) => {
		targetChannel = await createTargetChannel(api);
		const { page } = await createAuxContext(browser, Users.user1);
		poHomeChannel = new HomeChannel(page);

		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.content.btnJoinRoom.click();
		for await (const imageName of imageNames) {
			await poHomeChannel.content.sendFileMessage(imageName);
			await poHomeChannel.content.btnModalConfirm.click();
			await expect(poHomeChannel.content.lastUserMessage).toContainText(imageName);
		}
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
		await poHomeChannel.sidenav.openChat(targetChannel);
	});

	test.afterAll(async ({ api }) => {
		expect((await api.post('/channels.delete', { roomName: targetChannel })).status()).toBe(200);
	});

	test('expect successfully move to older images by using the left arrow button', async () => {
		await poHomeChannel.content.lastUserMessage.getByRole('img').click();

		/* eslint-disable no-await-in-loop */
		for (let i = 0; i < imageNames.length - 1; i++) {
			await expect(poHomeChannel.content.nextSlideButton).toBeEnabled();
			await poHomeChannel.content.nextSlideButton.click();
		}
		await expect(poHomeChannel.content.nextSlideButton).toBeDisabled();
	});

	test('expect successfully move to newer images by using the right arrow button', async () => {
		await poHomeChannel.content.lastUserMessage.getByRole('img').click();

		/* eslint-disable no-await-in-loop */
		for (let i = 0; i < imageNames.length - 1; i++) {
			await poHomeChannel.content.nextSlideButton.click();
		}

		for (let i = 0; i < imageNames.length - 1; i++) {
			await expect(poHomeChannel.content.previousSlideButton).toBeEnabled();
			await poHomeChannel.content.previousSlideButton.click();
		}
		await expect(poHomeChannel.content.previousSlideButton).toBeDisabled();
	});

	test('expect successfully close gallery', async () => {
		await poHomeChannel.content.lastUserMessage.getByRole('img').click();

		await expect(poHomeChannel.content.closeGalleryButton).toBeEnabled();
		await poHomeChannel.content.closeGalleryButton.click();
		await expect(poHomeChannel.content.closeGalleryButton).not.toBeVisible();
		await expect(poHomeChannel.content.previousSlideButton).not.toBeVisible();
		await expect(poHomeChannel.content.nextSlideButton).not.toBeVisible();
	});
});
