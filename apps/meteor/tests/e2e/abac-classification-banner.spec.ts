import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { MongoClient } from 'mongodb';

import { IS_EE, URL_MONGODB } from './config/constants';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetGroupAndReturnFullRoom, deleteRoom, setSettingValueById } from './utils';
import { convertHexToRGB } from './utils/convertHexToRGB';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });

const attrKey = `clearance_${Date.now()}`;

const bannersConfig = {
	version: 1,
	enabled: true,
	banner: {
		style: 'classic',
		uppercase: true,
		monospace: false,
		delimiter: ' // ',
		colorMode: 'highest',
		fallbackText: 'NO CLASSIFICATION DATA',
		fallbackColor: '#6C727A',
	},
	attributes: [
		{
			id: 'clearance',
			source: attrKey,
			label: 'Clearance',
			showInBanner: true,
			showLabel: true,
			bannerLabel: 'CLEARANCE',
			labelSeparator: '-',
			valueSeparator: '/',
			sortAlpha: false,
			groupThreshold: 0,
			multipleLabel: 'MULTIPLE',
			drivesColor: true,
			values: [
				{ source: 'TS', label: 'TOP SECRET', color: '#ff8c00' },
				{ source: 'U', label: 'UNCLASSIFIED', color: '#007a33' },
			],
		},
	],
};

test.describe.serial('abac-classification-banner', () => {
	let poHomeChannel: HomeChannel;
	let connection: MongoClient;
	let room: IRoom;
	let attributeId: string;

	test.skip(!IS_EE, 'Enterprise Only');

	test.beforeAll(async ({ api }) => {
		connection = await MongoClient.connect(URL_MONGODB);

		await Promise.all([
			setSettingValueById(api, 'ABAC_Enabled', true),
			setSettingValueById(api, 'ABAC_PDP_Type', 'local'),
			setSettingValueById(api, 'ABAC_Attribute_Store', 'local'),
			setSettingValueById(api, 'ABAC_Classification_Banners_Enabled', true),
			setSettingValueById(api, 'ABAC_Classification_Banners_Config', JSON.stringify(bannersConfig)),
		]);

		expect((await api.post('/abac/attributes', { key: attrKey, values: ['TS', 'U'] })).status()).toBe(200);
		const { attributes } = await (await api.get('/abac/attributes', { key: attrKey })).json();
		attributeId = attributes.find((attribute: { key: string }) => attribute.key === attrKey)._id;

		// the local PDP only keeps members whose own attributes match the room's,
		// so the admin gets them straight in the database before the room is tagged
		await connection
			.db()
			.collection<IUser>('users')
			.updateOne({ username: Users.admin.data.username }, { $push: { abacAttributes: { key: attrKey, values: ['TS', 'U'] } } });

		({ group: room } = await createTargetGroupAndReturnFullRoom(api));
		expect((await api.put(`/abac/rooms/${room._id}/attributes/${attrKey}`, { values: ['TS'] })).status()).toBe(200);
	});

	test.afterAll(async ({ api }) => {
		await deleteRoom(api, room._id);
		await api.delete(`/abac/attributes/${attributeId}`);
		await connection
			.db()
			.collection<IUser>('users')
			.updateOne({ username: Users.admin.data.username }, { $pull: { abacAttributes: { key: attrKey } } });
		await connection.close();

		await Promise.all([
			setSettingValueById(api, 'ABAC_Classification_Banners_Config', ''),
			setSettingValueById(api, 'ABAC_Classification_Banners_Enabled', false),
			setSettingValueById(api, 'ABAC_Enabled', false),
		]);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await page.goto('/home');
	});

	test('should show the classification banner built from the config in an ABAC room', async ({ page }) => {
		await poHomeChannel.navbar.openChat(room.name as string);

		const banner = page.getByRole('region', { name: 'Room Attributes' });
		await expect(banner).toBeVisible();
		await expect(banner).toHaveText('CLEARANCE-TOP SECRET');
		await expect(banner).toHaveCSS('background-color', convertHexToRGB('#ff8c00'));
	});

	test('should not show the banner when classification banners are disabled', async ({ page, api }) => {
		await setSettingValueById(api, 'ABAC_Classification_Banners_Enabled', false);

		await poHomeChannel.navbar.openChat(room.name as string);
		await expect(poHomeChannel.composer.inputMessage).toBeVisible();
		await expect(page.getByRole('region', { name: 'Room Attributes' })).toHaveCount(0);
	});
});
