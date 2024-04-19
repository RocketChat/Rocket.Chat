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
	// test.use({ storageState: Users.user1.state });

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
			await poHomeChannel.content.galleryImage.evaluate((el) => parseInt(window.getComputedStyle(el).getPropertyValue('width'))),
		).toBeLessThanOrEqual(viewport.width);

		expect(
			await poHomeChannel.content.galleryImage.evaluate((el) => parseInt(window.getComputedStyle(el).getPropertyValue('height'))),
		).toBeLessThanOrEqual(viewport.height);
	});

	test('expect to zoom in image', async () => {
		await (await poHomeChannel.content.getGalleryButton('zoom-in')).click();

		expect(parseInt((await poHomeChannel.content.galleryImage.getAttribute('data-qa-zoom-scale')) as string)).toBeGreaterThan(1);
	});

	test('expect to zoom out image', async () => {
		await (await poHomeChannel.content.getGalleryButton('zoom-out')).click();

		expect(parseInt((await poHomeChannel.content.galleryImage.getAttribute('data-qa-zoom-scale')) as string)).toEqual(1);
	});

	test('expect to resize image to default ratio', async () => {
		await expect(await poHomeChannel.content.getGalleryButton('zoom-out')).toBeDisabled();

		await (await poHomeChannel.content.getGalleryButton('zoom-in')).dblclick();

		await expect(await poHomeChannel.content.getGalleryButton('zoom-out')).toBeEnabled();

		await (await poHomeChannel.content.getGalleryButton('resize')).click();

		expect(parseInt((await poHomeChannel.content.galleryImage.getAttribute('data-qa-zoom-scale')) as string)).toEqual(1);
	});

	test('expect to close gallery', async () => {
		await (await poHomeChannel.content.getGalleryButton('close')).click();

		await expect(poHomeChannel.content.galleryImage).not.toBeVisible();
	});
});
