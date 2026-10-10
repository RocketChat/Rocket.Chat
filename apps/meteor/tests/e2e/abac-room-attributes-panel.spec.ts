import type { IRoom, ISubscription, ITeam, IUser } from '@rocket.chat/core-typings';
import { MongoClient } from 'mongodb';
import type { Page } from 'playwright-core';

import { IS_EE, URL_MONGODB } from './config/constants';
import { Users } from './fixtures/userStates';
import { HomeContent } from './page-objects/fragments/home-content';
import { Listbox } from './page-objects/fragments/listbox';
import { getSettingValueById, setSettingValueById } from './utils';
import type { BaseTest } from './utils/test';
import { expect, test } from './utils/test';

test.use({ storageState: Users.user1.state });

const suffix = Date.now();
const deptKey = `dept_${suffix}`;
const levelKey = `level_${suffix}`;
const roomName = `abac-panel-${suffix}`;
const teamName = `abac-panel-team-${suffix}`;

const settingIds = ['ABAC_Enabled', 'ABAC_PDP_Type', 'ABAC_Attribute_Store', 'ABAC_Enforce_All_Rooms', 'ABAC_Required_Attributes'];

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

const attributesBar = (page: Page) => page.getByRole('dialog').filter({ hasText: 'Attribute-based access control' });
const manageBar = (page: Page) => page.getByRole('dialog').filter({ hasText: 'Managing attributes may affect who can access this room.' });

const openAttributesFromToolbox = async (page: Page) => {
	const content = new HomeContent(page);
	const toolbarButton = content.primaryRoomActionsToolbar.getByRole('button', { name: 'Attribute-based access control' });

	if (await toolbarButton.isVisible()) {
		await toolbarButton.click();
		return;
	}

	await content.btnToolbarOptions.click();
	await content.optionsMenu.getByRole('menuitem', { name: 'Attribute-based access control' }).click();
};

test.describe.serial('abac-room-attributes-panel', () => {
	let connection: MongoClient;
	let rid: string;
	let teamRoomId: string;
	let teamId: string;
	const attributeIds: string[] = [];
	const savedSettings = new Map<string, unknown>();

	test.skip(!IS_EE, 'Enterprise Only');

	const memberUsernames = async (roomId: string) =>
		connection
			.db()
			.collection<ISubscription>('rocketchat_subscription')
			.find({ rid: roomId })
			.map(({ u }) => u.username)
			.toArray();

	const makeOwnedAbacRoom = async (api: BaseTest['api'], roomId: string) => {
		expect((await api.post(`/abac/rooms/${roomId}/attributes`, { attributes: { [deptKey]: ['eng'] } })).status()).toBe(200);
		expect((await api.post('/groups.addOwner', { roomId, userId: Users.user1.data._id })).status()).toBe(200);
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

		const groupResponse = await api.post('/groups.create', {
			name: roomName,
			members: [Users.user1.data.username, Users.user2.data.username],
		});
		expect(groupResponse.status()).toBe(200);
		rid = ((await groupResponse.json()) as { group: IRoom }).group._id;
		await makeOwnedAbacRoom(api, rid);

		const teamResponse = await api.post('/teams.create', { name: teamName, type: 1, members: [Users.user1.data.username] });
		expect(teamResponse.status()).toBe(200);
		const { team } = (await teamResponse.json()) as { team: ITeam };
		teamId = team._id;
		teamRoomId = team.roomId;
		await makeOwnedAbacRoom(api, teamRoomId);

		expect(await memberUsernames(rid)).toHaveLength(3);

		await setSettingValueById(api, 'ABAC_Required_Attributes', [deptKey, levelKey]);
		await setSettingValueById(api, 'ABAC_Enforce_All_Rooms', true);
	});

	test.afterAll(async ({ api }) => {
		await api.post('/rooms.delete', { roomId: rid });
		await api.post('/teams.delete', { teamId });

		for (const [id, value] of savedSettings) {
			await setSettingValueById(api, id, value);
		}

		for (const attributeId of attributeIds) {
			await api.delete(`/abac/attributes/${attributeId}`);
		}
		await connection
			.db()
			.collection<IUser>('users')
			.updateMany({ username: { $in: Object.keys(userAttributes) } }, { $pull: { abacAttributes: { key: { $in: [deptKey, levelKey] } } } });
		await connection.close();
	});

	test('a room owner unlocks a locked group from the callout, and only members without the new value are removed', async ({ page }) => {
		const listbox = new Listbox(page);

		await page.goto(`/group/${roomName}`);
		const callout = page.getByText('Channel locked. Required ABAC room attributes missing.');
		await expect(callout).toBeVisible();

		const calloutAction = callout.locator('..').getByRole('button', { name: 'Manage attributes' });

		await calloutAction.click();
		await expect(manageBar(page)).toBeVisible();

		await manageBar(page).getByRole('button', { name: 'Back' }).last().click();
		await expect(attributesBar(page).getByRole('region', { name: levelKey })).toContainText('Not set');

		await calloutAction.click();
		await expect(manageBar(page)).toBeVisible();
		await expect(manageBar(page).getByRole('button', { name: 'Review changes' })).toBeDisabled();

		await manageBar(page).getByPlaceholder('Select attribute values').last().click();
		await listbox.selectOption('high', true);
		await manageBar(page).getByText('Managing attributes may affect who can access this room.').click();

		await manageBar(page).getByRole('button', { name: 'Review changes' }).click();
		await expect(page.getByText('Members (preview)')).toBeVisible();

		const losesAccess = page.getByRole('list', { name: 'Loses access' });
		await expect(losesAccess).toContainText(Users.user2.data.username);
		await expect(losesAccess).not.toContainText(Users.user1.data.username);

		await page.getByRole('button', { name: 'Save', exact: true }).click();
		await expect(page.getByText('Room attributes updated')).toBeVisible();

		await expect(attributesBar(page).getByRole('region', { name: levelKey })).toContainText('high');
		await expect(callout).not.toBeVisible();

		await expect.poll(() => memberUsernames(rid)).not.toContain(Users.user2.data.username);
		expect(await memberUsernames(rid)).toEqual(expect.arrayContaining([Users.admin.data.username, Users.user1.data.username]));
	});

	test('a locked team names the team, and its attributes are reachable from the callout and the toolbox', async ({ page }) => {
		await page.goto(`/group/${teamName}`);
		const callout = page.getByText('Team locked. Required ABAC room attributes missing.');
		await expect(callout).toBeVisible();

		await callout.locator('..').getByRole('button', { name: 'Manage attributes' }).click();
		await expect(manageBar(page)).toBeVisible();
		await manageBar(page).getByRole('button', { name: 'Close' }).click();
		await expect(manageBar(page)).not.toBeVisible();

		await openAttributesFromToolbox(page);
		await expect(attributesBar(page).getByRole('region', { name: deptKey })).toContainText('eng');
		await expect(attributesBar(page).getByRole('region', { name: levelKey })).toContainText('Not set');
	});
});
