import { createAuxContext } from './fixtures/createAuxContext';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, deleteChannel } from './utils';
import { expect, test } from './utils/test';

test.describe.serial('Image Gallery', async () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;
	const viewport = {
		width: 1280,
		height: 720,
	};

	test.use({ viewport });

	test.beforeAll(async ({ api, browser }) => {
		targetChannel = await createTargetChannel(api);
		const { page } = await createAuxContext(browser, Users.user1);
		poHomeChannel = new HomeChannel(page);

		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.content.btnJoinRoom.click();

		await poHomeChannel.content.sendFileMessage('test-large-image.jpeg');
		await poHomeChannel.content.btnModalConfirm.click();

		await expect(poHomeChannel.content.lastUserMessage).toContainText('test-large-image.jpeg');

		await poHomeChannel.content.lastUserMessage.locator('img.gallery-item').click();
	});

	test.afterAll(async ({ api }) => {
		await deleteChannel(api, targetChannel);
	});

	test('expect to have a large image not out of viewport bounds', async () => {
		expect(
			await poHomeChannel.content.imageGalleryImage.evaluate((el) => parseInt(window.getComputedStyle(el).getPropertyValue('width'))),
		).toBeLessThanOrEqual(viewport.width);

		expect(
			await poHomeChannel.content.imageGalleryImage.evaluate((el) => parseInt(window.getComputedStyle(el).getPropertyValue('height'))),
		).toBeLessThanOrEqual(viewport.height);
	});

	test('expect to zoom in image', async () => {
		await (await poHomeChannel.content.getGalleryButtonByName('zoom-in')).click();

		expect(parseInt((await poHomeChannel.content.imageGalleryImage.getAttribute('data-qa-zoom-scale')) as string)).toBeGreaterThan(1);
	});

	test('expect to zoom out image', async () => {
		await (await poHomeChannel.content.getGalleryButtonByName('zoom-out')).click();

		expect(parseInt((await poHomeChannel.content.imageGalleryImage.getAttribute('data-qa-zoom-scale')) as string)).toEqual(1);
	});

	test('expect to resize image to default ratio', async () => {
		await expect(await poHomeChannel.content.getGalleryButtonByName('zoom-out')).toBeDisabled();

		await (await poHomeChannel.content.getGalleryButtonByName('zoom-in')).dblclick();

		await expect(await poHomeChannel.content.getGalleryButtonByName('zoom-out')).toBeEnabled();

		await (await poHomeChannel.content.getGalleryButtonByName('resize')).click();

		expect(parseInt((await poHomeChannel.content.imageGalleryImage.getAttribute('data-qa-zoom-scale')) as string)).toEqual(1);
	});

	test('expect to close gallery', async () => {
		await (await poHomeChannel.content.getGalleryButtonByName('close')).click();

		await expect(poHomeChannel.content.imageGalleryImage).not.toBeVisible();
	});
});
