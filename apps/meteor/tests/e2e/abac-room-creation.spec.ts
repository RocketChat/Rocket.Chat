import type { IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { MongoClient } from 'mongodb';

import { IS_EE, URL_MONGODB } from './config/constants';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { getSettingValueById, setSettingValueById } from './utils';
import { expect, test } from './utils/test';

test.use({ storageState: Users.user1.state });

const attrKey = `dept_${Date.now()}`;

const settingIds = ['ABAC_Enabled', 'ABAC_PDP_Type', 'ABAC_Attribute_Store', 'ABAC_Enforce_All_Rooms', 'ABAC_Restrict_To_Owned_Attributes'];

test.describe.serial('abac-room-creation', () => {
	let poHomeChannel: HomeChannel;
	let connection: MongoClient;
	let attributeId: string;
	const roomName = `abac-created-${Date.now()}`;
	const savedSettings = new Map<string, unknown>();

	test.skip(!IS_EE, 'Enterprise Only');

	test.beforeAll(async ({ api }) => {
		connection = await MongoClient.connect(URL_MONGODB);

		for (const id of settingIds) {
			savedSettings.set(id, await getSettingValueById(api, id));
		}

		await Promise.all([
			setSettingValueById(api, 'ABAC_Enabled', true),
			setSettingValueById(api, 'ABAC_PDP_Type', 'local'),
			setSettingValueById(api, 'ABAC_Attribute_Store', 'local'),
			setSettingValueById(api, 'ABAC_Enforce_All_Rooms', false),
			setSettingValueById(api, 'ABAC_Restrict_To_Owned_Attributes', true),
		]);

		expect((await api.post('/abac/attributes', { key: attrKey, values: ['eng', 'sales'] })).status()).toBe(200);
		const { attributes } = await (await api.get('/abac/attributes', { key: attrKey })).json();
		attributeId = attributes.find((attribute: { key: string }) => attribute.key === attrKey)._id;

		await connection
			.db()
			.collection<IUser>('users')
			.updateOne({ username: Users.user1.data.username }, { $push: { abacAttributes: { key: attrKey, values: ['eng'] } } });
	});

	test.afterAll(async ({ api }) => {
		const room = await connection.db().collection<IRoom>('rocketchat_room').findOne({ name: roomName });
		if (room) {
			await api.post('/rooms.delete', { roomId: room._id });
		}
		await api.delete(`/abac/attributes/${attributeId}`);
		await connection
			.db()
			.collection<IUser>('users')
			.updateOne({ username: Users.user1.data.username }, { $pull: { abacAttributes: { key: attrKey } } });
		await connection.close();

		for (const [id, value] of savedSettings) {
			await setSettingValueById(api, id, value);
		}
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await poHomeChannel.goto();
	});

	test('a creator who is not an administrator walks the four steps and the room matches the preview', async ({ page }) => {
		const modal = poHomeChannel.navbar.modals.Channel;

		await poHomeChannel.navbar.openCreate('Channel');
		await modal.inputName.fill(roomName);
		await modal.addMember(Users.user2.data.username);
		await expect(modal.getStepIndicator(1, 2)).toBeVisible();

		await modal.checkboxAbacManaged.click();
		await expect(modal.getStepIndicator(1, 4)).toBeVisible();
		await modal.btnNext.click();

		await expect(modal.getStepIndicator(2, 4)).toBeVisible();
		await modal.selectAttribute(attrKey, ['eng']);
		await modal.btnNext.click();

		await expect(modal.getStepIndicator(3, 4)).toBeVisible();
		await expect(modal.checkboxFederated).toHaveCount(0);
		await modal.btnNext.click();

		await expect(modal.getStepIndicator(4, 4)).toBeVisible();
		await expect(modal.getPreviewGroup('Compliant')).toContainText(Users.user1.data.username);
		await expect(modal.getPreviewGroup('Non-compliant')).toContainText(Users.user2.data.username);

		await modal.create();
		await expect(page).toHaveURL(`/group/${roomName}`);

		const room = await connection.db().collection<IRoom>('rocketchat_room').findOne({ name: roomName });
		expect(room?.abacAttributes).toEqual([{ key: attrKey, values: ['eng'] }]);

		const members = await connection
			.db()
			.collection<ISubscription>('rocketchat_subscription')
			.find({ rid: room?._id })
			.map(({ u }) => u.username)
			.toArray();
		expect(members).toEqual([Users.user1.data.username]);
	});
});
