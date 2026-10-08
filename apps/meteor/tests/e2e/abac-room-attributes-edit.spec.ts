import type { IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { MongoClient } from 'mongodb';
import type { Page } from 'playwright-core';

import { IS_EE, URL_MONGODB } from './config/constants';
import { Users } from './fixtures/userStates';
import { Listbox } from './page-objects/fragments/listbox';
import { getSettingValueById, setSettingValueById } from './utils';
import type { BaseTest } from './utils/test';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });

const suffix = Date.now();
const deptKey = `dept_${suffix}`;
const levelKey = `level_${suffix}`;

const settingIds = ['ABAC_Enabled', 'ABAC_PDP_Type', 'ABAC_Attribute_Store', 'ABAC_Enforce_All_Rooms'];

const userAttributes: Record<string, IUser['abacAttributes']> = {
	[Users.admin.data.username]: [
		{ key: deptKey, values: ['eng'] },
		{ key: levelKey, values: ['high'] },
	],
	[Users.user1.data.username]: [
		{ key: deptKey, values: ['eng'] },
		{ key: levelKey, values: ['high', 'low'] },
	],
	[Users.user2.data.username]: [{ key: deptKey, values: ['eng'] }],
};

const addLevel = async (page: Page, rid: string, level: string) => {
	const listbox = new Listbox(page);

	await page.goto(`/admin/ABAC/rooms/edit/${rid}`);
	await expect(page.getByRole('button', { name: 'Review changes' })).toBeDisabled();

	await page.getByRole('button', { name: 'Add Attribute' }).click();
	await page.getByPlaceholder('Search attribute').last().click();
	await listbox.selectOption(levelKey, true);
	await page.getByPlaceholder('Select attribute values').last().click();
	await listbox.selectOption(level, true);
	await page.getByText('Room to be ABAC-managed').click();

	await page.getByRole('button', { name: 'Review changes' }).click();
	await expect(page.getByText('Members (preview)')).toBeVisible();
};

test.describe.serial('abac-room-attributes-edit', () => {
	let connection: MongoClient;
	const attributeIds: string[] = [];
	const roomIds: string[] = [];
	const savedSettings = new Map<string, unknown>();

	test.skip(!IS_EE, 'Enterprise Only');

	const memberUsernames = async (rid: string) =>
		connection
			.db()
			.collection<ISubscription>('rocketchat_subscription')
			.find({ rid })
			.map(({ u }) => u.username)
			.toArray();

	const createRoom = async (api: BaseTest['api'], name: string) => {
		const response = await api.post('/groups.create', { name, members: [Users.user1.data.username, Users.user2.data.username] });
		expect(response.status()).toBe(200);
		const { group } = (await response.json()) as { group: IRoom };
		roomIds.push(group._id);

		expect((await api.post(`/abac/rooms/${group._id}/attributes`, { attributes: { [deptKey]: ['eng'] } })).status()).toBe(200);
		expect(await memberUsernames(group._id)).toHaveLength(3);

		return group._id;
	};

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
		]);

		for (const [key, values] of [
			[deptKey, ['eng', 'sales']],
			[levelKey, ['high', 'low']],
		] as const) {
			expect((await api.post('/abac/attributes', { key, values })).status()).toBe(200);
			const { attributes } = await (await api.get('/abac/attributes', { key })).json();
			attributeIds.push(attributes.find((attribute: { key: string }) => attribute.key === key)._id);
		}

		for (const [username, attributes] of Object.entries(userAttributes)) {
			await connection
				.db()
				.collection<IUser>('users')
				.updateOne({ username }, { $push: { abacAttributes: { $each: attributes ?? [] } } });
		}
	});

	test.afterAll(async ({ api }) => {
		for (const roomId of roomIds) {
			await api.post('/rooms.delete', { roomId });
		}
		for (const attributeId of attributeIds) {
			await api.delete(`/abac/attributes/${attributeId}`);
		}
		await connection
			.db()
			.collection<IUser>('users')
			.updateMany({ username: { $in: Object.keys(userAttributes) } }, { $pull: { abacAttributes: { key: { $in: [deptKey, levelKey] } } } });
		await connection.close();

		for (const [id, value] of savedSettings) {
			await setSettingValueById(api, id, value);
		}
	});

	test('an administrator sees who loses access before saving, and only they are removed', async ({ page, api }) => {
		const rid = await createRoom(api, `abac-edit-${suffix}`);

		await addLevel(page, rid, 'high');

		const losesAccess = page.getByRole('list', { name: 'Loses access' });
		await expect(losesAccess).toContainText(Users.user2.data.username);
		await expect(losesAccess).not.toContainText(Users.user1.data.username);
		await expect(losesAccess).not.toContainText(Users.admin.data.username);

		await page.getByRole('button', { name: 'Save', exact: true }).click();
		await expect(page.getByText('Room attributes updated')).toBeVisible();
		await expect(page.getByRole('dialog').filter({ hasText: 'Are you sure?' })).toHaveCount(0);

		await expect.poll(() => memberUsernames(rid)).toEqual(expect.arrayContaining([Users.admin.data.username, Users.user1.data.username]));
		expect(await memberUsernames(rid)).not.toContain(Users.user2.data.username);
	});

	test('an administrator who would lose access has to confirm, and is removed with the others', async ({ page, api }) => {
		const rid = await createRoom(api, `abac-edit-self-${suffix}`);

		await addLevel(page, rid, 'low');

		const losesAccess = page.getByRole('list', { name: 'Loses access' });
		await expect(losesAccess).toContainText(Users.user2.data.username);
		await expect(losesAccess).toContainText(Users.admin.data.username);

		await page.getByRole('button', { name: 'Save', exact: true }).click();
		const confirmation = page.getByRole('dialog').filter({ hasText: 'Are you sure?' });
		await expect(confirmation).toContainText(`You will lose access to abac-edit-self-${suffix}`);

		await confirmation.getByRole('button', { name: 'Save', exact: true }).click();
		await expect(page.getByText('Room attributes updated')).toBeVisible();

		await expect.poll(() => memberUsernames(rid)).toEqual([Users.user1.data.username]);
	});
});
