import path from 'path';

import type { Credentials } from '@rocket.chat/api-client';
import type { ImageAttachmentProps, IRoom, IUser, SettingValue } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import sharp from 'sharp';

import { getCredentials, request } from '../../data/api-data';
import { uploadFileToRC } from '../../data/file.helper';
import { getSettingValueById, updateSetting } from '../../data/permissions.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import type { IRequestConfig, TestUser } from '../../data/users.helper';
import { createUser, deleteUser, login } from '../../data/users.helper';

const testImagePath = path.join(__dirname, '../../mocks/files/exif-orientation-6.jpg');
const testImageName = 'exif-orientation-6.jpg';

const downloadBuffer = async (url: string, auth: Credentials): Promise<Buffer> => {
	const response = await request.get(url).set(auth).buffer(true).expect(200);
	return response.body as Buffer;
};

describe('[File Upload - Image Rotation]', () => {
	before((done) => getCredentials(done));

	let user: TestUser<IUser>;
	const userPassword = `pass${Date.now()}`;
	let userCredentials: Credentials;
	let testRoom: IRoom;
	let rotateImagesSetting: SettingValue;
	let stripExifSetting: SettingValue;
	let thumbnailsEnabledSetting: SettingValue;
	let thumbnailsWidthSetting: SettingValue;
	let thumbnailsHeightSetting: SettingValue;

	before(async () => {
		user = await createUser({ joinDefaultChannels: false, password: userPassword });
		userCredentials = await login(user.username, userPassword);
		testRoom = (await createRoom({ type: 'p', name: `rotate-upload-${Date.now()}`, members: [user.username] })).body.group;

		rotateImagesSetting = await getSettingValueById('FileUpload_RotateImages');
		stripExifSetting = await getSettingValueById('Message_Attachments_Strip_Exif');
		thumbnailsEnabledSetting = await getSettingValueById('Message_Attachments_Thumbnails_Enabled');
		thumbnailsWidthSetting = await getSettingValueById('Message_Attachments_Thumbnails_Width');
		thumbnailsHeightSetting = await getSettingValueById('Message_Attachments_Thumbnails_Height');

		await updateSetting('FileUpload_RotateImages', true, false);
		await updateSetting('Message_Attachments_Strip_Exif', true, false);
		await updateSetting('Message_Attachments_Thumbnails_Enabled', true);
	});

	after(async () => {
		await Promise.all([
			updateSetting('FileUpload_RotateImages', rotateImagesSetting),
			updateSetting('Message_Attachments_Strip_Exif', stripExifSetting),
			updateSetting('Message_Attachments_Thumbnails_Enabled', thumbnailsEnabledSetting),
			deleteRoom({ type: 'p', roomId: testRoom._id }),
			deleteUser(user),
		]);
	});

	it('should rotate pixels and strip EXIF orientation', async () => {
		const fixtureMetadata = await sharp(testImagePath).metadata();
		expect(fixtureMetadata.width).to.equal(719);
		expect(fixtureMetadata.height).to.equal(479);
		expect(fixtureMetadata.orientation).to.equal(6);

		const requestConfig: IRequestConfig = { request, credentials: userCredentials };
		const { message } = await uploadFileToRC(testRoom._id, testImagePath, 'rotation-exif-test', requestConfig);

		expect(message).to.have.property('attachments');
		const attachment = message.attachments?.find((item) => item.title === testImageName);
		expect(attachment).to.be.an('object');

		const fileUrl = (attachment as { title_link?: string }).title_link;
		const thumbUrl = (attachment as ImageAttachmentProps).image_url;

		expect(fileUrl).to.be.a('string');
		expect(thumbUrl).to.be.a('string');

		const originalBuffer = await downloadBuffer(fileUrl as string, userCredentials);
		const originalMetadata = await sharp(originalBuffer).metadata();

		expect(originalMetadata.width).to.equal(479);
		expect(originalMetadata.height).to.equal(719);
		expect(originalMetadata.exif).to.be.undefined;
	});

	it('should generate thumbnail from rotated image', async () => {
		const requestConfig: IRequestConfig = { request, credentials: userCredentials };
		const { message } = await uploadFileToRC(testRoom._id, testImagePath, 'rotation-thumb-test', requestConfig);

		expect(message).to.have.property('attachments');
		const attachment = message.attachments?.find((item) => item.title === testImageName);
		expect(attachment).to.be.an('object');

		const fileUrl = (attachment as { title_link?: string }).title_link;
		const thumbUrl = (attachment as ImageAttachmentProps).image_url;

		expect(fileUrl).to.be.a('string');
		expect(thumbUrl).to.be.a('string');

		const originalBuffer = await downloadBuffer(fileUrl as string, userCredentials);
		const originalMetadata = await sharp(originalBuffer).metadata();
		const thumbBuffer = await downloadBuffer(thumbUrl as string, userCredentials);
		const thumbMetadata = await sharp(thumbBuffer).metadata();
		const thumbWidthSetting = Number(thumbnailsWidthSetting);
		const thumbHeightSetting = Number(thumbnailsHeightSetting);
		const originalWidth = originalMetadata.width as number;
		const originalHeight = originalMetadata.height as number;
		const resizeFactor = Math.min(thumbWidthSetting / originalWidth, thumbHeightSetting / originalHeight);

		expect(thumbMetadata.width).to.be.closeTo(Math.round(originalWidth * resizeFactor), 1);
		expect(thumbMetadata.height).to.be.closeTo(Math.round(originalHeight * resizeFactor), 1);
	});

	describe('when FileUpload_RotateImages is disabled', () => {
		before(async () => {
			await updateSetting('FileUpload_RotateImages', false);
		});

		after(async () => {
			await updateSetting('FileUpload_RotateImages', rotateImagesSetting);
		});

		it('should NOT rotate pixels', async () => {
			const requestConfig: IRequestConfig = { request, credentials: userCredentials };
			const { message } = await uploadFileToRC(testRoom._id, testImagePath, 'no-rotation-test', requestConfig);

			expect(message).to.have.property('attachments');
			const attachment = message.attachments?.find((item) => item.title === testImageName);
			expect(attachment).to.be.an('object');

			const fileUrl = (attachment as { title_link?: string }).title_link;
			expect(fileUrl).to.be.a('string');

			const originalBuffer = await downloadBuffer(fileUrl as string, userCredentials);
			const originalMetadata = await sharp(originalBuffer).metadata();

			expect(originalMetadata.width).to.equal(719);
			expect(originalMetadata.height).to.equal(479);
		});
	});
});
